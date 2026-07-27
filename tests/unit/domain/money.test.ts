import { describe, expect, it } from "vitest";
import { applyUniqueCents, formatMoney } from "@/src/domain/money";

describe("money", () => {
  it("formata centavos em BRL", () => {
    expect(formatMoney(450017)).toMatch(/R\$\s?4\.500,17/);
  });

  it("aplica centavos identificadores sem alterar silenciosamente o original", () => {
    const original = { currency: "BRL" as const, value: 450000 };
    expect(applyUniqueCents(original, 17)).toEqual({
      currency: "BRL",
      value: 450017,
    });
    expect(original.value).toBe(450000);
  });

  it("rejeita identificador fora do intervalo", () => {
    expect(() =>
      applyUniqueCents({ currency: "BRL", value: 1000 }, 100),
    ).toThrow("entre 0 e 99");
  });
});
