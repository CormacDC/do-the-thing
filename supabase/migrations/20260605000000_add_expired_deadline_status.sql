-- Sprint 2 redesign: deadlines now expire instead of auto-advancing.
-- Add 'expired' to the allowed status values. The original create migration is
-- already applied, so alter the live constraint here rather than editing the
-- create statement.

alter table public.deadlines
  drop constraint if exists deadlines_status_check;

alter table public.deadlines
  add constraint deadlines_status_check
  check (status in ('active', 'complete', 'expired'));

alter table public.deadlines
  alter column status set default 'active';
