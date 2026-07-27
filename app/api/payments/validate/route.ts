import { NextResponse } from "next/server";
import { z } from "zod";
import { compareVerifiedPayment } from "../../../../src/modules/payments/verification";
import { configuredPaymentProvider } from "../../../../src/providers/configured";
import {
  findPaymentCharge,
  isSupabasePaymentStorageConfigured,
  markPaymentPaid,
} from "../../../../src/storage/supabase-payments";

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

  if (config.mode === "unconfigured") {
    return NextResponse.json(
      {
        error:
          "O provedor de pagamentos ainda não está configurado nesta implantação.",
        code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  if (!isSupabasePaymentStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "O armazenamento seguro do Supabase ainda não está configurado nesta implantação.",
        code: "SUPABASE_STORAGE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  try {
    const stored = await findPaymentCharge(
      "pagbank",
      parsed.data.providerOrderId,
    );
    if (
      !stored ||
      stored.provider_charge_id !== parsed.data.providerChargeId ||
      stored.amount_cents !== parsed.data.amountCents
    ) {
      return NextResponse.json(
        { error: "A cobrança não corresponde ao registro seguro da venda." },
        { status: 409 },
      );
    }

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

    if (verification.matched && actual.paidAt) {
      await markPaymentPaid(
        "pagbank",
        parsed.data.providerOrderId,
        actual.paidAt,
      );
    }

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
