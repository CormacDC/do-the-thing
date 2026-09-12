-- Upgrade already-applied 20260912000001 installs:
-- 1. Poll hourly on the hour instead of every minute.
-- 2. Replace inline SELECT net.http_post(...) (OOM-prone with empty URL /
--    unbounded net._http_response) with public.invoke_dispatch_accountability().
-- Credentials: 20260912000003 reads Vault secrets SUPABASE_URL and CRON_SECRET.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.invoke_dispatch_accountability()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  cron_secret text;
begin
  project_url := nullif(trim(current_setting('app.settings.supabase_url', true)), '');
  cron_secret := nullif(trim(current_setting('app.settings.cron_secret', true)), '');

  if project_url is null or cron_secret is null then
    raise notice 'dispatch-accountability skipped: set app.settings.supabase_url and app.settings.cron_secret';
    return;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/dispatch-accountability',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
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
  'Hourly cron target: POST dispatch-accountability when settings are present; prune old pg_net responses.';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'dispatch-accountability') then
    perform cron.unschedule('dispatch-accountability');
  end if;
exception
  when undefined_table then
    null;
  when undefined_function then
    null;
end;
$$;

do $$
begin
  perform cron.schedule(
    'dispatch-accountability',
    '0 * * * *',
    $cron$select public.invoke_dispatch_accountability();$cron$
  );
exception
  when undefined_function then
    raise notice 'pg_cron not available — schedule dispatch-accountability manually after enabling extensions';
  when others then
    raise notice 'Could not schedule dispatch-accountability: %', SQLERRM;
end;
$$;
