import { describe, expect, it } from "vitest";
import { paymentRuntimeConfig } from "../../../src/providers/configured";

describe("payment runtime configuration", () => {
  it("keeps PagBank disconnected when credentials are empty", () => {
    expect(
      paymentRuntimeConfig({
        PAYMENT_PROVIDER: "pagbank",
        PAGBANK_ENABLED: "true",
        PAGBANK_ACCESS_TOKEN: "",
        PAGBANK_WEBHOOK_URL: "",
      }),
    ).toMatchObject({
      mode: "mock",
      connected: false,
    });
  });

  it("enables PagBank only when token and webhook are configured", () => {
    expect(
      paymentRuntimeConfig({
        PAYMENT_PROVIDER: "pagbank",
        PAGBANK_ENABLED: "true",
        PAGBANK_ENV: "sandbox",
        PAGBANK_API_BASE_URL: "https://sandbox.api.pagseguro.com",
        PAGBANK_ACCESS_TOKEN: "token",
        PAGBANK_WEBHOOK_URL: "https://notifica.example/api/webhooks/pagbank",
      }),
    ).toMatchObject({
      mode: "pagbank",
      connected: true,
      environment: "sandbox",
    });
  });

  it("blocks the mock provider in Vercel production when no real provider is configured", () => {
    expect(
      paymentRuntimeConfig({
        VERCEL_ENV: "production",
        PAYMENT_PROVIDER: "mock",
      }),
    ).toMatchObject({
      mode: "unconfigured",
      connected: false,
      environment: "production",
    });
  });
});
