import type { PaymentProvider } from "../modules/payments/provider";
import { MockPaymentProvider } from "./mock/provider";
import { PagBankPaymentProvider, type PagBankConfig } from "./pagbank/provider";

type RuntimeEnv = Record<string, string | undefined>;

export type PaymentRuntimeConfig = {
  mode: "mock" | "pagbank" | "unconfigured";
  connected: boolean;
  environment: "demo" | "sandbox" | "production";
  pagBank: PagBankConfig;
};

export function paymentRuntimeConfig(env: RuntimeEnv): PaymentRuntimeConfig {
  const production =
    env.VERCEL_ENV === "production" || env.APP_ENV === "production";
  const environment =
    production || env.PAGBANK_ENV === "production" ? "production" : "sandbox";
  const enabled =
    env.PAYMENT_PROVIDER === "pagbank" &&
    env.PAGBANK_ENABLED === "true" &&
    Boolean(env.PAGBANK_ACCESS_TOKEN?.trim()) &&
    Boolean(env.PAGBANK_WEBHOOK_URL?.trim());

  const pagBank: PagBankConfig = {
    enabled,
    environment,
    baseUrl:
      env.PAGBANK_API_BASE_URL?.trim() ||
      (environment === "production"
        ? "https://api.pagseguro.com"
        : "https://sandbox.api.pagseguro.com"),
    accessToken: env.PAGBANK_ACCESS_TOKEN?.trim() ?? "",
    webhookUrl: env.PAGBANK_WEBHOOK_URL?.trim() ?? "",
    accountId: env.PAGBANK_ACCOUNT_ID?.trim() || undefined,
  };

  return {
    mode: enabled ? "pagbank" : production ? "unconfigured" : "mock",
    connected: enabled,
    environment: enabled ? environment : production ? "production" : "demo",
    pagBank,
  };
}

export function configuredPaymentProvider(env: RuntimeEnv = process.env): {
  provider: PaymentProvider;
  config: PaymentRuntimeConfig;
} {
  const config = paymentRuntimeConfig(env);

  return {
    config,
    provider:
      config.mode === "pagbank"
        ? new PagBankPaymentProvider(config.pagBank)
        : new MockPaymentProvider(),
  };
}
