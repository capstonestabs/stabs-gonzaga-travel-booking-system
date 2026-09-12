alter table public.destination_services
  add column if not exists pricing_basis text not null default 'per_day' check (pricing_basis in ('per_day', 'per_night'));
