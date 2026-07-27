import { describe, expect, it } from "vitest";
import { compareVerifiedPayment } from "@/src/modules/payments/verification";

const expected = {
  providerOrderId: "ORDE_1",
  providerChargeId: "CHAR_1",
  amount: { currency: "BRL" as const, value: 100017 },
  receiverAccountId: "ACC_1",
};

describe("verificação financeira", () => {
  it("aprova somente quando todos os campos financeiros conferem", () => {
    expect(
      compareVerifiedPayment(expected, {
        ...expected,
        status: "PAID",
        paidAt: new Date(),
      }),
    ).toEqual({ matched: true, reasons: [] });
  });

  it("envia valor divergente para conciliação", () => {
    const result = compareVerifiedPayment(expected, {
      ...expected,
      amount: { currency: "BRL", value: 100000 },
      status: "PAID",
      paidAt: new Date(),
    });
    expect(result.matched).toBe(false);
    expect(result.reasons).toContain("AMOUNT_MISMATCH");
  });

  it("não aprova status diferente de PAID", () => {
    const result = compareVerifiedPayment(expected, {
      ...expected,
      status: "WAITING",
    });
    expect(result.reasons).toContain("STATUS_NOT_PAID");
  });
});
