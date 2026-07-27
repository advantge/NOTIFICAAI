import type { Money, PaymentStatus } from "../../domain/types";

export interface CreatePixChargeInput {
  referenceId: string;
  amount: Money;
  customerName: string;
  expiresAt: Date;
}

export interface CreatePixChargeResult {
  providerOrderId: string;
  providerChargeId: string;
  providerQrCodeId: string;
  amount: Money;
  pixCopyPaste: string;
  qrCodeImageUrl: string;
  expiresAt: Date;
}

export interface ChargeStatusResult {
  providerOrderId: string;
  providerChargeId: string;
  status: PaymentStatus;
  amount: Money;
  paidAt?: Date;
}

export interface ParsedPaymentEvent {
  providerEventId: string;
  providerOrderId: string;
  providerChargeId?: string;
  status: string;
}

export interface VerifiedPaymentResult extends ChargeStatusResult {
  verified: boolean;
  receiverAccountId?: string;
}

export interface ProviderHealthResult {
  healthy: boolean;
  environment: "demo" | "sandbox" | "production";
  latencyMs: number;
  message: string;
}

export interface OperationResult {
  status: "SUCCEEDED" | "UNSUPPORTED" | "NOT_CONFIGURED";
}

export interface PaymentProvider {
  createPixCharge(input: CreatePixChargeInput): Promise<CreatePixChargeResult>;
  getChargeStatus(providerChargeId: string): Promise<ChargeStatusResult>;
  cancelCharge(providerChargeId: string): Promise<OperationResult>;
  refundCharge(
    providerChargeId: string,
    amount?: Money,
  ): Promise<OperationResult>;
  parseWebhook(payload: unknown, headers: Headers): Promise<ParsedPaymentEvent>;
  verifyPayment(event: ParsedPaymentEvent): Promise<VerifiedPaymentResult>;
  healthCheck(): Promise<ProviderHealthResult>;
}
