create table if not exists public.booking_guest_visits (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  guest_number integer not null check (guest_number > 0),
  checked_in_at timestamptz,
  checked_in_by uuid references public.users (id) on delete set null,
  checked_out_at timestamptz,
  checked_out_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (booking_id, guest_number),
  constraint booking_guest_visits_checkout_requires_checkin check (checked_out_at is null or checked_in_at is not null),
  constraint booking_guest_visits_time_order check (checked_out_at is null or checked_out_at >= checked_in_at)
);

alter table public.payments
  add column if not exists paymongo_refund_id text,
  add column if not exists refund_status text,
  add column if not exists refund_amount integer,
  add column if not exists refund_reason text,
  add column if not exists refunded_at timestamptz;

alter table public.bookings
  add column if not exists policy_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_notice_version text;

alter table public.financial_records
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_amount integer,
  add column if not exists refund_reference text;

create index if not exists booking_guest_visits_booking_idx on public.booking_guest_visits (booking_id, guest_number);

drop trigger if exists booking_guest_visits_touch_updated_at on public.booking_guest_visits;
create trigger booking_guest_visits_touch_updated_at before update on public.booking_guest_visits
for each row execute function public.touch_updated_at();

alter table public.booking_guest_visits enable row level security;
revoke all on table public.booking_guest_visits from anon, authenticated;
grant all on table public.booking_guest_visits to service_role;
