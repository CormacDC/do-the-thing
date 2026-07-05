-- Sprint 5: Auth & User Accounts
-- Re-apply idempotent RLS policies for all user-owned tables.
-- DROP POLICY IF EXISTS may emit harmless NOTICEs when policies were never
-- created locally (e.g. tasks RLS from Sprint 1 existed only on remote).
-- All auth methods (email, OAuth, anonymous) use the authenticated role;
-- policies gate on auth.uid() so linked identities keep the same user id.

-- ---------------------------------------------------------------------------
-- tasks (Sprint 1 — policies may exist remotely; ensure they are present)
-- ---------------------------------------------------------------------------

alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
  on public.tasks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
  on public.tasks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.tasks to authenticated;

-- ---------------------------------------------------------------------------
-- deadlines (Sprint 2)
-- ---------------------------------------------------------------------------

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

grant select, insert, update on table public.deadlines to authenticated;

-- ---------------------------------------------------------------------------
-- profiles (Sprint 3)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, insert, update on table public.profiles to authenticated;
