export type DemoSaleStatus =
  | "PAID"
  | "AWAITING_PAYMENT"
  | "AMBIGUOUS"
  | "EXPIRED"
  | "REFUNDED"
  | "CANCELED";

export interface DemoSale {
  id: string;
  reference: string;
  customer: string;
  description: string;
  amount: number;
  seller: string;
  sellerId: string;
  status: DemoSaleStatus;
  createdAt: string;
  paidAt?: string;
  pixCode: string;
  expiresAt: string;
}

// O sistema inicia sem registros artificiais. As vendas aparecem somente
// depois de serem realmente criadas pela interface, API ou MCP.
export const demoSales: DemoSale[] = [];
export const sellers: Array<{
  id: string;
  name: string;
  sales: number;
  value: number;
  rate: number;
}> = [];
