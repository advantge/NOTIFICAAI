import { describe, expect, it, vi } from "vitest";
import { WebhookReceiver } from "@/src/modules/payments/webhook";

const validPayload = JSON.stringify({
  id: "ORDE_1",
  charges: [
    {
      id: "CHAR_1",
      status: "PAID",
      amount: { value: 100017, currency: "BRL" },
      paid_at: "2026-07-27T14:32:00-03:00",
    },
  ],
});

describe("WebhookReceiver", () => {
  it("rejeita Content-Type diferente de JSON", async () => {
    const receiver = new WebhookReceiver(vi.fn());
    const response = await receiver.receive(
      new Request("https://example.com/api/webhooks/pagbank", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: validPayload,
      }),
    );
    expect(response.status).toBe(415);
  });

  it("deduplica o mesmo payload antes de enfileirar", async () => {
    const enqueue = vi.fn();
    const receiver = new WebhookReceiver(enqueue);
    const request = () =>
      new Request("https://example.com/api/webhooks/pagbank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: validPayload,
      });

    const first = await receiver.receive(request());
    const duplicate = await receiver.receive(request());

    expect(first.status).toBe(202);
    expect(duplicate.status).toBe(200);
    expect(enqueue).toHaveBeenCalledOnce();
    await expect(duplicate.json()).resolves.toMatchObject({ duplicate: true });
  });

  it("rejeita payload acima de 64 KiB", async () => {
    const receiver = new WebhookReceiver(vi.fn());
    const response = await receiver.receive(
      new Request("https://example.com/api/webhooks/pagbank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: "x".repeat(70_000) }),
      }),
    );
    expect(response.status).toBe(413);
  });
});
