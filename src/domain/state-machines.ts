import { InvalidStateTransitionError } from "./errors";
import type { PaymentStatus, SaleStatus } from "./types";

export const saleTransitions: Record<SaleStatus, readonly SaleStatus[]> = {
  DRAFT: ["AWAITING_PAYMENT", "CANCELED"],
  AWAITING_PAYMENT: ["PAYMENT_DETECTED", "EXPIRED", "CANCELED"],
  PAYMENT_DETECTED: ["PAYMENT_VERIFICATION", "AMBIGUOUS"],
  PAYMENT_VERIFICATION: ["PAID", "AMBIGUOUS"],
  PAID: ["REFUNDED", "PARTIALLY_REFUNDED"],
  AMBIGUOUS: ["PAYMENT_VERIFICATION", "CANCELED"],
  EXPIRED: ["AMBIGUOUS"],
  CANCELED: ["AMBIGUOUS"],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};

export const paymentTransitions: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  CREATED: ["WAITING", "CANCELED"],
  WAITING: ["PAID", "DECLINED", "CANCELED", "EXPIRED", "VERIFICATION_FAILED"],
  PAID: ["REFUNDED", "PARTIALLY_REFUNDED"],
  DECLINED: [],
  CANCELED: [],
  EXPIRED: ["VERIFICATION_FAILED"],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
  VERIFICATION_FAILED: ["WAITING", "PAID", "CANCELED"],
};

export function transitionSale(
  current: SaleStatus,
  next: SaleStatus,
): SaleStatus {
  if (!saleTransitions[current].includes(next)) {
    throw new InvalidStateTransitionError("venda", current, next);
  }
  return next;
}

export function transitionPayment(
  current: PaymentStatus,
  next: PaymentStatus,
): PaymentStatus {
  if (!paymentTransitions[current].includes(next)) {
    throw new InvalidStateTransitionError("pagamento", current, next);
  }
  return next;
}
