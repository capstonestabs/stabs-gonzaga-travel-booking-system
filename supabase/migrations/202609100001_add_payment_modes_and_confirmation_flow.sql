-- Add staff confirmation, online/onsite payment modes, and onsite settlement data.

alter type public.booking_status add value if not exists 'awaiting_confirmation';
alter type public.booking_status add value if not exists 'declined';
alter type public.booking_status add value if not exists 'awaiting_onsite_payment';

alter table public.bookings
  add column if not exists payment_mode text,
  add column if not exists decline_reason text,
  add column if not exists declined_at timestamptz,
  add column if not exists declined_by uuid references public.users (id) on delete set null;

update public.bookings
set payment_mode = 'online'
where payment_mode is null;

alter table public.bookings
  alter column payment_mode set default 'online',
  alter column payment_mode set not null;

alter table public.bookings
  drop constraint if exists bookings_payment_mode_check,
  add constraint bookings_payment_mode_check
    check (payment_mode in ('online', 'onsite'));

create table if not exists public.onsite_receipts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  receipt_code text not null unique,
  receipt_issued_at timestamptz not null default timezone('utc'::text, now()),
  recorded_by_staff_id uuid references public.users (id) on delete set null,
  recorded_at timestamptz,
  amount_recorded integer check (amount_recorded is null or amount_recorded > 0),
  payment_method text not null default 'cash',
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint onsite_receipts_payment_method_check check (payment_method = 'cash'),
  constraint onsite_receipts_recording_fields_check check (
    (recorded_at is null and recorded_by_staff_id is null and amount_recorded is null)
    or (recorded_at is not null and recorded_by_staff_id is not null and amount_recorded is not null)
  )
);

alter table public.financial_records
  add column if not exists payment_mode text;

update public.financial_records
set payment_mode = 'online'
where payment_mode is null;

alter table public.financial_records
  alter column payment_mode set default 'online',
  alter column payment_mode set not null;

alter table public.financial_records
  drop constraint if exists financial_records_payment_mode_check,
  add constraint financial_records_payment_mode_check
    check (payment_mode in ('online', 'onsite'));

create index if not exists bookings_payment_mode_status_idx
  on public.bookings (payment_mode, status);

create index if not exists financial_records_payment_mode_idx
  on public.financial_records (payment_mode, paid_at desc);

create index if not exists onsite_receipts_recorded_at_idx
  on public.onsite_receipts (recorded_at);

drop trigger if exists onsite_receipts_touch_updated_at on public.onsite_receipts;
create trigger onsite_receipts_touch_updated_at
before update on public.onsite_receipts
for each row execute function public.touch_updated_at();

alter table public.onsite_receipts enable row level security;
revoke all on table public.onsite_receipts from anon, authenticated;
grant all on table public.onsite_receipts to service_role;

drop policy if exists "Users can read own onsite receipts" on public.onsite_receipts;
create policy "Users can read own onsite receipts"
on public.onsite_receipts
for select
using (
  exists (
    select 1
    from public.bookings
    where public.bookings.id = public.onsite_receipts.booking_id
      and (public.bookings.user_id = auth.uid() or public.bookings.staff_id = auth.uid())
  )
);

create or replace function public.release_expired_slot_locks()
returns void
language plpgsql
as $$
begin
  update public.payments
  set status = 'expired'
  where booking_id in (
    select booking_id
    from public.booking_slot_locks
    where expires_at <= timezone('utc'::text, now())
  )
    and status = 'pending';

  update public.bookings
  set status = 'cancelled',
      cancelled_at = timezone('utc'::text, now())
  where id in (
    select booking_id
    from public.booking_slot_locks
    where expires_at <= timezone('utc'::text, now())
  )
    and status in ('pending_payment', 'awaiting_confirmation');

  delete from public.booking_slot_locks
  where expires_at <= timezone('utc'::text, now());
end;
$$;

create or replace function public.get_service_capacity(
  p_service_id uuid,
  p_service_date date
)
returns table (
  is_open boolean,
  capacity integer,
  confirmed_guests integer,
  locked_guests integer,
  remaining_guests integer
)
language plpgsql
as $$
declare
  v_capacity integer := 0;
  v_is_open boolean := true;
  v_service record;
begin
  perform public.release_expired_slot_locks();

  select * into v_service
  from public.destination_services
  where id = p_service_id;

  if not found or not v_service.is_active then
    v_is_open := false;
    v_capacity := 0;
  else
    v_capacity := v_service.daily_capacity;
    if v_service.availability_start_date is not null and p_service_date < v_service.availability_start_date then
      v_is_open := false;
    end if;
    if v_service.availability_end_date is not null and p_service_date > v_service.availability_end_date then
      v_is_open := false;
    end if;
    if not (extract(isodow from p_service_date)::smallint = any(v_service.open_weekdays)) then
      v_is_open := false;
    end if;
    if exists (
      select 1 from public.service_availability_closures
      where service_id = p_service_id and closed_date = p_service_date
    ) then
      v_is_open := false;
    end if;
  end if;

  confirmed_guests := coalesce((
    select sum(b.guest_count) from public.bookings b
    where b.service_id = p_service_id and b.service_date = p_service_date
      and b.status in ('confirmed', 'awaiting_onsite_payment', 'completed')
  ), 0);

  locked_guests := coalesce((
    select sum(l.guest_count) from public.booking_slot_locks l
    where l.service_id = p_service_id and l.service_date = p_service_date
      and l.expires_at > timezone('utc'::text, now())
  ), 0);

  capacity := greatest(coalesce(v_capacity, 0), 0);
  is_open := coalesce(v_is_open, false) and capacity > 0;
  remaining_guests := case when is_open then greatest(capacity - confirmed_guests - locked_guests, 0) else 0 end;
  return next;
end;
$$;
