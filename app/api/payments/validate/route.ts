import { NextResponse } from "next/server";
import { z } from "zod";
import { compareVerifiedPayment } from "../../../../src/modules/payments/verification";
import { configuredPaymentProvider } from "../../../../src/providers/configured";

const requestSchema = z.object({
  providerOrderId: z.string().min(1),
  providerChargeId: z.string().min(1),
  amountCents: z.number().int().positive(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Cobrança inválida para verificação." },
      { status: 400 },
    );
  }

  const { config, provider } = configuredPaymentProvider();
  if (config.mode === "mock") {
    return NextResponse.json({
      paid: true,
      mode: "mock",
      paidAt: new Date().toISOString(),
    });
  }

  try {
    const actual = await provider.getChargeStatus(parsed.data.providerOrderId);
    const verification = compareVerifiedPayment(
      {
        providerOrderId: parsed.data.providerOrderId,
        providerChargeId: parsed.data.providerChargeId,
        amount: { currency: "BRL", value: parsed.data.amountCents },
        receiverAccountId: config.pagBank.accountId,
      },
      {
        ...actual,
        receiverAccountId: config.pagBank.accountId,
      },
    );

    return NextResponse.json({
      paid: verification.matched,
      mode: "pagbank",
      status: actual.status,
      paidAt: actual.paidAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("quick-sale:validate", error);
    return NextResponse.json(
      { error: "Não foi possível validar o pagamento no PagBank." },
      { status: 502 },
    );
  }
}
