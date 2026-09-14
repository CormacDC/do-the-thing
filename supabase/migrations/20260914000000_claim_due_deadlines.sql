-- Atomic claim for dispatch-accountability.
--
-- The Edge Function previously PATCHed public.deadlines through PostgREST.
-- That path waited on Kong/PostgREST (~10s) and surfaced as:
--   claim failed: { message: "Gateway Timeout" }
-- A SECURITY DEFINER RPC with FOR UPDATE SKIP LOCKED does not wait on other
-- workers, uses a partial index, and is the only writer of the claim lease.
--
-- invoke_dispatch_accountability skips the Edge Function HTTP call when no
-- rows are due (the common hourly case). It does not claim here: claiming
-- before HTTP would strand rows if an older function build ignored the body.

create index if not exists deadlines_claim_due_idx
  on public.deadlines (deadline_at, accountability_sent_at)
  where status = 'active'
    and accountability_status = 'pending';

create or replace function public.claim_due_deadlines(p_now timestamptz default now())
returns table (
  id uuid,
  user_id uuid,
  daily_quota integer,
  tasks_completed_today integer,
  status text,
  accountability_status text,
  deadline_at timestamptz
)
language plpgsql
security definer
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
begin
  return query
  with due as materialized (
    select d.id
    from public.deadlines as d
    where d.status = 'active'
      and d.accountability_status = 'pending'
      and d.deadline_at <= p_now
      and (
        d.accountability_sent_at is null
        or d.accountability_sent_at < p_now - interval '15 minutes'
      )
    for update skip locked
  )
  update public.deadlines as d
  set accountability_sent_at = p_now
  from due
  where d.id = due.id
  returning
    d.id,
    d.user_id,
    d.daily_quota,
    d.tasks_completed_today,
    d.status,
    d.accountability_status,
    d.deadline_at;
end;
$$;

comment on function public.claim_due_deadlines(timestamptz) is
  'Claims due pending deadlines (lease via accountability_sent_at). Stale pending leases older than 15 minutes are reclaimed. service_role only.';

revoke all on function public.claim_due_deadlines(timestamptz) from public;
revoke all on function public.claim_due_deadlines(timestamptz) from anon, authenticated;
grant execute on function public.claim_due_deadlines(timestamptz) to service_role;

create or replace function public.invoke_dispatch_accountability()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  cron_secret text;
  due_exists boolean;
begin
  select exists (
    select 1
    from public.deadlines as d
    where d.status = 'active'
      and d.accountability_status = 'pending'
      and d.deadline_at <= now()
      and (
        d.accountability_sent_at is null
        or d.accountability_sent_at < now() - interval '15 minutes'
      )
  )
  into due_exists;

  if not due_exists then
    begin
      delete from net._http_response
      where created < now() - interval '2 days';
    exception
      when undefined_table then
        null;
    end;
    return;
  end if;

  select nullif(trim(ds.decrypted_secret), '')
  into project_url
  from vault.decrypted_secrets as ds
  where ds.name = 'SUPABASE_URL'
  limit 1;

  select nullif(trim(ds.decrypted_secret), '')
  into cron_secret
  from vault.decrypted_secrets as ds
  where ds.name = 'CRON_SECRET'
  limit 1;

  if project_url is null or cron_secret is null then
    raise notice 'dispatch-accountability skipped: vault secrets SUPABASE_URL and CRON_SECRET are required';
    return;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/dispatch-accountability',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );

  begin
    delete from net._http_response
    where created < now() - interval '2 days';
  exception
    when undefined_table then
      null;
  end;
end;
$$;

comment on function public.invoke_dispatch_accountability() is
  'Hourly cron target: skip HTTP when no due/stale-claim rows; otherwise POST dispatch-accountability using Vault secrets SUPABASE_URL and CRON_SECRET; prune old pg_net responses.';

notify pgrst, 'reload schema';
