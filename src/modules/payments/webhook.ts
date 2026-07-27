import { sanitizePayload } from "../../security/redact";

const MAX_WEBHOOK_BYTES = 64 * 1024;

export interface QueuedWebhook {
  id: string;
  payloadHash: string;
  payload: unknown;
  receivedAt: Date;
  status: "PENDING";
  attempts: 0;
}

type EnqueueWebhook = (job: QueuedWebhook) => void | Promise<void>;

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export class WebhookReceiver {
  private readonly hashes = new Set<string>();

  constructor(private readonly enqueue: EnqueueWebhook) {}

  async receive(request: Request): Promise<Response> {
    const contentType = request.headers.get("content-type")?.split(";")[0];
    if (contentType !== "application/json") {
      return Response.json(
        { error: "Content-Type deve ser application/json." },
        { status: 415 },
      );
    }

    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_WEBHOOK_BYTES) {
      return Response.json(
        { error: "Payload excede o limite permitido." },
        { status: 413 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }

    const payloadHash = await sha256(body);
    if (this.hashes.has(payloadHash)) {
      return Response.json(
        { accepted: true, duplicate: true },
        { status: 200 },
      );
    }

    const job: QueuedWebhook = {
      id: crypto.randomUUID(),
      payloadHash,
      payload: sanitizePayload(parsed),
      receivedAt: new Date(),
      status: "PENDING",
      attempts: 0,
    };
    await this.enqueue(job);
    this.hashes.add(payloadHash);
    return Response.json(
      { accepted: true, duplicate: false, eventId: job.id },
      { status: 202 },
    );
  }
}
