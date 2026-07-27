import type { Role } from "../domain/types";

export type McpToolName =
  | "create_pix_sale"
  | "get_sale"
  | "get_sale_payment_status"
  | "list_pending_sales"
  | "list_paid_sales"
  | "list_ambiguous_payments"
  | "get_payment_details"
  | "retry_payment_verification"
  | "manually_reconcile_payment"
  | "list_sellers"
  | "get_seller_performance"
  | "get_daily_sales_summary"
  | "get_integration_health";

const sensitiveTools = new Set<McpToolName>([
  "retry_payment_verification",
  "manually_reconcile_payment",
]);

async function hash(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

export async function authenticateMcpToken(
  provided: string | undefined,
  expected: string | undefined,
): Promise<boolean> {
  if (!provided || !expected) return false;
  const [left, right] = await Promise.all([hash(provided), hash(expected)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export function authorizeMcpTool(role: Role, tool: McpToolName): boolean {
  if (role === "ADMIN") return true;
  if (sensitiveTools.has(tool)) return false;
  if (role === "MANAGER") return tool !== "create_pix_sale";
  return new Set<McpToolName>([
    "create_pix_sale",
    "get_sale",
    "get_sale_payment_status",
    "list_pending_sales",
    "list_paid_sales",
    "get_payment_details",
    "get_daily_sales_summary",
    "get_integration_health",
  ]).has(tool);
}
