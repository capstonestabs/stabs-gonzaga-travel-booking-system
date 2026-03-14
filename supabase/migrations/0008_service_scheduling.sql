-- Migration 0008: Service-Level Capacity and Scheduling

-- 1. Add daily_capacity to destination_services
ALTER TABLE public.destination_services
ADD COLUMN daily_capacity integer NOT NULL DEFAULT 10 CHECK (daily_capacity >= 0);

-- 2. Add service_id to booking_slot_locks
ALTER TABLE public.booking_slot_locks
ADD COLUMN service_id uuid REFERENCES public.destination_services (id) ON DELETE CASCADE;

-- Default existing locks to a service (we'll just let them map to the first service if needed, or null if the app allows it.
-- But we want service_id to be NOT NULL eventually. For now, keep it nullable to not break existing locks mid-migration,
-- or we can just truncate locks since they are ephemeral anyway).
DELETE FROM public.booking_slot_locks;
ALTER TABLE public.booking_slot_locks ALTER COLUMN service_id SET NOT NULL;

-- 3. Create a simple table for Staff to "Close" dates for specific services
CREATE TABLE IF NOT EXISTS public.service_availability_closures (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.destination_services (id) on delete cascade,
  closed_date date not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (service_id, closed_date)
);

create index if not exists service_availability_closures_idx
on public.service_availability_closures (service_id, closed_date);

alter table public.service_availability_closures enable row level security;

-- 4. RLS for the new closures table
CREATE POLICY "Enable public read access for active closures" ON public.service_availability_closures
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for assigned service staff closures" ON public.service_availability_closures
    FOR ALL USING (
        service_id IN (
            SELECT s.id FROM public.destination_services s
            JOIN public.destinations d ON d.id = s.destination_id
            WHERE d.staff_id = auth.uid()
        )
    ) WITH CHECK (
        service_id IN (
            SELECT s.id FROM public.destination_services s
            JOIN public.destinations d ON d.id = s.destination_id
            WHERE d.staff_id = auth.uid()
        )
    );

GRANT ALL ON TABLE public.service_availability_closures TO authenticated;
GRANT ALL ON TABLE public.service_availability_closures TO service_role;
GRANT SELECT ON TABLE public.service_availability_closures TO anon;

-- 5. Create the new get_service_capacity RPC
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

  -- Fetch the base daily capacity for the service
  select *
  into v_service
  from public.destination_services
  where id = p_service_id;

  if not found or not v_service.is_active then
    v_is_open := false;
    v_capacity := 0;
  else
    v_capacity := v_service.daily_capacity;

    -- Check if there is a manual closure for this date
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

-- 6. Update create_booking_slot_lock to use service_id
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
  -- Lock on the service and date instead of destination to prevent race conditions per service
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

-- 7. Update finalize_paid_booking_capacity to use service_id
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
