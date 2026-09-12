alter table public.destination_services
  add column if not exists availability_start_time time,
  add column if not exists availability_end_time time;
