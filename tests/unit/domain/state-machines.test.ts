import { describe, expect, it } from "vitest";
import { transitionPayment, transitionSale } from "@/src/domain/state-machines";
import { InvalidStateTransitionError } from "@/src/domain/errors";

describe("máquinas de estado financeiras", () => {
  it("impede venda paga de voltar a aguardando", () => {
    expect(() => transitionSale("PAID", "AWAITING_PAYMENT")).toThrow(
      InvalidStateTransitionError,
    );
  });

  it("permite venda paga ser parcialmente estornada", () => {
    expect(transitionSale("PAID", "PARTIALLY_REFUNDED")).toBe(
      "PARTIALLY_REFUNDED",
    );
  });

  it("impede pagamento cancelado de virar pago", () => {
    expect(() => transitionPayment("CANCELED", "PAID")).toThrow(
      InvalidStateTransitionError,
    );
  });
});
