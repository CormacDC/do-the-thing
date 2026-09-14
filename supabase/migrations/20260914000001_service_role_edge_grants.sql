-- Edge Functions authenticate with the service_role key. BYPASSRLS does not
-- skip table GRANT. These tables were only granted to authenticated; a missing
-- service_role SELECT surfaces from HEAD counts as `{ message: "" }`.

grant select on table public.accountability_targets to service_role;
grant select on table public.friendships to service_role;
grant select, update on table public.deadlines to service_role;
grant select, delete on table public.push_tokens to service_role;
grant select on table public.tasks to service_role;
grant select on table public.profiles to service_role;

notify pgrst, 'reload schema';
