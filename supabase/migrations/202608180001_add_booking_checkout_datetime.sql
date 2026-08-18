alter table public.bookings
  add column if not exists check_out_date date,
  add column if not exists check_out_time time;
