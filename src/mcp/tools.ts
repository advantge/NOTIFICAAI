import { demoSales, sellers, type DemoSale } from "../demo/data";
import type { McpToolName } from "./authorization";

const createdSales: DemoSale[] = [];

function allSales(): DemoSale[] {
  return [...createdSales, ...demoSales];
}

export async function executeMcpTool(
  name: McpToolName,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "create_pix_sale": {
      const amount = Number(input.amount);
      const reference = `MCP-${Date.now()}`;
      const sale: DemoSale = {
        id: crypto.randomUUID(),
        reference,
        customer: String(input.customerName),
        description: String(input.description),
        amount,
        seller: "Agente autorizado",
        sellerId: String(input.sellerId ?? "mcp-service"),
        status: "AWAITING_PAYMENT",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        pixCode: `00020101021226830014BR.GOV.BCB.PIX52040000530398654${(
          amount / 100
        ).toFixed(2)}5802BR5911NOTIFICA AI6009FORTALEZA62070503***6304DEMO`,
      };
      createdSales.unshift(sale);
      return sale;
    }
    case "get_sale":
    case "get_sale_payment_status":
    case "get_payment_details":
      return (
        allSales().find(
          (sale) => sale.id === input.id || sale.reference === input.id,
        ) ?? { error: "SALE_NOT_FOUND" }
      );
    case "list_pending_sales":
      return allSales().filter((sale) => sale.status === "AWAITING_PAYMENT");
    case "list_paid_sales":
      return allSales().filter((sale) => sale.status === "PAID");
    case "list_ambiguous_payments":
      return allSales().filter((sale) => sale.status === "AMBIGUOUS");
    case "retry_payment_verification":
      return {
        accepted: true,
        paymentId: input.id,
        nextAttemptAt: new Date(Date.now() + 1_000).toISOString(),
      };
    case "manually_reconcile_payment":
      return {
        reconciled: true,
        paymentId: input.id,
        resolution: input.resolution,
        audited: true,
      };
    case "list_sellers":
    case "get_seller_performance":
      return sellers;
    case "get_daily_sales_summary":
      return {
        created: allSales().length,
        paid: allSales().filter((sale) => sale.status === "PAID").length,
        pending: allSales().filter((sale) => sale.status === "AWAITING_PAYMENT")
          .length,
        receivedAmount: allSales()
          .filter((sale) => sale.status === "PAID")
          .reduce((sum, sale) => sum + sale.amount, 0),
        currency: "BRL",
      };
    case "get_integration_health":
      return {
        provider: "mock",
        healthy: true,
        environment: "demo",
        pagBank: "NOT_CONFIGURED",
      };
  }
}
