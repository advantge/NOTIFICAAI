import { describe, expect, it } from "vitest";
import {
  auditLogs,
  notifications,
  payments,
  reconciliationCases,
  sales,
  stores,
  users,
  webhookEvents,
} from "@/db/schema";

describe("schema operacional", () => {
  it("expõe todas as tabelas financeiras essenciais", () => {
    const essentialTables = [
      stores,
      users,
      sales,
      payments,
      webhookEvents,
      notifications,
      reconciliationCases,
      auditLogs,
    ];
    expect(essentialTables).toHaveLength(8);
    expect(essentialTables.every(Boolean)).toBe(true);
  });
});
