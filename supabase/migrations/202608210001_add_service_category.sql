alter table public.destination_services
  add column if not exists service_category text not null default 'core'
    check (service_category in ('core', 'additional')),
  add column if not exists unit_count integer,
  add column if not exists unit_label text,
  add column if not exists features text[] not null default '{}'::text[];

create index if not exists destination_services_category_idx
  on public.destination_services (destination_id, service_category);