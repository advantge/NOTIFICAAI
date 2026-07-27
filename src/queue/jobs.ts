import type { QueuedWebhook } from "../modules/payments/webhook";

const webhookJobs: QueuedWebhook[] = [];

export function enqueueWebhook(job: QueuedWebhook): void {
  webhookJobs.push(job);
}

export function listWebhookJobs(): readonly QueuedWebhook[] {
  return webhookJobs;
}

export function retryDelayMs(attempt: number, jitter = 0): number {
  return Math.min(60_000, 1_000 * 2 ** Math.max(0, attempt - 1)) + jitter;
}
