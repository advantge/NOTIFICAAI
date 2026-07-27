export type QuickSaleStatus = "AWAITING_PAYMENT" | "PAID";

export type QuickSale = {
  id: string;
  amountCents: number;
  pixCode: string;
  status: QuickSaleStatus;
};

export type QuickSaleSummary = {
  salesCount: number;
  receivedCents: number;
  awaitingCents: number;
  notificationCount: number;
};

export function emptyQuickSaleSummary(): QuickSaleSummary {
  return {
    salesCount: 0,
    receivedCents: 0,
    awaitingCents: 0,
    notificationCount: 0,
  };
}

export function parseSaleAmount(value: string): number {
  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

export function createQuickSale(
  amountCents: number,
  id = crypto.randomUUID(),
): QuickSale {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Informe um valor válido para gerar o Pix.");
  }

  const amount = (amountCents / 100).toFixed(2);
  const amountField = `54${String(amount.length).padStart(2, "0")}${amount}`;
  const reference = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);

  return {
    id,
    amountCents,
    status: "AWAITING_PAYMENT",
    pixCode:
      `00020101021226830014BR.GOV.BCB.PIX2561api.pagseguro.com/pix/v2/${reference}` +
      `520400005303986${amountField}5802BR5911NOTIFICA AI6009FORTALEZA62070503***6304DEMO`,
  };
}

export function confirmQuickSale(
  sale: QuickSale,
  summary: QuickSaleSummary,
): { sale: QuickSale; summary: QuickSaleSummary } {
  if (sale.status === "PAID") return { sale, summary };

  return {
    sale: { ...sale, status: "PAID" },
    summary: {
      salesCount: summary.salesCount + 1,
      receivedCents: summary.receivedCents + sale.amountCents,
      awaitingCents: 0,
      notificationCount: summary.notificationCount + 1,
    },
  };
}
