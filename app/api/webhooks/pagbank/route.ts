import { WebhookReceiver } from "../../../../src/modules/payments/webhook";
import { enqueueWebhook } from "../../../../src/queue/jobs";

const receiver = new WebhookReceiver(enqueueWebhook);

export async function POST(request: Request): Promise<Response> {
  return receiver.receive(request);
}
