import { describe, expect, it } from "vitest";
import {
  confirmQuickSale,
  createQuickSale,
  emptyQuickSaleSummary,
  parseSaleAmount,
} from "../../../src/sales/quick-sale";

describe("quick sale", () => {
  it("starts every operational number at zero", () => {
    expect(emptyQuickSaleSummary()).toEqual({
      salesCount: 0,
      receivedCents: 0,
      awaitingCents: 0,
      notificationCount: 0,
    });
  });

  it.each([
    ["50", 5000],
    ["50,90", 5090],
    ["1.234,56", 123456],
    ["0", 0],
    ["texto", 0],
  ])("parses %s into %i cents", (input, expected) => {
    expect(parseSaleAmount(input)).toBe(expected);
  });

  it("creates a Pix charge using only the informed value", () => {
    const sale = createQuickSale(5090, "sale-fixed-id");

    expect(sale).toMatchObject({
      id: "sale-fixed-id",
      amountCents: 5090,
      status: "AWAITING_PAYMENT",
    });
    expect(sale.pixCode).toContain("54" + "0550.90");
    expect(sale).not.toHaveProperty("deviceNumber");
    expect(sale).not.toHaveProperty("customer");
  });

  it("confirms the sale and creates exactly one notification", () => {
    const sale = createQuickSale(7500, "sale-paid");
    const result = confirmQuickSale(sale, emptyQuickSaleSummary());

    expect(result.sale.status).toBe("PAID");
    expect(result.summary).toEqual({
      salesCount: 1,
      receivedCents: 7500,
      awaitingCents: 0,
      notificationCount: 1,
    });
  });
});
