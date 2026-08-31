"""E2E backend tests for MAZIGHO Lots B & C (promotions, abandoned carts,
email templates, returns/RMA, SEO, RBAC, audit log).

Runs against the local Node/Express/tRPC server at http://localhost:3100.
tRPC transport is JSON-batched with superjson: mutations => POST body
`{"0":{"json":{...}}}`, queries => GET `?input={"0":{"json":<value>}}` URL-encoded.
"""
import json
import time
import urllib.parse
import pytest
import requests

BASE = "http://localhost:3100"
ADMIN = ("yacbhll@gmail.com", "Mazigho2026!")
CATALOG = ("catalog@mazigho.test", "Catalog2026!")
ORDERS_OP = ("orders@mazigho.test", "Orders2026!")


# ---------------------------- helpers ---------------------------- #

def _login(email: str, password: str) -> requests.Session:
    s = requests.Session()
    r = s.post(
        f"{BASE}/api/trpc/auth.login?batch=1",
        headers={"content-type": "application/json"},
        data=json.dumps({"0": {"json": {"email": email, "password": password}}}),
        timeout=10,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return s


def _mutate(s: requests.Session, proc: str, payload):
    """POST tRPC mutation with `payload` as the `json` input for slot 0."""
    r = s.post(
        f"{BASE}/api/trpc/{proc}?batch=1",
        headers={"content-type": "application/json"},
        data=json.dumps({"0": {"json": payload}}),
        timeout=15,
    )
    return r


def _query(s: requests.Session, proc: str, payload=None):
    """GET tRPC query. payload may be None (no input) or any JSON value."""
    params = {"batch": "1"}
    if payload is not None:
        params["input"] = json.dumps({"0": {"json": payload}})
    r = s.get(f"{BASE}/api/trpc/{proc}", params=params, timeout=15)
    return r


def _data(r):
    """Extract `.result.data.json` from a tRPC batched response (slot 0)."""
    body = r.json()
    assert isinstance(body, list) and body, f"unexpected body {body}"
    slot = body[0]
    if "error" in slot:
        raise AssertionError(f"tRPC error: {slot['error']}")
    return slot["result"]["data"]["json"]


def _err(r):
    """Extract tRPC error slot 0 (returns None if no error)."""
    try:
        body = r.json()
    except Exception:
        return None
    if isinstance(body, list) and body and "error" in body[0]:
        e = body[0]["error"]
        # unwrap superjson envelope
        if isinstance(e, dict) and "json" in e:
            return e["json"]
        return e
    return None


# ---------------------------- fixtures ---------------------------- #

@pytest.fixture(scope="session")
def admin_session():
    return _login(*ADMIN)


@pytest.fixture(scope="session")
def orders_op_session():
    return _login(*ORDERS_OP)


@pytest.fixture(scope="session")
def catalog_session():
    return _login(*CATALOG)


@pytest.fixture(scope="session")
def public_session():
    return requests.Session()


# ---------------------------- 0. Sanity / health ---------------------------- #

class TestHealth:
    def test_frontend_loads(self, public_session):
        r = public_session.get(f"{BASE}/", timeout=5)
        assert r.status_code == 200
        assert "<html" in r.text.lower()

    def test_admin_login_returns_admin_role(self, admin_session):
        r = _query(admin_session, "auth.me")
        assert r.status_code == 200
        data = _data(r)
        # auth.me returns the user object directly
        assert data.get("role") == "admin", f"unexpected: {data}"


# ---------------------------- 1. LOT B - Promotions ---------------------------- #

@pytest.fixture(scope="module")
def category_id(admin_session):
    # public categories.getAll takes a locale input ("fr" default)
    r = _query(admin_session, "categories.getAll", "fr")
    assert r.status_code == 200, r.text[:300]
    cats = _data(r)
    assert isinstance(cats, list) and cats, "no categories in DB"
    return cats[0]["id"]


class TestPromotions:
    created_ids = []

    def test_create_first_order_promo(self, admin_session):
        code = f"TEST_FIRST_{int(time.time())}"
        r = _mutate(admin_session, "admin.promotions.create", {
            "code": code, "type": "percent", "value": 15,
            "active": 1, "scope": "first_order", "perUserLimit": 1,
        })
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        pid = data.get("id") if isinstance(data, dict) else None
        if pid:
            TestPromotions.created_ids.append(pid)
        # Verify via getAll
        r2 = _query(admin_session, "admin.promotions.getAll")
        promos = _data(r2)
        found = [p for p in promos if p["code"] == code]
        assert found, "created promo not returned by getAll"
        assert found[0]["scope"] == "first_order"
        assert found[0]["perUserLimit"] == 1

    def test_create_category_promo_requires_categoryId(self, admin_session):
        code = f"TEST_CAT_BAD_{int(time.time())}"
        r = _mutate(admin_session, "admin.promotions.create", {
            "code": code, "type": "percent", "value": 10,
            "active": 1, "scope": "category",
        })
        # Should fail validation
        err = _err(r)
        assert err is not None, f"expected error, got {r.text[:200]}"
        assert "cat" in (err.get("message") or "").lower() or "category" in (err.get("message") or "").lower()

    def test_create_category_promo(self, admin_session, category_id):
        code = f"TEST_CAT_{int(time.time())}"
        r = _mutate(admin_session, "admin.promotions.create", {
            "code": code, "type": "percent", "value": 10,
            "active": 1, "scope": "category", "categoryId": category_id,
        })
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        pid = data.get("id") if isinstance(data, dict) else None
        if pid:
            TestPromotions.created_ids.append(pid)
        r2 = _query(admin_session, "admin.promotions.getAll")
        promos = _data(r2)
        found = [p for p in promos if p["code"] == code]
        assert found and found[0]["scope"] == "category"
        assert found[0]["categoryId"] == category_id

    def test_update_promo_preserves_scope(self, admin_session):
        # Use last created promo
        assert TestPromotions.created_ids, "need a created promo"
        pid = TestPromotions.created_ids[-1]
        # Fetch current
        promos = _data(_query(admin_session, "admin.promotions.getAll"))
        promo = next(p for p in promos if p["id"] == pid)
        # Toggle active
        payload = {
            "id": pid,
            "code": promo["code"],
            "type": promo["type"],
            "value": promo["value"],
            "active": 0,
            "scope": promo["scope"],
            "categoryId": promo.get("categoryId"),
            "perUserLimit": promo.get("perUserLimit"),
        }
        r = _mutate(admin_session, "admin.promotions.update", payload)
        assert r.status_code == 200, r.text[:300]
        # Verify
        promos2 = _data(_query(admin_session, "admin.promotions.getAll"))
        promo2 = next(p for p in promos2 if p["id"] == pid)
        assert promo2["active"] == 0
        assert promo2["scope"] == promo["scope"]

    def test_validate_invalid_promo(self, public_session):
        r = _mutate(public_session, "shop.promotions.validate", {
            "code": "NOPE_INVALID_XYZ", "orderAmount": 5000,
        })
        err = _err(r)
        assert err is not None, "invalid promo should error"

    def test_validate_first_order_promo(self, admin_session, public_session):
        # Find the first_order promo we created (may be inactive if last test ran)
        promos = _data(_query(admin_session, "admin.promotions.getAll"))
        first_order = [p for p in promos if p["scope"] == "first_order" and p["active"] == 1 and p["code"].startswith("TEST_FIRST_")]
        if not first_order:
            pytest.skip("no active first_order test promo available")
        code = first_order[0]["code"]
        # Validate as anonymous - server may reject scoped promo without user ctx.
        # Try authenticated as ORDERS_OP (fresh user with no orders).
        s = _login(*ORDERS_OP)
        r = _mutate(s, "shop.promotions.validate", {"code": code, "orderAmount": 10000})
        err = _err(r)
        # Should either succeed (discount applied) or gracefully error if user already has paid orders
        if err:
            # Acceptable errors: FIRST_ORDER_ONLY etc.
            msg = err.get("message", "").lower()
            assert "premier" in msg or "first" in msg or "déjà" in msg, f"unexpected err: {err}"
        else:
            data = _data(r)
            assert data["discountAmount"] > 0

    def test_delete_created_promos(self, admin_session):
        for pid in TestPromotions.created_ids:
            r = _mutate(admin_session, "admin.promotions.delete", pid)
            assert r.status_code == 200, f"delete {pid}: {r.text[:200]}"


# ---------------------------- 2. LOT B - Abandoned carts ---------------------------- #

class TestAbandonedCarts:
    def test_list_abandoned_carts(self, admin_session):
        r = _query(admin_session, "admin.marketing.abandonedCarts", {"olderThanHours": 4})
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        assert "carts" in data and "emailConfigured" in data
        assert data["emailConfigured"] is False, "email should be unconfigured locally"
        assert isinstance(data["carts"], list)

    def test_send_reminder_gracefully_fails_when_email_unconfigured(self, admin_session):
        # Get any cart (may be empty). If none, try with a fake id -> NOT_FOUND is fine.
        data = _data(_query(admin_session, "admin.marketing.abandonedCarts", {"olderThanHours": 1}))
        if data["carts"]:
            cid = data["carts"][0]["cartId"]
            r = _mutate(admin_session, "admin.marketing.sendCartReminder", {"cartId": cid})
            err = _err(r)
            assert err is not None
            msg = err.get("message", "")
            assert "e-mail" in msg.lower() or "email" in msg.lower() or "resend" in msg.lower()
        else:
            pytest.skip("no abandoned carts to exercise reminder graceful-fail")


# ---------------------------- 3. LOT B - Email templates ---------------------------- #

class TestEmailTemplates:
    def test_list_email_templates(self, admin_session):
        r = _query(admin_session, "admin.emailTemplates.getAll")
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        assert "templates" in data and "emailConfigured" in data
        types = {t["type"] for t in data["templates"]}
        # 3 template types must exist
        assert {"order_confirmation", "order_shipped", "abandoned_cart"}.issubset(types)

    def test_save_and_persist_template(self, admin_session):
        raw = _data(_query(admin_session, "admin.emailTemplates.getAll"))["templates"]
        orig_entry = next(t for t in raw if t["type"] == "order_confirmation")
        orig = orig_entry["template"]
        new_subject = f"TEST Confirmation {int(time.time())}"
        payload = {
            "type": "order_confirmation",
            "subject": new_subject,
            "heading": orig.get("heading") or "Merci pour votre commande",
            "body": (orig.get("body") or "Corps de test") + " ",
            "buttonLabel": orig.get("buttonLabel") or "Voir",
            "enabled": bool(orig.get("enabled", True)),
        }
        r = _mutate(admin_session, "admin.emailTemplates.save", payload)
        assert r.status_code == 200, r.text[:300]
        raw2 = _data(_query(admin_session, "admin.emailTemplates.getAll"))["templates"]
        updated = next(t for t in raw2 if t["type"] == "order_confirmation")["template"]
        assert updated["subject"] == new_subject
        # Restore
        _mutate(admin_session, "admin.emailTemplates.save", {
            "type": "order_confirmation",
            "subject": orig.get("subject") or "Confirmation de commande",
            "heading": orig.get("heading") or "Merci pour votre commande",
            "body": orig.get("body") or "Corps",
            "buttonLabel": orig.get("buttonLabel") or "Voir",
            "enabled": bool(orig.get("enabled", True)),
        })


# ---------------------------- 4. LOT C - Client orders & returns ---------------------------- #

class TestClientOrders:
    def test_getMyOrders_returns_list(self, orders_op_session):
        # orders operator is a real user; endpoint is protectedProcedure.
        r = _query(orders_op_session, "shop.orders.getMyOrders")
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        assert isinstance(data, list)

    def test_requestReturn_on_missing_order_returns_404(self, orders_op_session):
        r = _mutate(orders_op_session, "shop.orders.requestReturn", {
            "orderId": 999999, "reason": "Article défectueux au déballage",
        })
        err = _err(r)
        assert err is not None
        assert err.get("data", {}).get("httpStatus") in (404, 400)

    def test_requestReturn_min_reason_length(self, orders_op_session):
        r = _mutate(orders_op_session, "shop.orders.requestReturn", {
            "orderId": 1, "reason": "abc",
        })
        err = _err(r)
        assert err is not None  # zod validation fails


# ---------------------------- 5. LOT C - Admin returns / RMA ---------------------------- #

class TestAdminReturns:
    def test_returns_list_admin(self, admin_session):
        r = _query(admin_session, "admin.returns.getAll")
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        assert isinstance(data, list)

    def test_returns_list_order_operator(self, orders_op_session):
        r = _query(orders_op_session, "admin.returns.getAll")
        assert r.status_code == 200, r.text[:300]
        assert isinstance(_data(r), list)

    def test_returns_list_forbidden_for_catalog_editor(self, catalog_session):
        r = _query(catalog_session, "admin.returns.getAll")
        err = _err(r)
        assert err is not None
        assert err.get("data", {}).get("httpStatus") in (401, 403)

    def test_refund_admin_only(self, orders_op_session):
        # order_operator must NOT be able to invoke order.refund
        r = _mutate(orders_op_session, "admin.orders.refund", {"orderId": 1})
        err = _err(r)
        assert err is not None
        assert err.get("data", {}).get("httpStatus") in (401, 403)

    def test_refund_graceful_when_stripe_missing(self, admin_session):
        # Find a paid order id or use a fake id. We'll try to fetch orders list first.
        r = _query(admin_session, "admin.orders.getAll")
        if r.status_code != 200:
            pytest.skip("cannot list orders")
        orders = _data(r)
        paid = None
        if isinstance(orders, list):
            paid = next((o for o in orders if (o.get("paymentStatus") == "paid" or o.get("status") == "paid")), None)
        if not paid:
            pytest.skip("no paid orders to test refund graceful failure")
        r2 = _mutate(admin_session, "admin.orders.refund", {"orderId": paid["id"]})
        err = _err(r2)
        # Expected graceful French error (Stripe not configured or no stripe context)
        assert err is not None, "refund should fail gracefully"
        assert any(k in err.get("message", "").lower() for k in ["stripe", "remboursement", "configuré"])


# ---------------------------- 6. LOT C - SEO ---------------------------- #

class TestSEO:
    def test_get_seo(self, admin_session):
        r = _query(admin_session, "admin.seo.get")
        assert r.status_code == 200, r.text[:300]
        d = _data(r)
        assert "title" in d and "description" in d and "siteUrl" in d

    def test_save_and_persist_seo(self, admin_session):
        original = _data(_query(admin_session, "admin.seo.get"))
        new_title = f"TEST SEO {int(time.time())}"[:70]
        new_desc = f"Description SEO de test générée automatiquement pour validation E2E {int(time.time())}"[:320]
        r = _mutate(admin_session, "admin.seo.save", {"title": new_title, "description": new_desc})
        assert r.status_code == 200, r.text[:300]
        after = _data(_query(admin_session, "admin.seo.get"))
        assert after["title"] == new_title
        assert after["description"] == new_desc
        # Restore
        _mutate(admin_session, "admin.seo.save", {
            "title": original["title"], "description": original["description"],
        })

    def test_seo_title_max_length(self, admin_session):
        r = _mutate(admin_session, "admin.seo.save", {"title": "x" * 71, "description": "y" * 50})
        assert _err(r) is not None


# ---------------------------- 7. LOT A regression ---------------------------- #

class TestLotARegression:
    def test_dashboard_stats(self, admin_session):
        r = _query(admin_session, "admin.getStats")
        assert r.status_code == 200
        d = _data(r)
        # keys should include revenue-related metrics
        assert isinstance(d, dict)

    def test_audit_log_records_actions(self, admin_session):
        r = _query(admin_session, "admin.audit.getLogs", {"page": 1, "pageSize": 100})
        assert r.status_code == 200, r.text[:300]
        data = _data(r)
        entries = data.get("entries") or []
        actions = {e.get("action") for e in entries}
        assert actions & {"seo.update", "email_template.update", "promotion.create", "promotion.delete"}, \
            f"expected audit actions from this run, got {actions}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
