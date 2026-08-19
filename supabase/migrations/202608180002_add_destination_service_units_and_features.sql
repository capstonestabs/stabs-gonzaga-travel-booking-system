alter table public.destination_services
  add column if not exists unit_count integer,
  add column if not exists unit_label text,
  add column if not exists features text[] not null default '{}';
