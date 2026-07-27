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
import { pagBankOrderSchema, type PagBankOrder } from "./schemas";

export interface PagBankConfig {
  enabled: boolean;
  environment: "sandbox" | "production";
  baseUrl: string;
  accessToken: string;
  webhookUrl: string;
  accountId?: string;
}

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function requireConfig(config: PagBankConfig): void {
  if (
    !config.enabled ||
    !config.baseUrl ||
    !config.accessToken ||
    !config.webhookUrl
  ) {
    throw new ProviderError(
      "A integração PagBank aguarda configuração.",
      "NOT_CONFIGURED",
    );
  }
}

function toStatus(status?: string): ChargeStatusResult["status"] {
  switch (status) {
    case "PAID":
      return "PAID";
    case "DECLINED":
      return "DECLINED";
    case "CANCELED":
      return "CANCELED";
    case "WAITING":
    default:
      return "WAITING";
  }
}

export class PagBankPaymentProvider implements PaymentProvider {
  constructor(
    private readonly config: PagBankConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  private headers(idempotencyKey?: string): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    };
  }

  private async parseResponse(response: Response): Promise<PagBankOrder> {
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new ProviderError(
        `O PagBank recusou a operação (${response.status}).`,
        "PROVIDER_REQUEST_FAILED",
      );
    }
    const parsed = pagBankOrderSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ProviderError(
        "O PagBank retornou um formato inesperado.",
        "INVALID_PROVIDER_RESPONSE",
      );
    }
    return parsed.data;
  }

  async createPixCharge(
    input: CreatePixChargeInput,
  ): Promise<CreatePixChargeResult> {
    requireConfig(this.config);
    const response = await this.fetcher(`${this.config.baseUrl}/orders`, {
      method: "POST",
      headers: this.headers(input.referenceId),
      body: JSON.stringify({
        reference_id: input.referenceId,
        customer: { name: input.customerName },
        qr_codes: [
          {
            amount: { value: input.amount.value },
            expiration_date: input.expiresAt.toISOString(),
          },
        ],
        notification_urls: [this.config.webhookUrl],
      }),
    });
    const order = await this.parseResponse(response);
    const qrCode = order.qr_codes[0];
    if (!qrCode) {
      throw new ProviderError(
        "O pedido foi criado sem QR Code.",
        "INVALID_PROVIDER_RESPONSE",
      );
    }
    const png = qrCode.links.find(
      (link) => link.rel === "QRCODE.PNG" || link.media === "image/png",
    );
    if (!png) {
      throw new ProviderError(
        "O pedido não contém a imagem do QR Code.",
        "INVALID_PROVIDER_RESPONSE",
      );
    }

    return {
      providerOrderId: order.id,
      providerChargeId: order.charges[0]?.id ?? order.id,
      providerQrCodeId: qrCode.id,
      amount: { currency: "BRL", value: qrCode.amount.value },
      pixCopyPaste: qrCode.text,
      qrCodeImageUrl: png.href,
      expiresAt: qrCode.expiration_date
        ? new Date(qrCode.expiration_date)
        : input.expiresAt,
    };
  }

  async getChargeStatus(providerOrderId: string): Promise<ChargeStatusResult> {
    requireConfig(this.config);
    const response = await this.fetcher(
      `${this.config.baseUrl}/orders/${encodeURIComponent(providerOrderId)}`,
      { method: "GET", headers: this.headers() },
    );
    const order = await this.parseResponse(response);
    const charge = order.charges[0];
    const qrCode = order.qr_codes[0];
    if (!charge && !qrCode) {
      throw new ProviderError(
        "O pedido consultado não contém cobrança ou QR Code.",
        "INVALID_PROVIDER_RESPONSE",
      );
    }
    return {
      providerOrderId: order.id,
      providerChargeId: charge?.id ?? order.id,
      status: toStatus(charge?.status),
      amount: {
        currency: "BRL",
        value: charge?.amount.value ?? qrCode?.amount.value ?? 0,
      },
      paidAt: charge?.paid_at ? new Date(charge.paid_at) : undefined,
    };
  }

  async cancelCharge(): Promise<OperationResult> {
    return { status: "UNSUPPORTED" };
  }

  async refundCharge(): Promise<OperationResult> {
    return { status: "UNSUPPORTED" };
  }

  async parseWebhook(payload: unknown): Promise<ParsedPaymentEvent> {
    const parsed = pagBankOrderSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ProviderError(
        "Webhook PagBank com formato inválido.",
        "INVALID_WEBHOOK",
      );
    }
    const charge = parsed.data.charges[0];
    return {
      providerEventId: [
        parsed.data.id,
        charge?.id ?? "NO_CHARGE",
        charge?.status ?? "WAITING",
        charge?.paid_at ?? charge?.created_at ?? "NO_TIMESTAMP",
      ].join(":"),
      providerOrderId: parsed.data.id,
      providerChargeId: charge?.id,
      status: charge?.status ?? "WAITING",
    };
  }

  async verifyPayment(
    event: ParsedPaymentEvent,
  ): Promise<VerifiedPaymentResult> {
    const actual = await this.getChargeStatus(event.providerOrderId);
    return {
      ...actual,
      verified: actual.status === "PAID",
      receiverAccountId: this.config.accountId,
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    const configured =
      this.config.enabled &&
      Boolean(
        this.config.baseUrl &&
          this.config.accessToken &&
          this.config.webhookUrl,
      );
    return {
      healthy: configured,
      environment: this.config.environment,
      latencyMs: 0,
      message: configured
        ? "Configuração disponível; use uma consulta de pedido para validar as credenciais."
        : "Aguardando configuração",
    };
  }
}
