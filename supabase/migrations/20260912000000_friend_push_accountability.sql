-- Friend push accountability: profiles friend codes, friendships, targets,
-- push tokens, deadline accountability status, and SECURITY DEFINER RPCs.

-- ---------------------------------------------------------------------------
-- Friend code generator (unambiguous alphabet, length 6)
-- ---------------------------------------------------------------------------
create or replace function public.generate_friend_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  end loop;
  return result;
end;
$$;

comment on function public.generate_friend_code() is
  'Returns a random 6-character friend invite code using an unambiguous alphabet.';

-- ---------------------------------------------------------------------------
-- Profiles: friend_code + nullable legacy partner fields
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists friend_code text;

-- Backfill existing rows before adding NOT NULL / UNIQUE.
do $$
declare
  r record;
  candidate text;
begin
  for r in select id from public.profiles where friend_code is null loop
    loop
      candidate := public.generate_friend_code();
      exit when not exists (
        select 1 from public.profiles p where p.friend_code = candidate
      );
    end loop;
    update public.profiles set friend_code = candidate where id = r.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column friend_code set not null;

alter table public.profiles
  alter column friend_code set default public.generate_friend_code();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_friend_code_key'
  ) then
    alter table public.profiles add constraint profiles_friend_code_key unique (friend_code);
  end if;
end;
$$;

alter table public.profiles
  alter column partner_name drop not null;

alter table public.profiles
  alter column partner_phone drop not null;

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

-- Existing profiles already finished the legacy onboarding flow.
update public.profiles
set onboarding_complete = true
where onboarding_complete = false
  and display_name is not null;

comment on column public.profiles.friend_code is
  'Unique 6-character invite code used to add this user as a friend.';
comment on column public.profiles.partner_name is
  'Legacy SMS partner name. Nullable; unused while ACCOUNTABILITY_CHANNEL is push.';
comment on column public.profiles.partner_phone is
  'Legacy SMS partner phone (E.164). Nullable; unused while ACCOUNTABILITY_CHANNEL is push.';
comment on column public.profiles.custom_sms is
  'Optional custom accountability message template (push body). Null means use defaults.';
comment on column public.profiles.onboarding_complete is
  'False until the user finishes the onboarding flow (allows early profile insert for friend_code).';

-- ---------------------------------------------------------------------------
-- Deadlines: accountability delivery status
-- ---------------------------------------------------------------------------
alter table public.deadlines
  add column if not exists accountability_status text not null default 'idle';

alter table public.deadlines
  drop constraint if exists deadlines_accountability_status_check;

alter table public.deadlines
  add constraint deadlines_accountability_status_check
  check (accountability_status in ('idle', 'pending', 'cancelled', 'sent', 'skipped'));

alter table public.deadlines
  add column if not exists accountability_sent_at timestamptz;

comment on column public.deadlines.accountability_status is
  'Server-owned push delivery intent: idle | pending | cancelled | sent | skipped.';
comment on column public.deadlines.accountability_sent_at is
  'When the midnight accountability push was dispatched (or null).';
comment on column public.deadlines.twilio_message_sid is
  'Legacy Twilio SID. Unused while ACCOUNTABILITY_CHANNEL is push.';

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_pair_unique unique (requester_id, addressee_id)
);

comment on table public.friendships is
  'Directed friend requests. After accept, the pair is treated as mutual via RPC queries.';
comment on column public.friendships.requester_id is
  'User who entered the friend code.';
comment on column public.friendships.addressee_id is
  'User who owns the friend code that was entered.';
comment on column public.friendships.status is
  'pending | accepted | declined.';

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
  before update on public.friendships
  for each row
  execute function public.set_updated_at();

create index if not exists friendships_requester_id_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_id_idx on public.friendships (addressee_id);
create index if not exists friendships_status_idx on public.friendships (status);

alter table public.friendships enable row level security;

drop policy if exists "Users can view their friendships" on public.friendships;
create policy "Users can view their friendships"
  on public.friendships
  for select
  to authenticated
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = addressee_id
  );

-- Mutations go through SECURITY DEFINER RPCs; no direct insert/update/delete for clients.
grant select on table public.friendships to authenticated;

-- ---------------------------------------------------------------------------
-- Accountability targets (who gets the midnight push)
-- ---------------------------------------------------------------------------
create table if not exists public.accountability_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint accountability_targets_no_self check (user_id <> partner_id),
  constraint accountability_targets_pair_unique unique (user_id, partner_id)
);

comment on table public.accountability_targets is
  'Selected friends who receive a midnight push when user_id misses quota.';
comment on column public.accountability_targets.user_id is
  'The user who sets the daily quota.';
comment on column public.accountability_targets.partner_id is
  'The friend who receives the push notification.';

create index if not exists accountability_targets_user_id_idx
  on public.accountability_targets (user_id);
create index if not exists accountability_targets_partner_id_idx
  on public.accountability_targets (partner_id);

alter table public.accountability_targets enable row level security;

drop policy if exists "Users can view own accountability targets" on public.accountability_targets;
create policy "Users can view own accountability targets"
  on public.accountability_targets
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select auth.uid()) = partner_id
  );

-- Mutations via RPCs only.
grant select on table public.accountability_targets to authenticated;

-- ---------------------------------------------------------------------------
-- Push tokens
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_token_unique unique (expo_push_token)
);

comment on table public.push_tokens is
  'Expo push tokens for remote accountability notifications. Multiple devices per user allowed.';
comment on column public.push_tokens.expo_push_token is
  'Expo push token string (ExponentPushToken[...]).';
comment on column public.push_tokens.platform is
  'ios | android | web | unknown.';

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row
  execute function public.set_updated_at();

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "Users can view their own push tokens" on public.push_tokens;
create policy "Users can view their own push tokens"
  on public.push_tokens
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own push tokens" on public.push_tokens;
create policy "Users can insert their own push tokens"
  on public.push_tokens
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own push tokens" on public.push_tokens;
create policy "Users can update their own push tokens"
  on public.push_tokens
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own push tokens" on public.push_tokens;
create policy "Users can delete their own push tokens"
  on public.push_tokens
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.push_tokens to authenticated;

-- ---------------------------------------------------------------------------
-- Helper: are two users accepted friends? (either direction)
-- ---------------------------------------------------------------------------
create or replace function public.are_accepted_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

comment on function public.are_accepted_friends(uuid, uuid) is
  'True when an accepted friendship exists between the two users in either direction.';

-- ---------------------------------------------------------------------------
-- RPC: lookup_friend_code — returns minimal public fields only
-- ---------------------------------------------------------------------------
create or replace function public.lookup_friend_code(p_code text)
returns table (id uuid, display_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := upper(trim(p_code));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
    select p.id, p.display_name
    from public.profiles p
    where p.friend_code = normalized
      and p.id <> auth.uid()
    limit 1;
end;
$$;

comment on function public.lookup_friend_code(text) is
  'Looks up a profile by friend code. Returns only id and display_name.';

grant execute on function public.lookup_friend_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: lookup_friend_profiles — display names for known friend user ids only
-- ---------------------------------------------------------------------------
create or replace function public.lookup_friend_profiles(p_ids uuid[])
returns table (id uuid, display_name text, friend_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  return query
    select p.id, p.display_name, p.friend_code
    from public.profiles p
    where p.id = any (p_ids)
      and p.id <> me
      and exists (
        select 1
        from public.friendships f
        where f.status in ('pending', 'accepted')
          and (
            (f.requester_id = me and f.addressee_id = p.id)
            or (f.requester_id = p.id and f.addressee_id = me)
          )
      );
end;
$$;

comment on function public.lookup_friend_profiles(uuid[]) is
  'Returns display_name and friend_code for users who share a pending/accepted friendship with the caller.';

grant execute on function public.lookup_friend_profiles(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: request_friendship
-- ---------------------------------------------------------------------------
create or replace function public.request_friendship(p_friend_code text)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  target_id uuid;
  existing public.friendships;
  created public.friendships;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select p.id into target_id
  from public.profiles p
  where p.friend_code = upper(trim(p_friend_code));

  if target_id is null then
    raise exception 'Friend code not found';
  end if;

  if target_id = me then
    raise exception 'Cannot friend yourself';
  end if;

  -- Already friends (either direction)?
  if public.are_accepted_friends(me, target_id) then
    raise exception 'Already friends';
  end if;

  -- Existing pending/declined in either direction
  select * into existing
  from public.friendships f
  where (f.requester_id = me and f.addressee_id = target_id)
     or (f.requester_id = target_id and f.addressee_id = me)
  order by f.created_at desc
  limit 1;

  if existing.id is not null then
    if existing.status = 'pending' then
      -- If they already requested us, auto-accept.
      if existing.addressee_id = me then
        update public.friendships
        set status = 'accepted'
        where id = existing.id
        returning * into created;
        return created;
      end if;
      raise exception 'Friend request already pending';
    end if;

    if existing.status = 'declined' then
      update public.friendships
      set status = 'pending',
          requester_id = me,
          addressee_id = target_id
      where id = existing.id
      returning * into created;
      return created;
    end if;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (me, target_id, 'pending')
  returning * into created;

  return created;
end;
$$;

comment on function public.request_friendship(text) is
  'Creates a pending friendship (or auto-accepts a reciprocal pending request).';

grant execute on function public.request_friendship(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: respond_to_friendship
-- ---------------------------------------------------------------------------
create or replace function public.respond_to_friendship(p_id uuid, p_accept boolean)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  row public.friendships;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into row from public.friendships where id = p_id;
  if row.id is null then
    raise exception 'Friendship not found';
  end if;

  if row.addressee_id <> me then
    raise exception 'Only the addressee can respond';
  end if;

  if row.status <> 'pending' then
    raise exception 'Friendship is not pending';
  end if;

  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end
  where id = p_id
  returning * into row;

  return row;
end;
$$;

comment on function public.respond_to_friendship(uuid, boolean) is
  'Accept or decline a pending friend request. Only the addressee may call this.';

grant execute on function public.respond_to_friendship(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: set_accountability_target
-- ---------------------------------------------------------------------------
create or replace function public.set_accountability_target(p_partner_id uuid)
returns public.accountability_targets
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  created public.accountability_targets;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  if p_partner_id = me then
    raise exception 'Cannot target yourself';
  end if;

  if not public.are_accepted_friends(me, p_partner_id) then
    raise exception 'Partner must be an accepted friend';
  end if;

  insert into public.accountability_targets (user_id, partner_id)
  values (me, p_partner_id)
  on conflict (user_id, partner_id) do update
    set user_id = excluded.user_id
  returning * into created;

  return created;
end;
$$;

comment on function public.set_accountability_target(uuid) is
  'Adds an accepted friend as a midnight push notify target.';

grant execute on function public.set_accountability_target(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: remove_accountability_target (enforces last-target rule)
-- ---------------------------------------------------------------------------
create or replace function public.remove_accountability_target(p_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  remaining integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select count(*)::integer into remaining
  from public.accountability_targets t
  where t.user_id = me;

  if not exists (
    select 1
    from public.accountability_targets t
    where t.user_id = me and t.partner_id = p_partner_id
  ) then
    raise exception 'Target not found';
  end if;

  if remaining <= 1 then
    -- Allow clearing the last target only when no active pending day is scheduled.
    if exists (
      select 1
      from public.deadlines d
      where d.user_id = me
        and d.status = 'active'
        and d.accountability_status = 'pending'
    ) then
      raise exception 'At least one notify target is required while a quota is active';
    end if;
  end if;

  delete from public.accountability_targets
  where user_id = me and partner_id = p_partner_id;
end;
$$;

comment on function public.remove_accountability_target(uuid) is
  'Removes a notify target. Refuses if it would leave zero targets while a pending active day is scheduled.';

grant execute on function public.remove_accountability_target(uuid) to authenticated;
