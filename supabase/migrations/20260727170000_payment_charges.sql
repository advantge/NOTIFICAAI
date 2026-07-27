create table if not exists public.payment_charges (
  id text primary key,
  provider text not null,
  provider_order_id text not null,
  provider_charge_id text,
  amount_cents integer not null check (amount_cents > 0),
  pix_code text,
  status text not null check (status in ('AWAITING_PAYMENT', 'PAID', 'DECLINED', 'CANCELED', 'EXPIRED')),
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_charges_provider_order_unique unique (provider, provider_order_id),
  constraint payment_charges_provider_charge_unique unique (provider, provider_charge_id)
);

create index if not exists payment_charges_status_created_idx
  on public.payment_charges (status, created_at desc);

alter table public.payment_charges enable row level security;
revoke all on table public.payment_charges from anon, authenticated;

create policy payment_charges_no_client_access
  on public.payment_charges
  for all
  to anon, authenticated
  using (false)
  with check (false);
