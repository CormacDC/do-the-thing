-- Schedule dispatch-accountability every minute via pg_cron + pg_net.
-- Requires CRON_SECRET and project URL to be set as database settings
-- (or replace the placeholders below after deploy).

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Store the cron bearer secret in Vault/app settings in production.
-- This migration documents the job; operators must set:
--   alter database postgres set app.settings.cron_secret = '...';
--   alter database postgres set app.settings.supabase_url = 'https://xxx.supabase.co';
--   alter database postgres set app.settings.service_role_key = '...';
-- Or edit the job body after first deploy.

do $$
begin
  -- Unschedule prior job if re-running migration tooling.
  if exists (select 1 from cron.job where jobname = 'dispatch-accountability') then
    perform cron.unschedule('dispatch-accountability');
  end if;
exception
  when undefined_table then
    null; -- cron schema not available in local stub environments
  when undefined_function then
    null;
end;
$$;

-- Soft-schedule: only if cron.schedule is available.
do $$
begin
  perform cron.schedule(
    'dispatch-accountability',
    '* * * * *',
    $cron$
    select net.http_post(
      url := coalesce(
        current_setting('app.settings.supabase_url', true),
        ''
      ) || '/functions/v1/dispatch-accountability',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          current_setting('app.settings.cron_secret', true),
          ''
        )
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
exception
  when undefined_function then
    raise notice 'pg_cron not available — schedule dispatch-accountability manually after enabling extensions';
  when others then
    raise notice 'Could not schedule dispatch-accountability: %', SQLERRM;
end;
$$;
