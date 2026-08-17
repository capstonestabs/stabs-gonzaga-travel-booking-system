-- Restrict authenticated profile updates to non-privileged public.users fields.
--
-- Administrative account changes continue to use server endpoints backed by the
-- service_role client, which bypasses RLS. Email verification remains owned by
-- auth.users, and destination assignment remains owned by destinations.staff_id.

revoke all privileges on table public.users from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.users
  from authenticated;

grant select on table public.users to authenticated;
grant update (full_name, phone, avatar_url, avatar_path)
  on table public.users
  to authenticated;

create or replace function public.protect_users_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'authenticated'
    and (
      new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role is distinct from old.role
      or new.archived_at is distinct from old.archived_at
      or new.created_at is distinct from old.created_at
    )
  then
    raise exception 'Authenticated users may update profile fields only.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_users_privileged_fields() from public;
revoke all on function public.protect_users_privileged_fields() from anon;
revoke all on function public.protect_users_privileged_fields() from authenticated;
grant execute on function public.protect_users_privileged_fields() to service_role;

drop trigger if exists users_protect_privileged_fields on public.users;
create trigger users_protect_privileged_fields
before update on public.users
for each row execute function public.protect_users_privileged_fields();

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
