import { ProviderError } from "../../domain/errors";
import type {
  ChargeStatusResult,
  CreatePixChargeInput,
  CreatePixChargeResult,
  OperationResult,
  ParsedPaymentEvent,
  PaymentProvider,
  ProviderHealthResult,
  VerifiedPaymentResult,
} from "../../modules/payments/provider";

interface MockCharge extends CreatePixChargeResult {
  status: ChargeStatusResult["status"];
  paidAt?: Date;
}

function stableId(prefix: string, reference: string): string {
  const safe = reference.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `${prefix}_${safe}`;
}

export class MockPaymentProvider implements PaymentProvider {
  private readonly charges = new Map<string, MockCharge>();

  async createPixCharge(
    input: CreatePixChargeInput,
  ): Promise<CreatePixChargeResult> {
    const providerOrderId = stableId("MOCK_ORDE", input.referenceId);
    const providerChargeId = stableId("MOCK_CHAR", input.referenceId);
    const result: MockCharge = {
      providerOrderId,
      providerChargeId,
      providerQrCodeId: stableId("MOCK_QRCO", input.referenceId),
      amount: { ...input.amount },
      pixCopyPaste: `00020101021226830014BR.GOV.BCB.PIX52040000530398654${(
        input.amount.value / 100
      ).toFixed(2)}5802BR5911NOTIFICA AI6009FORTALEZA62070503***6304DEMO`,
      qrCodeImageUrl: `/api/mock/qrcode/${providerOrderId}`,
      expiresAt: new Date(input.expiresAt),
      status: "WAITING",
    };
    this.charges.set(providerChargeId, result);
    return result;
  }

  async getChargeStatus(providerChargeId: string): Promise<ChargeStatusResult> {
    const charge = this.charges.get(providerChargeId);
    if (!charge) {
      throw new ProviderError(
        "Cobrança mock não encontrada.",
        "CHARGE_NOT_FOUND",
      );
    }
    return { ...charge };
  }

  async cancelCharge(providerChargeId: string): Promise<OperationResult> {
    const charge = this.charges.get(providerChargeId);
    if (!charge) {
      throw new ProviderError(
        "Cobrança mock não encontrada.",
        "CHARGE_NOT_FOUND",
      );
    }
    charge.status = "CANCELED";
    return { status: "SUCCEEDED" };
  }

  async refundCharge(providerChargeId: string): Promise<OperationResult> {
    const charge = this.charges.get(providerChargeId);
    if (!charge || charge.status !== "PAID") {
      throw new ProviderError(
        "Apenas cobranças pagas podem ser estornadas.",
        "INVALID_REFUND",
      );
    }
    charge.status = "REFUNDED";
    return { status: "SUCCEEDED" };
  }

  async parseWebhook(payload: unknown): Promise<ParsedPaymentEvent> {
    if (!payload || typeof payload !== "object") {
      throw new ProviderError("Webhook mock inválido.", "INVALID_WEBHOOK");
    }
    const event = payload as Record<string, unknown>;
    if (
      typeof event.id !== "string" ||
      typeof event.orderId !== "string" ||
      typeof event.status !== "string"
    ) {
      throw new ProviderError("Webhook mock inválido.", "INVALID_WEBHOOK");
    }
    return {
      providerEventId: event.id,
      providerOrderId: event.orderId,
      providerChargeId:
        typeof event.chargeId === "string" ? event.chargeId : undefined,
      status: event.status,
    };
  }

  async verifyPayment(
    event: ParsedPaymentEvent,
  ): Promise<VerifiedPaymentResult> {
    if (!event.providerChargeId) {
      throw new ProviderError(
        "O evento não informa a cobrança.",
        "CHARGE_NOT_FOUND",
      );
    }
    const charge = await this.getChargeStatus(event.providerChargeId);
    return { ...charge, verified: charge.status === "PAID" };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    return {
      healthy: true,
      environment: "demo",
      latencyMs: 8,
      message: "Simulador operacional",
    };
  }

  simulatePaid(providerChargeId: string): MockCharge {
    const charge = this.charges.get(providerChargeId);
    if (!charge) {
      throw new ProviderError(
        "Cobrança mock não encontrada.",
        "CHARGE_NOT_FOUND",
      );
    }
    charge.status = "PAID";
    charge.paidAt = new Date();
    return charge;
  }
}
