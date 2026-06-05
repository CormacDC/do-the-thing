-- Sprint 2: Task Timer
-- One deadline record per user (enforced by a unique constraint on user_id).
-- twilio_message_sid is reserved for Sprint 3 and stays null until then.

create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deadline_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds > 0),
  twilio_message_sid text,
  status text not null default 'active' check (status in ('active', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deadlines_user_id_key unique (user_id)
);

comment on table public.deadlines is
  'One deadline record per user. Tracks the active countdown and (from Sprint 3) the scheduled Twilio message.';
comment on column public.deadlines.duration_seconds is
  'Original chosen duration. deadline_at advances by this amount when it lapses without completion.';
comment on column public.deadlines.twilio_message_sid is
  'Nullable. Unused until Sprint 3 (Twilio scheduled SMS).';

-- Keep updated_at fresh on every write (same pattern as the tasks table).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deadlines_set_updated_at on public.deadlines;
create trigger deadlines_set_updated_at
  before update on public.deadlines
  for each row
  execute function public.set_updated_at();

-- Row Level Security: users may only touch their own deadline record.
alter table public.deadlines enable row level security;

drop policy if exists "Users can view their own deadline" on public.deadlines;
create policy "Users can view their own deadline"
  on public.deadlines
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own deadline" on public.deadlines;
create policy "Users can insert their own deadline"
  on public.deadlines
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own deadline" on public.deadlines;
create policy "Users can update their own deadline"
  on public.deadlines
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Base table privileges. Anonymous sign-ins use the authenticated role,
-- so without this grant RLS-passing queries still fail with "permission denied".
grant select, insert, update on table public.deadlines to authenticated;
