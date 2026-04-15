-- STABS final Supabase schema
-- This is the single source-of-truth SQL file for the current database shape.
-- Old migration fragments have been consolidated here.
-- Obsolete destination-wide availability tables/functions are cleaned up here
-- because the app now uses service-based availability only.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'staff', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_category') then
    create type public.listing_category as enum ('tour', 'stay');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type public.listing_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('pending_payment', 'confirmed', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'financial_settlement_status') then
    create type public.financial_settlement_status as enum ('unsettled', 'settled');
  end if;

  if not exists (select 1 from pg_type where typname = 'booking_type') then
    create type public.booking_type as enum ('online', 'walk-in');
  end if;
end $$;

drop function if exists public.get_destination_capacity(uuid, date);
drop function if exists public.create_booking_slot_lock(uuid, uuid, uuid, date, integer, timestamptz);
drop table if exists public.destination_availability_overrides cascade;
drop table if exists public.destination_availability_windows cascade;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'user',
  phone text,
  avatar_url text,
  avatar_path text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  display_name text,
  business_name text,
  bio text,
  contact_email text,
  contact_phone text,
  base_location text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  staff_id uuid not null references public.users (id) on delete cascade,
  category public.listing_category not null,
  status public.listing_status not null default 'draft',
  booking_type public.booking_type not null default 'online',
  title text not null,
  summary text not null,
  description text not null,
  location_text text not null,
  province text,
  city text,
  price_amount integer check (price_amount > 0),
  currency text not null default 'PHP',
  max_guests integer not null default 1 check (max_guests > 0),
  duration_text text,
  inclusions text[] not null default '{}',
  policies text[] not null default '{}',
  cover_path text,
  cover_url text,
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.destination_images (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete cascade,
  storage_path text not null,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.destination_services (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations (id) on delete cascade,
  title text not null,
  description text,
  price_amount numeric(10, 2) not null check (price_amount >= 0),
  service_type text not null default 'person' check (char_length(btrim(service_type)) between 1 and 40),
  daily_capacity integer not null default 10 check (daily_capacity >= 0),
  is_active boolean not null default true,
  image_path text,
  image_url text,
  availability_start_date date,
  availability_end_date date,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint destination_services_availability_window_check
    check (
      availability_start_date is null
      or availability_end_date is null
      or availability_start_date <= availability_end_date
    )
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  staff_id uuid not null references public.users (id) on delete cascade,
  status public.booking_status not null default 'pending_payment',
  service_id uuid references public.destination_services (id) on delete set null,
  service_date date not null,
  guest_count integer not null check (guest_count > 0),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  notes text,
  total_amount integer not null check (total_amount > 0),
  currency text not null default 'PHP',
  destination_snapshot jsonb not null default '{}'::jsonb,
  service_snapshot jsonb default null,
  ticket_code text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  paymongo_checkout_session_id text unique,
  paymongo_payment_id text,
  paymongo_event_id text,
  checkout_url text,
  status public.payment_status not null default 'pending',
  amount integer not null check (amount > 0),
  currency text not null default 'PHP',
  payment_method_type text,
  raw_payload jsonb,
  livemode boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations (id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.booking_slot_locks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  service_id uuid not null references public.destination_services (id) on delete cascade,
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
  archived_at timestamptz,
  purged_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.service_availability_closures (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.destination_services (id) on delete cascade,
  closed_date date not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (service_id, closed_date)
);

alter table public.users
  add column if not exists avatar_path text,
  add column if not exists archived_at timestamptz;

alter table public.destinations
  add column if not exists booking_type public.booking_type not null default 'online';

alter table public.destinations
  alter column price_amount drop not null;

alter table public.bookings
  add column if not exists service_id uuid,
  add column if not exists service_snapshot jsonb default null,
  add column if not exists ticket_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_service_id_fkey'
  ) then
    alter table public.bookings
      add constraint bookings_service_id_fkey
      foreign key (service_id) references public.destination_services (id) on delete set null;
  end if;
end $$;

alter table public.destination_services
  add column if not exists daily_capacity integer not null default 10,
  add column if not exists image_path text,
  add column if not exists image_url text,
  add column if not exists availability_start_date date,
  add column if not exists availability_end_date date;

alter table public.destination_services
  alter column service_type set default 'person';

alter table public.destination_services
  drop constraint if exists destination_services_service_type_check;

alter table public.destination_services
  add constraint destination_services_service_type_check
  check (char_length(btrim(service_type)) between 1 and 40);

update public.destination_services as service
set service_type = case
  when destination.category = 'stay' then 'stay'
  else 'person'
end
from public.destinations as destination
where service.destination_id = destination.id
  and (
    service.service_type is null
    or btrim(service.service_type) = ''
    or lower(service.service_type) in ('standard', 'package', 'discounted')
  );

update public.bookings as booking
set service_snapshot = jsonb_set(
  booking.service_snapshot,
  '{service_type}',
  to_jsonb(
    case
      when destination.category = 'stay' then 'stay'
      else 'person'
    end
  ),
  true
)
from public.destinations as destination
where booking.destination_id = destination.id
  and booking.service_snapshot is not null
  and (
    booking.service_snapshot ->> 'service_type' is null
    or btrim(booking.service_snapshot ->> 'service_type') = ''
    or lower(booking.service_snapshot ->> 'service_type') in ('standard', 'package', 'discounted')
  );

alter table public.destination_services
  drop constraint if exists destination_services_availability_window_check;

alter table public.destination_services
  add constraint destination_services_availability_window_check
  check (
    availability_start_date is null
    or availability_end_date is null
    or availability_start_date <= availability_end_date
  );

alter table public.financial_records
  add column if not exists archived_at timestamptz,
  add column if not exists purged_at timestamptz;

alter table public.financial_records
  drop column if exists paymongo_fee_amount,
  drop column if exists net_received_amount;

create index if not exists destinations_staff_id_idx
  on public.destinations (staff_id);

create index if not exists destinations_status_idx
  on public.destinations (status);

create index if not exists destinations_booking_type_idx
  on public.destinations (booking_type);

create index if not exists destination_images_destination_sort_idx
  on public.destination_images (destination_id, sort_order, created_at);

create index if not exists destination_services_destination_idx
  on public.destination_services (destination_id, is_active, created_at desc);

create index if not exists destination_services_availability_window_idx
  on public.destination_services (availability_start_date, availability_end_date);

create index if not exists bookings_user_id_idx
  on public.bookings (user_id);

create index if not exists bookings_staff_id_idx
  on public.bookings (staff_id);

create index if not exists bookings_destination_date_status_idx
  on public.bookings (destination_id, service_date, status);

create index if not exists bookings_service_date_status_idx
  on public.bookings (service_id, service_date, status);

create unique index if not exists bookings_ticket_code_key
  on public.bookings (ticket_code)
  where ticket_code is not null;

create index if not exists payments_checkout_session_idx
  on public.payments (paymongo_checkout_session_id);

create index if not exists feedback_entries_destination_id_idx
  on public.feedback_entries (destination_id);

create index if not exists feedback_entries_destination_created_idx
  on public.feedback_entries (destination_id, created_at desc);

create index if not exists booking_slot_locks_destination_idx
  on public.booking_slot_locks (destination_id, service_date, expires_at);

create index if not exists booking_slot_locks_service_idx
  on public.booking_slot_locks (service_id, service_date, expires_at);

create index if not exists financial_records_destination_idx
  on public.financial_records (destination_id, paid_at desc);

create index if not exists financial_records_settlement_idx
  on public.financial_records (settlement_status, paid_at desc);

create index if not exists financial_records_archived_idx
  on public.financial_records (archived_at, paid_at desc);

create index if not exists financial_records_purge_archive_idx
  on public.financial_records (purged_at, archived_at, paid_at desc);

create index if not exists service_availability_closures_idx
  on public.service_availability_closures (service_id, closed_date);

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists staff_profiles_touch_updated_at on public.staff_profiles;
create trigger staff_profiles_touch_updated_at
before update on public.staff_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists destinations_touch_updated_at on public.destinations;
create trigger destinations_touch_updated_at
before update on public.destinations
for each row execute function public.touch_updated_at();

drop trigger if exists destination_services_touch_updated_at on public.destination_services;
create trigger destination_services_touch_updated_at
before update on public.destination_services
for each row execute function public.touch_updated_at();

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
before update on public.payments
for each row execute function public.touch_updated_at();

drop trigger if exists booking_slot_locks_touch_updated_at on public.booking_slot_locks;
create trigger booking_slot_locks_touch_updated_at
before update on public.booking_slot_locks
for each row execute function public.touch_updated_at();

drop trigger if exists financial_records_touch_updated_at on public.financial_records;
create trigger financial_records_touch_updated_at
before update on public.financial_records
for each row execute function public.touch_updated_at();

drop trigger if exists service_availability_closures_touch_updated_at on public.service_availability_closures;
create trigger service_availability_closures_touch_updated_at
before update on public.service_availability_closures
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

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

  select *
  into v_service
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

    if exists (
      select 1
      from public.service_availability_closures
      where service_id = p_service_id
        and closed_date = p_service_date
    ) then
      v_is_open := false;
    end if;
  end if;

  confirmed_guests := coalesce((
    select sum(b.guest_count)
    from public.bookings b
    where b.service_id = p_service_id
      and b.service_date = p_service_date
      and b.status in ('confirmed', 'completed')
  ), 0);

  locked_guests := coalesce((
    select sum(l.guest_count)
    from public.booking_slot_locks l
    where l.service_id = p_service_id
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
  p_service_id uuid,
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
  perform pg_advisory_xact_lock(hashtext(p_service_id::text), hashtext(p_service_date::text));

  select *
  into v_availability
  from public.get_service_capacity(p_service_id, p_service_date);

  if not coalesce(v_availability.is_open, false) then
    raise exception 'The selected date is not available or closed for this service.';
  end if;

  if coalesce(v_availability.remaining_guests, 0) < p_guest_count then
    raise exception 'The selected date does not have enough slots remaining.';
  end if;

  insert into public.booking_slot_locks (
    booking_id,
    destination_id,
    service_id,
    user_id,
    service_date,
    guest_count,
    expires_at
  )
  values (
    p_booking_id,
    p_destination_id,
    p_service_id,
    p_user_id,
    p_service_date,
    p_guest_count,
    p_expires_at
  )
  on conflict (booking_id) do update
  set destination_id = excluded.destination_id,
      service_id = excluded.service_id,
      user_id = excluded.user_id,
      service_date = excluded.service_date,
      guest_count = excluded.guest_count,
      expires_at = excluded.expires_at,
      updated_at = timezone('utc'::text, now());

  return query
  select *
  from public.get_service_capacity(p_service_id, p_service_date);
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

  select b.id, b.destination_id, b.service_id, b.service_date, b.guest_count, b.status
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
    hashtext(v_booking.service_id::text),
    hashtext(v_booking.service_date::text)
  );

  select *
  into v_availability
  from public.get_service_capacity(v_booking.service_id, v_booking.service_date);

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

alter table public.users enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.destination_images enable row level security;
alter table public.destination_services enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.feedback_entries enable row level security;
alter table public.booking_slot_locks enable row level security;
alter table public.financial_records enable row level security;
alter table public.service_availability_closures enable row level security;

drop policy if exists "Public published destinations" on public.destinations;
create policy "Public published destinations"
on public.destinations
for select
using (status = 'published');

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id);

drop policy if exists "Staff can read own profile" on public.staff_profiles;
create policy "Staff can read own profile"
on public.staff_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Staff can manage own listings" on public.destinations;
create policy "Staff can manage own listings"
on public.destinations
for all
using (auth.uid() = staff_id)
with check (auth.uid() = staff_id);

drop policy if exists "Public can read destination images" on public.destination_images;
create policy "Public can read destination images"
on public.destination_images
for select
using (true);

drop policy if exists "Enable public read access for active services" on public.destination_services;
create policy "Enable public read access for active services"
on public.destination_services
for select
using (is_active = true);

drop policy if exists "Enable all access for assigned staff" on public.destination_services;
drop policy if exists "Enable all access for assigned service staff" on public.destination_services;
create policy "Enable all access for assigned service staff"
on public.destination_services
for all
using (
  destination_id in (
    select id
    from public.destinations
    where staff_id = auth.uid()
  )
)
with check (
  destination_id in (
    select id
    from public.destinations
    where staff_id = auth.uid()
  )
);

drop policy if exists "Users can read own bookings" on public.bookings;
create policy "Users can read own bookings"
on public.bookings
for select
using (auth.uid() = user_id or auth.uid() = staff_id);

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
on public.payments
for select
using (
  exists (
    select 1
    from public.bookings
    where public.bookings.id = public.payments.booking_id
      and (public.bookings.user_id = auth.uid() or public.bookings.staff_id = auth.uid())
  )
);

drop policy if exists "Anyone can create feedback" on public.feedback_entries;
create policy "Anyone can create feedback"
on public.feedback_entries
for insert
with check (true);

drop policy if exists "Admins can read feedback" on public.feedback_entries;
create policy "Admins can read feedback"
on public.feedback_entries
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);

drop policy if exists "Enable public read access for active closures" on public.service_availability_closures;
create policy "Enable public read access for active closures"
on public.service_availability_closures
for select
using (true);

drop policy if exists "Enable all access for assigned service staff closures" on public.service_availability_closures;
create policy "Enable all access for assigned service staff closures"
on public.service_availability_closures
for all
using (
  service_id in (
    select s.id
    from public.destination_services s
    join public.destinations d on d.id = s.destination_id
    where d.staff_id = auth.uid()
  )
)
with check (
  service_id in (
    select s.id
    from public.destination_services s
    join public.destinations d on d.id = s.destination_id
    where d.staff_id = auth.uid()
  )
);

grant all on table public.destination_services to authenticated;
grant all on table public.destination_services to service_role;
grant select on table public.destination_services to anon;

grant all on table public.service_availability_closures to authenticated;
grant all on table public.service_availability_closures to service_role;
grant select on table public.service_availability_closures to anon;
