-- Read cron dispatch credentials from Vault instead of app.settings GUCs.
-- Hosted Supabase often denies ALTER DATABASE SET for custom GUCs.
-- Secrets live in vault.secrets (names: SUPABASE_URL, CRON_SECRET); this
-- function reads the decrypted view, which privileged roles can access.

create extension if not exists supabase_vault with schema vault;
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

  -- Empty URL made pg_net POST to a relative path and OOM the worker.
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
  'Hourly cron target: POST dispatch-accountability using Vault secrets SUPABASE_URL and CRON_SECRET; prune old pg_net responses.';
