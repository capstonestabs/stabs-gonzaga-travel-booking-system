do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_type') then
    create type public.booking_type as enum ('online', 'walk-in');
  end if;
end $$;

alter table public.destinations
add column if not exists booking_type public.booking_type not null default 'online';

create index if not exists destinations_booking_type_idx on public.destinations (booking_type);
