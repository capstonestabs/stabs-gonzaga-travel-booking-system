alter table public.bookings
  add column if not exists check_in_time time;
