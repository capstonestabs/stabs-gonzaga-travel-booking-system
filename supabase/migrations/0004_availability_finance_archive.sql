do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'financial_settlement_status'
  ) then
    create type public.financial_settlement_status as enum ('unsettled', 'settled');
  end if;
end $$;

alter table public.users
add column if not exists avatar_path text;

alter table public.users
add column if not exists archived_at timestamptz;

create table if not exists public.destination_availability_windows (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  default_capacity integer not null check (default_capacity > 0),
  is_open boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (end_date >= start_date)
);

create table if not exists public.destination_availability_overrides (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete cascade,
  service_date date not null,
  capacity integer not null default 0 check (capacity >= 0),
  is_open boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (destination_id, service_date)
);

create table if not exists public.booking_slot_locks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  service_date date not null,
  guest_count integer not null check (guest_count > 0),
  checkout_session_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique,
  payment_id uuid unique,
  destination_id uuid not null,
  staff_id uuid not null,
  user_id uuid not null,
  destination_title text not null,
  destination_location_text text not null,
  destination_category public.listing_category not null,
  staff_name text,
  tourist_name text not null,
  tourist_email text,
  service_date date not null,
  guest_count integer not null check (guest_count > 0),
  amount integer not null check (amount > 0),
  currency text not null default 'PHP',
  payment_method_type text,
  ticket_code text,
  paid_at timestamptz not null,
  settlement_status public.financial_settlement_status not null default 'unsettled',
  settled_at timestamptz,
  receipt_reference text,
  settlement_notes text,
  deleted_booking_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists destination_availability_windows_destination_idx
on public.destination_availability_windows (destination_id, start_date, end_date);

create index if not exists destination_availability_overrides_destination_idx
on public.destination_availability_overrides (destination_id, service_date);

create index if not exists booking_slot_locks_destination_idx
on public.booking_slot_locks (destination_id, service_date, expires_at);

create index if not exists financial_records_destination_idx
on public.financial_records (destination_id, paid_at desc);

create index if not exists financial_records_settlement_idx
on public.financial_records (settlement_status, paid_at desc);

create index if not exists bookings_destination_date_status_idx
on public.bookings (destination_id, service_date, status);

drop trigger if exists destination_availability_windows_touch_updated_at on public.destination_availability_windows;
create trigger destination_availability_windows_touch_updated_at
before update on public.destination_availability_windows
for each row execute function public.touch_updated_at();

drop trigger if exists destination_availability_overrides_touch_updated_at on public.destination_availability_overrides;
create trigger destination_availability_overrides_touch_updated_at
before update on public.destination_availability_overrides
for each row execute function public.touch_updated_at();

drop trigger if exists booking_slot_locks_touch_updated_at on public.booking_slot_locks;
create trigger booking_slot_locks_touch_updated_at
before update on public.booking_slot_locks
for each row execute function public.touch_updated_at();

drop trigger if exists financial_records_touch_updated_at on public.financial_records;
create trigger financial_records_touch_updated_at
before update on public.financial_records
for each row execute function public.touch_updated_at();

alter table public.destination_availability_windows enable row level security;
alter table public.destination_availability_overrides enable row level security;
alter table public.booking_slot_locks enable row level security;
alter table public.financial_records enable row level security;

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
    and status = 'pending_payment';

  delete from public.booking_slot_locks
  where expires_at <= timezone('utc'::text, now());
end;
$$;

create or replace function public.get_destination_capacity(
  p_destination_id uuid,
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
  v_is_open boolean := false;
  v_has_windows boolean := false;
begin
  perform public.release_expired_slot_locks();

  if exists (
    select 1
    from public.destination_availability_overrides
    where destination_id = p_destination_id
      and service_date = p_service_date
  ) then
    select o.is_open, o.capacity
    into v_is_open, v_capacity
    from public.destination_availability_overrides o
    where o.destination_id = p_destination_id
      and o.service_date = p_service_date
    limit 1;
  else
    select exists (
      select 1
      from public.destination_availability_windows
      where destination_id = p_destination_id
    )
    into v_has_windows;

    if v_has_windows then
      select w.is_open, w.default_capacity
      into v_is_open, v_capacity
      from public.destination_availability_windows w
      where w.destination_id = p_destination_id
        and p_service_date between w.start_date and w.end_date
      order by w.start_date desc, w.created_at desc
      limit 1;

      if not found then
        v_is_open := false;
        v_capacity := 0;
      end if;
    else
      select true, d.max_guests
      into v_is_open, v_capacity
      from public.destinations d
      where d.id = p_destination_id
      limit 1;

      if not found then
        v_is_open := false;
        v_capacity := 0;
      end if;
    end if;
  end if;

  confirmed_guests := coalesce((
    select sum(b.guest_count)
    from public.bookings b
    where b.destination_id = p_destination_id
      and b.service_date = p_service_date
      and b.status in ('confirmed', 'completed')
  ), 0);

  locked_guests := coalesce((
    select sum(l.guest_count)
    from public.booking_slot_locks l
    where l.destination_id = p_destination_id
      and l.service_date = p_service_date
      and l.expires_at > timezone('utc'::text, now())
  ), 0);

  capacity := greatest(coalesce(v_capacity, 0), 0);
  is_open := coalesce(v_is_open, false) and capacity > 0;
  remaining_guests := case
    when is_open then greatest(capacity - confirmed_guests - locked_guests, 0)
    else 0
  end;

  return next;
end;
$$;

create or replace function public.create_booking_slot_lock(
  p_booking_id uuid,
  p_destination_id uuid,
  p_user_id uuid,
  p_service_date date,
  p_guest_count integer,
  p_expires_at timestamptz
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
  v_availability record;
begin
  perform pg_advisory_xact_lock(hashtext(p_destination_id::text), hashtext(p_service_date::text));

  select *
  into v_availability
  from public.get_destination_capacity(p_destination_id, p_service_date);

  if not coalesce(v_availability.is_open, false) then
    raise exception 'The selected date is not available.';
  end if;

  if coalesce(v_availability.remaining_guests, 0) < p_guest_count then
    raise exception 'The selected date does not have enough slots remaining.';
  end if;

  insert into public.booking_slot_locks (
    booking_id,
    destination_id,
    user_id,
    service_date,
    guest_count,
    expires_at
  )
  values (
    p_booking_id,
    p_destination_id,
    p_user_id,
    p_service_date,
    p_guest_count,
    p_expires_at
  )
  on conflict (booking_id) do update
  set destination_id = excluded.destination_id,
      user_id = excluded.user_id,
      service_date = excluded.service_date,
      guest_count = excluded.guest_count,
      expires_at = excluded.expires_at,
      updated_at = timezone('utc'::text, now());

  return query
  select *
  from public.get_destination_capacity(p_destination_id, p_service_date);
end;
$$;

create or replace function public.finalize_paid_booking_capacity(
  p_booking_id uuid
)
returns table (
  capacity integer,
  confirmed_guests integer,
  remaining_guests integer
)
language plpgsql
as $$
declare
  v_booking record;
  v_availability record;
begin
  perform public.release_expired_slot_locks();

  select b.id, b.destination_id, b.service_date, b.guest_count, b.status
  into v_booking
  from public.bookings b
  where b.id = p_booking_id
  limit 1;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'The slot lock already expired for this booking.';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(v_booking.destination_id::text),
    hashtext(v_booking.service_date::text)
  );

  select *
  into v_availability
  from public.get_destination_capacity(v_booking.destination_id, v_booking.service_date);

  if not coalesce(v_availability.is_open, false) then
    raise exception 'The selected date is no longer available.';
  end if;

  if greatest(coalesce(v_availability.capacity, 0) - coalesce(v_availability.confirmed_guests, 0), 0) < v_booking.guest_count then
    raise exception 'The selected date is already fully booked.';
  end if;

  delete from public.booking_slot_locks
  where booking_id = p_booking_id;

  capacity := coalesce(v_availability.capacity, 0);
  confirmed_guests := coalesce(v_availability.confirmed_guests, 0) + v_booking.guest_count;
  remaining_guests := greatest(capacity - confirmed_guests, 0);

  return next;
end;
$$;
