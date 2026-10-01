"""Pure preflight checks; never creates a Checkout session."""
import importlib.util
import os
from pathlib import Path
from unittest import TestCase, mock

spec = importlib.util.spec_from_file_location("checkout_e2e", Path(__file__).with_name("stripe_checkout_edge_cases.py"))
checkout = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = checkout
spec.loader.exec_module(checkout)


class PreflightTests(TestCase):
    def test_mode_live_refused(self):
        with mock.patch.object(checkout, "api", return_value={"enabled": True, "mode": "stripe_connect_live"}):
            with self.assertRaises(checkout.PreconditionError):
                checkout.require_test_checkout(None, "https://mazigho.ch")

    def test_test_mode_disabled_refused(self):
        with mock.patch.object(checkout, "api", return_value={"enabled": False, "mode": "stripe_connect_test"}):
            with self.assertRaises(checkout.PreconditionError):
                checkout.require_test_checkout(None, "https://mazigho.ch")

    def test_test_mode_enabled(self):
        with mock.patch.object(checkout, "api", return_value={"enabled": True, "mode": "stripe_connect_test"}):
            checkout.require_test_checkout(None, "https://mazigho.ch")

    def test_trpc_error_is_not_a_success(self):
        with self.assertRaises(AssertionError):
            checkout.trpc_data({"error": {"message": "FORBIDDEN"}})

    def test_incomplete_card_not_used(self):
        self.assertEqual(checkout.DECLINE_CARD, "4000000000009995")
        self.assertEqual(len(checkout.DECLINE_CARD), 16)

    def test_products_must_be_distinct(self):
        env = {"MAZIGHO_E2E_EMAIL": "test@example.invalid", "MAZIGHO_E2E_PASSWORD": "private"}
        env.update({f"MAZIGHO_E2E_PRODUCT_{key.upper()}_URL": "https://www.mazigho.ch/produit/1" for key in checkout.SCENARIOS})
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(checkout.PreconditionError):
                checkout.load_config("all", 60000, 2400, None)

    def test_external_product_url_refused(self):
        with mock.patch.dict(os.environ, {"MAZIGHO_E2E_EMAIL": "test@example.invalid", "MAZIGHO_E2E_PASSWORD": "private", "MAZIGHO_E2E_PRODUCT_DECLINE_URL": "https://other.example/produit/1"}, clear=True):
            with self.assertRaises(checkout.PreconditionError):
                checkout.load_config("decline", 60000, 2400, None)
