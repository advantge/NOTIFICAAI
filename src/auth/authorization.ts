import type { Actor, ScopedResource } from "../domain/types";

export type Action =
  | "sale:create"
  | "sale:read"
  | "sale:cancel"
  | "payment:read"
  | "reconciliation:resolve"
  | "integration:read"
  | "integration:read-secret"
  | "audit:read";

const roleActions: Record<Actor["role"], readonly Action[]> = {
  ADMIN: [
    "sale:create",
    "sale:read",
    "sale:cancel",
    "payment:read",
    "reconciliation:resolve",
    "integration:read",
    "integration:read-secret",
    "audit:read",
  ],
  MANAGER: [
    "sale:read",
    "sale:cancel",
    "payment:read",
    "reconciliation:resolve",
    "integration:read",
  ],
  SELLER: ["sale:create", "sale:read", "sale:cancel", "payment:read"],
};

export function authorize(
  actor: Actor,
  action: Action,
  resource: ScopedResource,
): boolean {
  if (actor.storeId !== resource.storeId) return false;
  if (!roleActions[actor.role].includes(action)) return false;
  if (
    actor.role === "SELLER" &&
    resource.sellerId &&
    resource.sellerId !== actor.id
  ) {
    return false;
  }
  return true;
}
