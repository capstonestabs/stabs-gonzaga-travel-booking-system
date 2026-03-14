alter table public.financial_records
add column if not exists purged_at timestamptz;

create index if not exists financial_records_purge_archive_idx
on public.financial_records (purged_at, archived_at, paid_at desc);
