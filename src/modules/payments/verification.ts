import type { Money, PaymentStatus } from "../../domain/types";

export type VerificationReason =
  | "STATUS_NOT_PAID"
  | "ORDER_ID_MISMATCH"
  | "CHARGE_ID_MISMATCH"
  | "AMOUNT_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "RECEIVER_MISMATCH"
  | "MISSING_PAID_AT";

interface ExpectedPayment {
  providerOrderId: string;
  providerChargeId: string;
  amount: Money;
  receiverAccountId?: string;
}

interface ActualPayment extends ExpectedPayment {
  status: PaymentStatus;
  paidAt?: Date;
}

export function compareVerifiedPayment(
  expected: ExpectedPayment,
  actual: ActualPayment,
): { matched: boolean; reasons: VerificationReason[] } {
  const reasons: VerificationReason[] = [];
  if (actual.status !== "PAID") reasons.push("STATUS_NOT_PAID");
  if (actual.providerOrderId !== expected.providerOrderId) {
    reasons.push("ORDER_ID_MISMATCH");
  }
  if (actual.providerChargeId !== expected.providerChargeId) {
    reasons.push("CHARGE_ID_MISMATCH");
  }
  if (actual.amount.value !== expected.amount.value) {
    reasons.push("AMOUNT_MISMATCH");
  }
  if (actual.amount.currency !== expected.amount.currency) {
    reasons.push("CURRENCY_MISMATCH");
  }
  if (
    expected.receiverAccountId &&
    actual.receiverAccountId !== expected.receiverAccountId
  ) {
    reasons.push("RECEIVER_MISMATCH");
  }
  if (actual.status === "PAID" && !actual.paidAt) {
    reasons.push("MISSING_PAID_AT");
  }
  return { matched: reasons.length === 0, reasons };
}
