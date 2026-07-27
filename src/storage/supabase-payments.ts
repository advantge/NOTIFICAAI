type SupabasePaymentRow = {
  id: string;
  provider: string;
  provider_order_id: string;
  provider_charge_id: string | null;
  amount_cents: number;
  status: "AWAITING_PAYMENT" | "PAID" | "DECLINED" | "CANCELED" | "EXPIRED";
  expires_at: string | null;
  paid_at: string | null;
};

type PaymentStorageInput = {
  id: string;
  provider: string;
  providerOrderId: string;
  providerChargeId: string;
  amountCents: number;
  status: SupabasePaymentRow["status"];
  expiresAt: Date;
};

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  // The service/secret key is server-only. A publishable key must never be
  // used for these writes because it is intentionally restricted by RLS.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function isSupabasePaymentStorageConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

async function supabaseRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase payment storage is not configured.");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Supabase payment storage failed (${response.status}): ${detail}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function savePaymentCharge(
  input: PaymentStorageInput,
): Promise<void> {
  await supabaseRequest<SupabasePaymentRow[]>("payment_charges", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: input.id,
      provider: input.provider,
      provider_order_id: input.providerOrderId,
      provider_charge_id: input.providerChargeId,
      amount_cents: input.amountCents,
      status: input.status,
      expires_at: input.expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function findPaymentCharge(
  provider: string,
  providerOrderId: string,
): Promise<SupabasePaymentRow | null> {
  const params = new URLSearchParams({
    provider: `eq.${provider}`,
    provider_order_id: `eq.${providerOrderId}`,
    select:
      "id,provider,provider_order_id,provider_charge_id,amount_cents,status,expires_at,paid_at",
    limit: "1",
  });
  const rows = await supabaseRequest<SupabasePaymentRow[]>(
    `payment_charges?${params.toString()}`,
  );
  return rows[0] ?? null;
}

export async function markPaymentPaid(
  provider: string,
  providerOrderId: string,
  paidAt: Date,
): Promise<void> {
  const params = new URLSearchParams({
    provider: `eq.${provider}`,
    provider_order_id: `eq.${providerOrderId}`,
  });
  await supabaseRequest<SupabasePaymentRow[]>(
    `payment_charges?${params.toString()}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "PAID",
        paid_at: paidAt.toISOString(),
        updated_at: new Date().toISOString(),
      }),
    },
  );
}
