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
end $$;

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
  title text not null,
  summary text not null,
  description text not null,
  location_text text not null,
  province text,
  city text,
  price_amount integer not null check (price_amount > 0),
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

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  staff_id uuid not null references public.users (id) on delete cascade,
  status public.booking_status not null default 'pending_payment',
  service_date date not null,
  guest_count integer not null check (guest_count > 0),
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  notes text,
  total_amount integer not null check (total_amount > 0),
  currency text not null default 'PHP',
  destination_snapshot jsonb not null default '{}'::jsonb,
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

create index if not exists destinations_staff_id_idx on public.destinations (staff_id);
create index if not exists destinations_status_idx on public.destinations (status);
create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_staff_id_idx on public.bookings (staff_id);
create index if not exists payments_checkout_session_idx on public.payments (paymongo_checkout_session_id);

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

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
before update on public.payments
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

alter table public.users enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.destination_images enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

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
