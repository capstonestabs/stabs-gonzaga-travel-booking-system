create table if not exists public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.feedback_entries enable row level security;

drop policy if exists "Anyone can create feedback" on public.feedback_entries;
create policy "Anyone can create feedback"
on public.feedback_entries
for insert
with check (true);

drop policy if exists "Admins can read feedback" on public.feedback_entries;
create policy "Admins can read feedback"
on public.feedback_entries
for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);
