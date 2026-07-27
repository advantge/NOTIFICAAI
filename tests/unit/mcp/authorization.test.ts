import { describe, expect, it } from "vitest";
import {
  authorizeMcpTool,
  authenticateMcpToken,
} from "@/src/mcp/authorization";

describe("MCP authorization", () => {
  it("rejeita token ausente", async () => {
    await expect(authenticateMcpToken(undefined, "secret")).resolves.toBe(
      false,
    );
  });

  it("aceita token exato por comparação segura", async () => {
    await expect(authenticateMcpToken("secret", "secret")).resolves.toBe(true);
  });

  it("impede vendedor de conciliar manualmente", () => {
    expect(authorizeMcpTool("SELLER", "manually_reconcile_payment")).toBe(
      false,
    );
  });

  it("permite vendedor consultar a própria venda", () => {
    expect(authorizeMcpTool("SELLER", "get_sale")).toBe(true);
  });
});
