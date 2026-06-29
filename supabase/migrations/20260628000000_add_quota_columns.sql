-- Sprint 2 redesign: replace duration-based deadlines with daily quota mechanic.
-- The deadline is always midnight of the current day. The user commits to a
-- daily_quota of qualifying tasks; at midnight the app checks
-- tasks_completed_today against daily_quota to decide COMPLETE vs EXPIRED.

-- daily_quota: how many qualifying tasks the user has committed to completing.
alter table public.deadlines
  add column if not exists daily_quota integer not null default 1
    constraint deadlines_daily_quota_check check (daily_quota >= 1);

comment on column public.deadlines.daily_quota is
  'The number of qualifying tasks the user must complete before midnight. Minimum 1.';

-- tasks_completed_today: running count of qualifying completions this day.
-- Resets to 0 at each daily reset regardless of outcome.
alter table public.deadlines
  add column if not exists tasks_completed_today integer not null default 0
    constraint deadlines_tasks_completed_today_check check (tasks_completed_today >= 0);

comment on column public.deadlines.tasks_completed_today is
  'Count of qualifying task completions since the last daily reset.';

-- last_reset_at: when the daily reset last ran. Used on session start to detect
-- whether a reset was missed while the app was closed (e.g. phone stayed off at midnight).
alter table public.deadlines
  add column if not exists last_reset_at timestamptz not null default now();

comment on column public.deadlines.last_reset_at is
  'Timestamp of the most recent daily reset. Compared against the current calendar date on app open to detect missed resets.';

-- last_quota_adjusted_at: records the single allowed in-day quota adjustment.
-- Null means no adjustment has been made today. Compared against the current
-- calendar date to enforce the once-per-day rule.
alter table public.deadlines
  add column if not exists last_quota_adjusted_at timestamptz;

comment on column public.deadlines.last_quota_adjusted_at is
  'When the user last adjusted their quota mid-day. Null until first adjustment. Used to enforce the once-per-day adjustment rule.';

-- duration_seconds is no longer used in the quota model but must remain in the
-- schema for backward compatibility. Relax the > 0 constraint and add a
-- default so new upserts do not need to supply a value.
alter table public.deadlines
  drop constraint if exists deadlines_duration_seconds_check;

alter table public.deadlines
  alter column duration_seconds set default 0;

alter table public.deadlines
  add constraint deadlines_duration_seconds_check
    check (duration_seconds >= 0);
