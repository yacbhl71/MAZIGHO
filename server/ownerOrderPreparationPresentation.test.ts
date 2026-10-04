import { describe, expect, it } from "vitest";
import {
  getOwnerOrderNextAction,
  getOwnerOrderPaymentLabel,
  isOwnerOrderReadyForPreparation,
} from "../shared/ownerOrderPreparationPresentation";

describe("owner order preparation presentation", () => {
  it("only prepares paid orders or Algeria cash-on-delivery orders", () => {
    expect(isOwnerOrderReadyForPreparation({ paymentStatus: "paid", paymentMethod: "stripe_connect_test" })).toBe(true);
    expect(isOwnerOrderReadyForPreparation({ paymentStatus: "unpaid", paymentMethod: "cash_on_delivery_dz" })).toBe(true);
    expect(isOwnerOrderReadyForPreparation({ paymentStatus: "unpaid", paymentMethod: "stripe_connect_test" })).toBe(false);
  });

  it("guides a COD order through acceptance and collection", () => {
    expect(getOwnerOrderNextAction({ status: "pending", paymentStatus: "unpaid", paymentMethod: "cash_on_delivery_dz" })).toMatchObject({
      title: "Décision à confirmer",
      tone: "ready",
    });
    expect(getOwnerOrderNextAction({ status: "delivered", paymentStatus: "unpaid", paymentMethod: "cash_on_delivery_dz" })).toMatchObject({
      title: "Encaissement COD à confirmer",
      tone: "ready",
    });
    expect(getOwnerOrderPaymentLabel({ paymentStatus: "unpaid", paymentMethod: "cash_on_delivery_dz" })).toBe("À encaisser à la livraison");
  });

  it("does not offer preparation before a non-COD payment is confirmed", () => {
    expect(getOwnerOrderNextAction({ status: "pending", paymentStatus: "unpaid", paymentMethod: "stripe_connect_test" })).toMatchObject({
      title: "Paiement à confirmer",
      tone: "warning",
    });
  });

  it("guides the normal preparation lifecycle", () => {
    expect(getOwnerOrderNextAction({ status: "processing", paymentStatus: "paid" })).toMatchObject({ title: "Préparer puis expédier" });
    expect(getOwnerOrderNextAction({ status: "shipped", paymentStatus: "paid" })).toMatchObject({ title: "Livraison à confirmer" });
    expect(getOwnerOrderNextAction({ status: "delivered", paymentStatus: "paid" })).toMatchObject({ title: "Commande terminée" });
  });
});
