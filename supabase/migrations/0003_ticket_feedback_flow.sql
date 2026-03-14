alter table public.bookings
add column if not exists ticket_code text;

create unique index if not exists bookings_ticket_code_key
on public.bookings (ticket_code)
where ticket_code is not null;

alter table public.feedback_entries
add column if not exists destination_id uuid references public.destinations (id) on delete cascade;

create index if not exists feedback_entries_destination_id_idx
on public.feedback_entries (destination_id);
