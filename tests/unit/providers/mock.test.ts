import { describe, expect, it } from "vitest";
import { MockPaymentProvider } from "@/src/providers/mock/provider";

describe("MockPaymentProvider", () => {
  it("cria cobrança Pix de valor exato e uso único", async () => {
    const provider = new MockPaymentProvider();
    const result = await provider.createPixCharge({
      referenceId: "VEN-20260727-001",
      amount: { currency: "BRL", value: 450017 },
      customerName: "João Silva",
      expiresAt: new Date("2026-07-28T12:00:00.000Z"),
    });

    expect(result.amount.value).toBe(450017);
    expect(result.pixCopyPaste).toMatch(/^000201/);
    expect(result.providerOrderId).toMatch(/^MOCK_ORDE_/);
  });
});
