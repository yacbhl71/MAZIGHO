"""Mazigho backend regression + new endpoint tests via tRPC on localhost:3100."""
import json
import urllib.parse
import pytest
import requests

BASE = "http://localhost:3100"


def trpc_get(proc, input_json):
    q = urllib.parse.quote(json.dumps({"0": {"json": input_json}}))
    return requests.get(f"{BASE}/api/trpc/{proc}?batch=1&input={q}", timeout=30)


def trpc_get_noinput(proc, session=None):
    # For queries without input
    s = session or requests
    return s.get(f"{BASE}/api/trpc/{proc}?batch=1", timeout=30)


def trpc_post(proc, input_json, session=None):
    s = session or requests
    return s.post(
        f"{BASE}/api/trpc/{proc}?batch=1",
        json={"0": {"json": input_json}},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = trpc_post("auth.login", {"email": "yacbhll@gmail.com", "password": "Mazigho2026!"}, session=s)
    assert r.status_code == 200, f"login status {r.status_code}: {r.text[:400]}"
    body = r.json()
    assert "result" in body[0], f"login body {body}"
    data = body[0]["result"]["data"]["json"]
    assert data.get("role") == "admin" or data.get("user", {}).get("role") == "admin", f"not admin: {data}"
    return s


# --- Regression: auth ---
def test_auth_login_and_me(admin_session):
    r = admin_session.get(f"{BASE}/api/trpc/auth.me?batch=1", timeout=30)
    assert r.status_code == 200, r.text[:400]
    body = r.json()
    assert "result" in body[0], f"auth.me: {body}"
    user = body[0]["result"]["data"]["json"]
    # user may be nested
    email = user.get("email") or (user.get("user") or {}).get("email")
    assert email == "yacbhll@gmail.com", f"unexpected user: {user}"


# --- Regression: public catalog ---
def test_products_getAll_public():
    r = trpc_get("products.getAll", "fr")
    assert r.status_code == 200, r.text[:400]
    body = r.json()
    assert "result" in body[0], f"products err: {body}"
    products = body[0]["result"]["data"]["json"]
    assert isinstance(products, list)
    assert len(products) > 0, "expected non-empty product list"


def test_categories_getAll_public():
    r = trpc_get("categories.getAll", "fr")
    assert r.status_code == 200, r.text[:400]
    body = r.json()
    assert "result" in body[0], f"categories err: {body}"


# --- Regression: admin.getStats ---
def test_admin_getStats(admin_session):
    # Try with no input first
    r = admin_session.get(f"{BASE}/api/trpc/admin.getStats?batch=1", timeout=30)
    if r.status_code != 200 or "error" in (r.json()[0] if r.text.startswith("[") else {}):
        # try with empty input
        q = urllib.parse.quote(json.dumps({"0": {"json": None, "meta": {"values": ["undefined"]}}}))
        r = admin_session.get(f"{BASE}/api/trpc/admin.getStats?batch=1&input={q}", timeout=30)
    assert r.status_code == 200, r.text[:400]
    body = r.json()
    assert "result" in body[0], f"admin.getStats error: {body}"


# --- NEW: Odoo status/verify graceful degradation ---
def test_admin_suppliers_odooStatus(admin_session):
    r = admin_session.get(f"{BASE}/api/trpc/admin.suppliers.odooStatus?batch=1", timeout=30)
    assert r.status_code == 200, f"odooStatus HTTP {r.status_code}: {r.text[:400]}"
    body = r.json()
    assert "result" in body[0], f"odooStatus error: {body}"
    data = body[0]["result"]["data"]["json"]
    assert data.get("configured") is False, f"expected configured=false: {data}"


def test_admin_suppliers_verifyOdoo(admin_session):
    r = trpc_post("admin.suppliers.verifyOdoo", {}, session=admin_session)
    assert r.status_code == 200, f"verifyOdoo HTTP {r.status_code}: {r.text[:400]}"
    body = r.json()
    assert "result" in body[0], f"verifyOdoo error: {body}"
    data = body[0]["result"]["data"]["json"]
    assert data.get("configured") is False
    assert data.get("verified") is False


# --- NEW: CJ graceful degradation ---
def test_admin_suppliers_searchCj_missing_key(admin_session):
    r = trpc_post(
        "admin.suppliers.searchCj",
        {"keyword": "mug", "page": 1, "freeShippingOnly": False},
        session=admin_session,
    )
    # Must NOT be 500. tRPC returns 200 or 4xx for handled errors typically.
    assert r.status_code != 500, f"searchCj crashed: {r.text[:400]}"
    body = r.json()
    assert "error" in body[0], f"expected tRPC error, got: {body}"
    code = body[0]["error"]["json"]["data"]["code"]
    assert code == "PRECONDITION_FAILED", f"expected PRECONDITION_FAILED, got {code}"


def test_admin_suppliers_prepareCjImport_missing_key(admin_session):
    r = trpc_post(
        "admin.suppliers.prepareCjImport",
        {"productId": "TEST123"},
        session=admin_session,
    )
    assert r.status_code != 500, f"prepareCjImport crashed: {r.text[:400]}"
    body = r.json()
    assert "error" in body[0], f"expected tRPC error, got: {body}"
    code = body[0]["error"]["json"]["data"]["code"]
    assert code in ("PRECONDITION_FAILED", "BAD_GATEWAY"), f"unexpected code {code}"


# --- Final health check ---
def test_server_still_healthy():
    r = requests.get(f"{BASE}/", timeout=10)
    assert r.status_code == 200
