-- Migration 0009: service photo support and bookable date windows

alter table public.destination_services
add column if not exists image_path text,
add column if not exists image_url text,
add column if not exists availability_start_date date,
add column if not exists availability_end_date date;

alter table public.destination_services
drop constraint if exists destination_services_availability_window_check;

alter table public.destination_services
add constraint destination_services_availability_window_check
check (
  availability_start_date is null
  or availability_end_date is null
  or availability_start_date <= availability_end_date
);

create index if not exists destination_services_availability_window_idx
on public.destination_services (availability_start_date, availability_end_date);

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
