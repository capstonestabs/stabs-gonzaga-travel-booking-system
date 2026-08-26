-- Add entrance fee columns to public.destinations
alter table public.destinations
  add column if not exists entrance_fee_amount integer default 0 check (entrance_fee_amount >= 0),
  add column if not exists is_entrance_fee_active boolean not null default false,
  add column if not exists entrance_fee_title text not null default 'Entrance Fee';
