alter table public.financial_records
add column if not exists archived_at timestamptz;

create index if not exists financial_records_archived_idx
on public.financial_records (archived_at, paid_at desc);
