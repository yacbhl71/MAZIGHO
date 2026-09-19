import { describe, expect, it } from "vitest";
import { getStoreMembershipRolePresentation, getStoreStaffWorkspace, isStoreManagementRole } from "../shared/storeMembershipRole";

describe("store membership role helpers", () => {
  it("keeps management rights limited to owner and manager", () => {
    expect(isStoreManagementRole("owner")).toBe(true);
    expect(isStoreManagementRole("manager")).toBe(true);
    expect(isStoreManagementRole("catalog_editor")).toBe(false);
    expect(isStoreManagementRole("viewer")).toBe(false);
  });

  it("maps only mission roles to a dedicated staff workspace", () => {
    expect(getStoreStaffWorkspace("catalog_editor")?.href).toBe("/admin/catalogue-brouillons");
    expect(getStoreStaffWorkspace("support_agent")?.href).toBe("/admin/assistance");
    expect(getStoreStaffWorkspace("order_operator")?.href).toBe("/admin/operations-commandes");
    expect(getStoreStaffWorkspace("owner")).toBeNull();
    expect(getStoreStaffWorkspace("accountant")).toBeNull();
  });

  it("uses a safe presentation for an unknown role", () => {
    expect(getStoreMembershipRolePresentation("unexpected").label).toBe("Accès non reconnu");
  });
});
