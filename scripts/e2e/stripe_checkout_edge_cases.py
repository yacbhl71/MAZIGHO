#!/usr/bin/env python3
"""MAZIGHO Stripe Connect TEST E2E; never runs against live checkout.

Usage: python3 scripts/e2e/stripe_checkout_edge_cases.py --scenario all
Requires a dedicated customer account and three *distinct*, test-only products.
See scripts/e2e/README.md before running. No credentials or card data are logged.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from urllib.parse import urlparse
from urllib.request import urlopen

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright

CART_KEY = "boutique_premium_cart"
# Official Stripe test cards. 4000 0056 2003 is incomplete (12 digits).
DECLINE_CARD = "4000000000009995"
SUCCESS_CARD = "4242424242424242"
STRIPE_HOST = re.compile(r"^https://checkout\.stripe\.com/")
SCENARIOS = ("decline", "abandon", "webhook")


class PreconditionError(RuntimeError):
    pass


@dataclass(frozen=True)
class Config:
    base_url: str
    email: str
    password: str
    products: dict[str, str]
    timeout_ms: int
    expiry_timeout_s: int
    screenshot_dir: str | None


def trpc_data(payload: dict) -> dict | list:
    """Unwrap the actual tRPC HTTP result (never silently accept an error)."""
    if "error" in payload:
        raise AssertionError(f"tRPC error: {payload['error'].get('message', 'unknown')}")
    return payload["result"]["data"]["json"]


def api(context, base: str, path: str, input_value=None):
    kwargs = {}
    if input_value is not None:
        kwargs["params"] = {"input": json.dumps({"json": input_value})}
    response = context.request.get(f"{base}/api/trpc/{path}", timeout=15000, **kwargs)
    if response.status != 200:
        raise AssertionError(f"{path}: HTTP {response.status} (body withheld)")
    return trpc_data(response.json())


def require_test_checkout(context, base: str) -> None:
    status = api(context, base, "storefront.getPaymentAvailability")
    if status.get("mode") != "stripe_connect_test" or status.get("enabled") is not True:
        raise PreconditionError(
            f"Checkout Stripe Test indisponible ({status.get('mode')}, "
            f"{status.get('reason', 'disabled')}). Aucune session créée. "
            "Ne pas basculer automatiquement Stripe Live ou lever ce verrou."
        )


def public_mode_preflight(base: str) -> None:
    """Reject Live/disabled mode before starting a browser or creating orders."""
    with urlopen(f"{base}/api/trpc/storefront.getPaymentAvailability", timeout=15) as response:
        if urlparse(response.geturl()).netloc != urlparse(base).netloc:
            raise PreconditionError("Le domaine redirige vers un autre hôte. Utiliser l'URL canonique avec le même hôte pour les produits et le panier.")
        availability = trpc_data(json.load(response))
    if availability.get("mode") != "stripe_connect_test" or availability.get("enabled") is not True:
        raise PreconditionError(
            f"Stripe Test fermé ({availability.get('mode')}, {availability.get('reason', 'disabled')}). "
            "Aucune navigation de paiement exécutée."
        )


def login(page, cfg: Config) -> None:
    page.goto(f"{cfg.base_url}/login", wait_until="domcontentloaded")
    page.locator("#login-email").fill(cfg.email)
    page.locator("#login-password").fill(cfg.password)
    page.locator("form button[type=submit]").click()
    page.wait_for_url(lambda url: "/login" not in url.path, timeout=cfg.timeout_ms)
    # Explicitly verify authentication, not just a client-side navigation.
    user = api(page.context, cfg.base_url, "auth.me")
    if not isinstance(user, dict) or not user.get("id"):
        raise PreconditionError("Le compte de test n'est pas connecté.")


def get_orders(context, cfg: Config) -> dict[int, dict]:
    rows = api(context, cfg.base_url, "shop.orders.getMyOrders")
    return {int(item["id"]): item for item in rows}


def cart_items(page) -> list[dict]:
    return page.evaluate("key => JSON.parse(localStorage.getItem(key) || '[]')", CART_KEY)


def stock_for(context, cfg: Config, product_id: int, variant_id: int | None) -> int:
    product = api(context, cfg.base_url, "products.getById", {"id": product_id, "locale": "fr"})
    if not product:
        raise PreconditionError(f"Produit de test #{product_id} non disponible")
    variants = product.get("variants") or []
    if variant_id is not None:
        variant = next((v for v in variants if v["id"] == variant_id), None)
        if variant is None:
            raise PreconditionError(f"Variante de test #{variant_id} absente")
        return int(variant["stock"])
    return int(product["stock"])


def add_dedicated_product(page, cfg: Config, scenario: str) -> tuple[int, int | None]:
    page.goto(cfg.products[scenario], wait_until="domcontentloaded")
    # Variant products need an explicit choice; the runner uses the first available one.
    variant_group = page.get_by_text("Choisissez la déclinaison souhaitée.", exact=False)
    if variant_group.count():
        buttons = page.get_by_role("button", name=re.compile(r"\ben stock\b", re.I))
        for index in range(buttons.count()):
            button = buttons.nth(index)
            if button.is_visible() and button.is_enabled():
                button.click()
                break
    add_button = page.get_by_role("button", name=re.compile("Ajouter au panier", re.I)).first
    add_button.wait_for(state="visible", timeout=cfg.timeout_ms)
    if not add_button.is_enabled():
        raise PreconditionError(f"Produit {scenario}: ajout au panier désactivé (stock/livraison).")
    add_button.click()
    page.wait_for_function("key => JSON.parse(localStorage.getItem(key) || '[]').length === 1", CART_KEY)
    items = cart_items(page)
    if len(items) != 1 or items[0]["quantity"] != 1:
        raise AssertionError(f"Panier {scenario}: article dédié attendu, un seul exemplaire")
    return int(items[0]["productId"]), items[0].get("variantId")


def open_checkout(page, cfg: Config) -> None:
    page.goto(f"{cfg.base_url}/panier", wait_until="domcontentloaded")
    page.get_by_role("button", name=re.compile("Vérifier ma sélection|Revoir ma sélection|sélection|commande", re.I)).last.click()
    page.wait_for_url(re.compile(r"/commander(?:\?|$)"), timeout=cfg.timeout_ms)
    legal = page.get_by_test_id("checkout-legal-acceptance")
    legal.wait_for(state="visible", timeout=cfg.timeout_ms)
    legal.check()
    payment = page.get_by_role("button", name=re.compile("Payer avec Stripe Test", re.I))
    payment.wait_for(state="visible", timeout=cfg.timeout_ms)
    if not payment.is_enabled():
        raise PreconditionError("Paiement indisponible : vérifier juridique, livraison et Stripe Connect Test.")


def start_stripe_checkout(page, cfg: Config) -> tuple[int, str]:
    captured = []

    def on_response(response):
        if "checkout.createSession" in response.url and response.status == 200:
            try:
                captured.append(trpc_data(response.json()))
            except Exception:
                pass  # The subsequent URL wait will report the failure.

    page.on("response", on_response)
    page.get_by_role("button", name=re.compile("Payer avec Stripe Test", re.I)).click()
    page.wait_for_url(STRIPE_HOST, timeout=cfg.timeout_ms)
    page.wait_for_function("() => document.readyState !== 'loading'", timeout=cfg.timeout_ms)
    if len(captured) != 1:
        raise AssertionError("Redirection Stripe reçue sans réponse de création de session exploitable")
    result = captured[0]
    if not str(result.get("sessionId", "")).startswith("cs_test_"):
        raise AssertionError("Session non-test détectée : arrêt immédiat")
    return int(result["orderId"]), result["sessionId"]


def stripe_field(page, names: list[str], timeout_ms: int = 30000):
    """Stripe Checkout varies between embedded frames and top-level inputs."""
    deadline = time.monotonic() + timeout_ms / 1000
    while time.monotonic() < deadline:
        for frame in page.frames:
            for name in names:
                field = frame.locator(name).first
                try:
                    if field.count() and field.is_visible():
                        return field
                except PlaywrightError:
                    continue
        page.wait_for_timeout(250)
    raise AssertionError(f"Champ Stripe non trouvé: {', '.join(names)}")


def fill_stripe_card(page, number: str) -> None:
    # Country can reveal the remaining shipping fields in hosted Checkout.
    for frame in page.frames:
        country = frame.locator("select[name='shippingAddress.country'], select[autocomplete='shipping country']").first
        try:
            if country.count() and country.is_visible():
                country.select_option(os.getenv("MAZIGHO_E2E_COUNTRY", "CH"))
                break
        except PlaywrightError:
            pass
    stripe_field(page, ["input[name=cardNumber]", "input[autocomplete=cc-number]", "input[placeholder*='1234']"]).fill(number)
    stripe_field(page, ["input[name=cardExpiry]", "input[autocomplete=cc-exp]", "input[placeholder*='MM']"]).fill("1230")
    stripe_field(page, ["input[name=cardCvc]", "input[autocomplete=cc-csc]", "input[placeholder='CVC']"]).fill("931")
    # Provide a test-only shipping address when Checkout requires one; never log PII.
    optional_fields = [
        (["input[name=name]", "input[autocomplete='name']", "input[autocomplete='cc-name']"], "MAZIGHO E2E"),
        (["input[name=phoneNumber]", "input[name='shippingAddress.phoneNumber']", "input[type=tel]"], "0790000000"),
        (["input[name=addressLine1]", "input[name='shippingAddress.line1']", "input[autocomplete='shipping address-line1']"], "Rue de Test 1"),
        (["input[name=addressCity]", "input[name='shippingAddress.city']", "input[autocomplete='shipping address-level2']"], "Lausanne"),
        (["input[name=addressPostalCode]", "input[name='shippingAddress.postalCode']", "input[autocomplete='shipping postal-code']"], "1000"),
    ]
    for selectors, value in optional_fields:
        for frame in page.frames:
            field = frame.locator(", ".join(selectors)).first
            try:
                if field.count() and field.is_visible() and not field.input_value():
                    field.fill(value)
                    break
            except PlaywrightError:
                pass


def pay_button(page):
    # Hosted Checkout's accessible button contains "Pay", "Payer" or the amount.
    button = page.get_by_role("button", name=re.compile(r"^(Payer|Pay|Zahlen|Bezahlen)\b", re.I)).last
    button.wait_for(state="visible", timeout=30000)
    return button


def assert_pending_unpaid(context, cfg: Config, order_id: int, before: set[int]) -> None:
    orders = get_orders(context, cfg)
    new_orders = set(orders) - before
    if new_orders != {order_id}:
        raise AssertionError(f"Commandes nouvelles: {new_orders}, seule #{order_id} était attendue")
    order = orders[order_id]
    if order["paymentStatus"] != "unpaid" or order["status"] != "pending":
        raise AssertionError(f"Commande #{order_id}: attendu pending/unpaid, reçu {order['status']}/{order['paymentStatus']}")


def wait_for_status(context, cfg: Config, order_id: int, expected: tuple[str, str], seconds: int):
    deadline = time.monotonic() + seconds
    last = None
    while time.monotonic() < deadline:
        last = get_orders(context, cfg).get(order_id)
        if last and (last["status"], last["paymentStatus"]) == expected:
            return last
        time.sleep(3)
    raise AssertionError(f"Commande #{order_id}: statut attendu {expected}; dernier état "
                         f"{(last.get('status'), last.get('paymentStatus')) if last else 'absent'}")


def scenario_decline(page, cfg: Config, before: set[int], item: tuple[int, int | None], stock_before: int):
    order_id, _ = start_stripe_checkout(page, cfg)
    assert_pending_unpaid(page.context, cfg, order_id, before)
    fill_stripe_card(page, DECLINE_CARD)
    pay_button(page).click()
    # Check a payment-specific Stripe error, not a generic cookie/banner alert.
    deadline = time.monotonic() + cfg.timeout_ms / 1000
    decline_message = re.compile(r"insufficient|fonds insuffisants|refus[ée]|declined|not enough|abgelehnt", re.I)
    while time.monotonic() < deadline:
        visible_errors = []
        for frame in page.frames:
            for candidate in frame.locator("[role=alert], .FieldError, .Error").all():
                try:
                    if candidate.is_visible():
                        visible_errors.append(candidate.inner_text())
                except PlaywrightError:
                    pass
        if any(decline_message.search(message) for message in visible_errors):
            break
        page.wait_for_timeout(300)
    else:
        raise AssertionError("Stripe n'a pas affiché d'erreur de refus de carte identifiable")
    # A failed payment creates a PENDING order in MAZIGHO by design; no paid order.
    assert_pending_unpaid(page.context, cfg, order_id, before)
    if stock_for(page.context, cfg, *item) != stock_before - 1:
        raise AssertionError("La réservation d'un article après la session n'est pas cohérente")
    page.goto(f"{cfg.base_url}/panier", wait_until="domcontentloaded")
    page.wait_for_function("key => JSON.parse(localStorage.getItem(key) || '[]').length === 1", CART_KEY)
    print(f"PASS decline: erreur Stripe, panier conservé; commande #{order_id} pending/unpaid (jamais payée)")


def scenario_abandon(page, cfg: Config, before: set[int], item: tuple[int, int | None], stock_before: int):
    order_id, _ = start_stripe_checkout(page, cfg)
    assert_pending_unpaid(page.context, cfg, order_id, before)
    reserved = stock_for(page.context, cfg, *item)
    if reserved != stock_before - 1:
        raise AssertionError("Checkout n'a pas réservé exactement un article")
    page.close()  # Deliberately no Stripe cancel URL and no MAZIGHO success URL.
    fresh = page.context.new_page()
    fresh.goto(f"{cfg.base_url}/panier", wait_until="domcontentloaded")
    fresh.wait_for_function("key => JSON.parse(localStorage.getItem(key) || '[]').length === 1", CART_KEY)
    # The stock is *intentionally* reserved for ~31 min; verify release after
    # signed checkout.session.expired (or request-bound recovery after ~33 min).
    wait_for_status(fresh.context, cfg, order_id, ("cancelled", "unpaid"), cfg.expiry_timeout_s)
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline and stock_for(fresh.context, cfg, *item) != stock_before:
        time.sleep(3)
    if stock_for(fresh.context, cfg, *item) != stock_before:
        raise AssertionError("Stock toujours réservé après expiration de Stripe Checkout")
    assert len(cart_items(fresh)) == 1
    print(f"PASS abandon: panier conservé; commande #{order_id} cancelled/unpaid; stock libéré à expiration")


def scenario_webhook(page, cfg: Config, before: set[int], item: tuple[int, int | None], stock_before: int):
    order_id, session_id = start_stripe_checkout(page, cfg)
    assert_pending_unpaid(page.context, cfg, order_id, before)
    fill_stripe_card(page, SUCCESS_CARD)
    redirect_seen = []

    def block_success(route):
        redirect_seen.append(route.request.url)
        route.abort()  # Never load /commandes?stripe_session_id=... (which reconciles client-side).

    page.route(re.compile(r"/commandes\?stripe_session_id="), block_success)
    pay_button(page).click()
    # The navigation is intercepted and aborted before the MAZIGHO success page loads.
    deadline = time.monotonic() + cfg.timeout_ms / 1000
    while not redirect_seen and time.monotonic() < deadline:
        page.wait_for_timeout(250)
    if not redirect_seen:
        raise AssertionError("La navigation de succès Stripe n'a pas été interceptée; résultat inconclusif")
    page.close()
    fresh = page.context.new_page()
    fresh.goto(f"{cfg.base_url}/commandes", wait_until="domcontentloaded")
    fresh.get_by_role("heading", name="Mes commandes").wait_for(state="visible")
    # This plain route MUST NOT contain stripe_session_id; no getSessionStatus
    # polling is allowed, because it could mark the order paid outside webhook.
    if "stripe_session_id" in fresh.url:
        raise AssertionError("Route de vérification avec session Stripe inattendue")
    wait_for_status(fresh.context, cfg, order_id, ("processing", "paid"), 90)
    if set(get_orders(fresh.context, cfg)) - before != {order_id}:
        raise AssertionError("Une commande inattendue a été créée")
    fresh.reload(wait_until="domcontentloaded")
    fresh.get_by_test_id(f"order-card-{order_id}").get_by_text("En préparation").wait_for(state="visible", timeout=cfg.timeout_ms)
    if stock_for(fresh.context, cfg, *item) != stock_before - 1:
        raise AssertionError("La réservation d'un article payé n'est pas cohérente")
    print(f"PASS webhook: session {session_id[:8]}…, commande #{order_id} processing/paid sans retour client")


def load_config(scenario: str, timeout: int, expiry_timeout: int, screenshot_dir: str | None) -> Config:
    raw_url = os.getenv("MAZIGHO_E2E_BASE_URL", "https://www.mazigho.ch").rstrip("/")
    parsed = urlparse(raw_url)
    if parsed.scheme not in ("https", "http") or not parsed.netloc or parsed.username or parsed.password:
        raise PreconditionError("MAZIGHO_E2E_BASE_URL invalide")
    if parsed.scheme == "http" and parsed.hostname not in ("localhost", "127.0.0.1"):
        raise PreconditionError("HTTPS requis hors localhost")
    products = {key: os.getenv(f"MAZIGHO_E2E_PRODUCT_{key.upper()}_URL", "") for key in SCENARIOS}
    required = SCENARIOS if scenario == "all" else (scenario,)
    for key in required:
        product_url = urlparse(products[key])
        if product_url.scheme != parsed.scheme or product_url.netloc != parsed.netloc or not re.fullmatch(r"/produit/[\w-]+", product_url.path):
            raise PreconditionError(f"MAZIGHO_E2E_PRODUCT_{key.upper()}_URL doit pointer sur /produit/... dans la boutique de test")
    if scenario == "all" and len({products[key] for key in required}) != len(required):
        raise PreconditionError("Trois produits distincts exigés: chaque session garde sa réservation temporaire")
    email = os.getenv("MAZIGHO_E2E_EMAIL", "")
    password = os.getenv("MAZIGHO_E2E_PASSWORD", "")
    if not email or not password:
        raise PreconditionError("Compte client dédié requis : MAZIGHO_E2E_EMAIL et MAZIGHO_E2E_PASSWORD")
    return Config(raw_url, email, password, products, timeout, expiry_timeout, screenshot_dir)


def run_scenario(browser, cfg: Config, scenario: str) -> None:
    context = browser.new_context(locale="fr-CH", timezone_id="Europe/Zurich")
    page = context.new_page()
    try:
        require_test_checkout(context, cfg.base_url)  # Fail closed BEFORE login/order creation.
        login(page, cfg)
        require_test_checkout(context, cfg.base_url)
        before = set(get_orders(context, cfg))
        item = add_dedicated_product(page, cfg, scenario)
        stock_before = stock_for(context, cfg, *item)
        if stock_before < 2:
            raise PreconditionError(f"Produit #{item[0]}: minimum 2 exemplaires de stock pour le test dédié")
        open_checkout(page, cfg)
        if scenario == "decline":
            scenario_decline(page, cfg, before, item, stock_before)
        elif scenario == "abandon":
            scenario_abandon(page, cfg, before, item, stock_before)
        else:
            scenario_webhook(page, cfg, before, item, stock_before)
    except Exception:
        if cfg.screenshot_dir and not page.is_closed():
            os.makedirs(cfg.screenshot_dir, exist_ok=True)
            page.screenshot(path=f"{cfg.screenshot_dir}/{scenario}.png", full_page=True)
        raise
    finally:
        context.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", choices=("all",) + SCENARIOS, default="all")
    parser.add_argument("--timeout", type=int, default=60000, help="UI/Stripe wait in milliseconds")
    parser.add_argument("--expiry-timeout", type=int, default=2400, help="Max wait for expiry+stock release, seconds")
    parser.add_argument("--screenshot-dir", help="Failure screenshots only; may contain customer data")
    args = parser.parse_args()
    try:
        cfg = load_config(args.scenario, args.timeout, args.expiry_timeout, args.screenshot_dir)
        public_mode_preflight(cfg.base_url)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for scenario in SCENARIOS if args.scenario == "all" else (args.scenario,):
                    run_scenario(browser, cfg, scenario)
            finally:
                browser.close()
        return 0
    except (PreconditionError, PlaywrightError, PlaywrightTimeout, AssertionError) as error:
        print(f"FAIL/PRECONDITION: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
