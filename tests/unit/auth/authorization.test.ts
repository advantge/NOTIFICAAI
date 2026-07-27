import { describe, expect, it } from "vitest";
import { authorize } from "@/src/auth/authorization";
import type { Actor } from "@/src/domain/types";

const seller: Actor = {
  id: "seller-a",
  storeId: "store-1",
  role: "SELLER",
  name: "Ana Costa",
};

describe("RBAC", () => {
  it("impede vendedor de ler venda alheia", () => {
    expect(
      authorize(seller, "sale:read", {
        storeId: "store-1",
        sellerId: "seller-b",
      }),
    ).toBe(false);
  });

  it("permite vendedor ler a própria venda", () => {
    expect(
      authorize(seller, "sale:read", {
        storeId: "store-1",
        sellerId: "seller-a",
      }),
    ).toBe(true);
  });

  it("impede gerente de ler segredo bancário", () => {
    expect(
      authorize(
        { ...seller, id: "manager", role: "MANAGER" },
        "integration:read-secret",
        { storeId: "store-1" },
      ),
    ).toBe(false);
  });
});
