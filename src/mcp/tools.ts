import { demoSales, sellers, type DemoSale } from "../demo/data";
import { configuredPaymentProvider } from "../providers/configured";
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
      const reference = `mcp-${crypto.randomUUID()}`;
      const { provider } = configuredPaymentProvider();
      const charge = await provider.createPixCharge({
        referenceId: reference,
        amount: { currency: "BRL", value: amount },
        customerName: "Cliente",
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      const sale: DemoSale = {
        id: crypto.randomUUID(),
        reference,
        customer: "Cliente",
        description: "Venda rápida",
        amount,
        seller: "Operação",
        sellerId: "mcp-service",
        status: "AWAITING_PAYMENT",
        createdAt: new Date().toISOString(),
        expiresAt: charge.expiresAt.toISOString(),
        pixCode: charge.pixCopyPaste,
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
    case "get_integration_health": {
      const { provider, config } = configuredPaymentProvider();
      const health = await provider.healthCheck();
      return {
        provider: config.mode,
        connected: config.connected,
        ...health,
      };
    }
  }
}
