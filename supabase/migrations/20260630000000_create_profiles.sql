-- Sprint 3: Accountability partner profile
-- One profile record per user, extending auth.users with app-specific data.
-- Created by the client on first-launch onboarding completion.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  partner_name text not null,
  partner_phone text not null,
  custom_sms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One profile per user. Stores display name, accountability partner details, and optional custom SMS copy.';
comment on column public.profiles.partner_phone is
  'E.164 format, e.g. +12345678901';
comment on column public.profiles.custom_sms is
  'Optional custom SMS template. Null means use the default copy templates.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

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
