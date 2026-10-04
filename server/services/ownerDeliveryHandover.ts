import { buildOwnerDeliveryDetails, type OwnerDeliveryDetails, type OwnerDeliveryOrderRow } from "./ownerDeliveryDetails";

export type OwnerDeliveryHandoverDetails = OwnerDeliveryDetails | {
  available: false;
  reason: "ORDER_NOT_SHIPPED";
};

/**
 * A handover sheet is more restrictive than the preparation sheet: it becomes
 * available only once the owner has manually recorded the shipment transition.
 * Authorization and store scope are enforced by the caller before this policy.
 */
export function buildOwnerDeliveryHandoverDetails(row: OwnerDeliveryOrderRow | null | undefined): OwnerDeliveryHandoverDetails {
  const delivery = buildOwnerDeliveryDetails(row);
  if (!delivery.available) return delivery;
  if (row?.status !== "shipped") return { available: false, reason: "ORDER_NOT_SHIPPED" };
  return delivery;
}
