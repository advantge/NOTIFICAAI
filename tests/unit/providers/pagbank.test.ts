import { describe, expect, it, vi } from "vitest";
import { PagBankPaymentProvider } from "@/src/providers/pagbank/provider";

const input = {
  referenceId: "VEN-0727-2001",
  amount: { currency: "BRL" as const, value: 159917 },
  customerName: "Cliente Teste",
  expiresAt: new Date("2026-07-28T12:00:00.000Z"),
};

describe("PagBankPaymentProvider", () => {
  it("não chama a rede quando a integração está desabilitada", async () => {
    const fetcher = vi.fn();
    const provider = new PagBankPaymentProvider(
      {
        enabled: false,
        environment: "sandbox",
        baseUrl: "https://sandbox.api.pagseguro.com",
        accessToken: "",
        webhookUrl: "",
      },
      fetcher,
    );

    await expect(provider.createPixCharge(input)).rejects.toMatchObject({
      code: "NOT_CONFIGURED",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("envia idempotência e contrato oficial da API Order", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "ORDE_ABC",
          reference_id: input.referenceId,
          qr_codes: [
            {
              id: "QRCO_ABC",
              amount: { value: 159917 },
              text: "000201DEMO",
              expiration_date: "2026-07-28T12:00:00.000Z",
              links: [
                {
                  rel: "QRCODE.PNG",
                  href: "https://api.pagseguro.com/qrcode/QRCO_ABC/png",
                  media: "image/png",
                  type: "GET",
                },
              ],
            },
          ],
          charges: [],
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = new PagBankPaymentProvider(
      {
        enabled: true,
        environment: "sandbox",
        baseUrl: "https://sandbox.api.pagseguro.com",
        accessToken: "server-token",
        webhookUrl: "https://example.com/api/webhooks/pagbank",
      },
      fetcher,
    );

    await provider.createPixCharge(input);
    const [, init] = fetcher.mock.calls[0];
    expect(init.headers["x-idempotency-key"]).toBe(input.referenceId);
    expect(JSON.parse(init.body)).toMatchObject({
      reference_id: input.referenceId,
      qr_codes: [{ amount: { value: 159917 } }],
      notification_urls: ["https://example.com/api/webhooks/pagbank"],
    });
  });
});
