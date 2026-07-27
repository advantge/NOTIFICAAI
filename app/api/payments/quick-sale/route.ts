import { NextResponse } from "next/server";
import { z } from "zod";
import { configuredPaymentProvider } from "../../../../src/providers/configured";
import {
  isSupabasePaymentStorageConfigured,
  savePaymentCharge,
} from "../../../../src/storage/supabase-payments";

const requestSchema = z.object({
  amountCents: z.number().int().positive().max(100_000_000),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Informe um valor válido para gerar o Pix." },
      { status: 400 },
    );
  }

  try {
    const referenceId = `sale-${crypto.randomUUID()}`;
    const { provider, config } = configuredPaymentProvider();
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
    if (config.mode === "pagbank" && !isSupabasePaymentStorageConfigured()) {
      return NextResponse.json(
        {
          error:
            "O armazenamento seguro do Supabase ainda não está configurado nesta implantação.",
          code: "SUPABASE_STORAGE_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const charge = await provider.createPixCharge({
      referenceId,
      amount: { currency: "BRL", value: parsed.data.amountCents },
      customerName: "Cliente",
      expiresAt,
    });
    if (config.mode === "pagbank") {
      await savePaymentCharge({
        id: referenceId,
        provider: "pagbank",
        providerOrderId: charge.providerOrderId,
        providerChargeId: charge.providerChargeId,
        amountCents: charge.amount.value,
        status: "AWAITING_PAYMENT",
        expiresAt: charge.expiresAt,
      });
    }

    return NextResponse.json({
      id: referenceId,
      amountCents: charge.amount.value,
      pixCode: charge.pixCopyPaste,
      providerOrderId: charge.providerOrderId,
      providerChargeId: charge.providerChargeId,
      expiresAt: charge.expiresAt.toISOString(),
      mode: config.mode,
      connected: config.connected,
    });
  } catch (error) {
    console.error("quick-sale:create", error);
    return NextResponse.json(
      { error: "Não foi possível gerar o Pix. Tente novamente." },
      { status: 502 },
    );
  }
}
