export type Role = "ADMIN" | "MANAGER" | "SELLER";

export type SaleStatus =
  | "DRAFT"
  | "AWAITING_PAYMENT"
  | "PAYMENT_DETECTED"
  | "PAYMENT_VERIFICATION"
  | "PAID"
  | "AMBIGUOUS"
  | "EXPIRED"
  | "CANCELED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentStatus =
  | "CREATED"
  | "WAITING"
  | "PAID"
  | "DECLINED"
  | "CANCELED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "VERIFICATION_FAILED";

export interface Money {
  currency: "BRL";
  value: number;
}

export interface Actor {
  id: string;
  storeId: string;
  role: Role;
  name: string;
}

export interface ScopedResource {
  storeId: string;
  sellerId?: string;
}
