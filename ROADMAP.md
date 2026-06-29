# Do The Thing — Build Roadmap

## ✅ Sprint 0 — Project Setup

- [x] Expo project initialized with TypeScript
- [x] Folder structure established (/app, /components, /hooks, /lib, /types)
- [x] .cursorrules file in place
- [x] Core navigation scaffolded
- [x] Task list screen scaffolded (UI only, no logic yet)
- [x] Supabase project created and client configured in /lib
- [x] Environment variables set up (.env, .env.example)
- [x] .gitignore file in place, set up to keep the project secure and
      reduce file noise in the repository

## ✅ Sprint 1 — Task List Logic

- [x] Add task functionality
- [x] Display task list
- [x] Mark one or more tasks as Priority
- [x] Mark task as complete
- [x] RLS exists for anonymous sign-ins for testing purposes
- [x] Task data persisted to Supabase tasks table

## 🔄 Sprint 2 — Daily Quota, Timer & Notifications (Current)

### Supabase
- [x] Deadlines table created with schema:
      id, user_id, deadline_at, twilio_message_sid (nullable & unused until
      sprint 3), status, created_at, updated_at
- [x] Unique constraint on user_id (one deadline record per user, ever)
- [x] RLS enabled on deadlines table with policies:
      users can only select, insert, and update their own deadline record
- [x] updated_at trigger applied to deadlines table (same pattern as tasks)
- [x] TypeScript types regenerated to include deadlines table

### App State
- [x] App state model implemented as a TypeScript enum with four values:
        EMPTY    — no tasks present, no active quota
        ACTIVE   — quota set and counting down to midnight
        EXPIRED  — midnight passed without meeting quota; SMS fired, awaiting new quota
        COMPLETE — daily quota met; tasks can still be completed but don't count
- [x] A quota is mandatory before tasks can be added for the first time or after
      EXPIRED; tasks can be added and completed freely in ACTIVE and COMPLETE states
- [x] App state is derived from Supabase on session start and kept in
      sync with all subsequent task and deadline operations
- [x] State transitions:
        EMPTY    → ACTIVE    first task added and quota confirmed; deadline_at
                             set to tonight's midnight
        ACTIVE   → ACTIVE    qualifying task completed, quota not yet met:
                             tasks_completed_today incremented
        ACTIVE   → COMPLETE  tasks_completed_today reaches daily_quota
        ACTIVE   → EXPIRED   midnight reached without meeting quota:
                             SMS fires, status set to expired
        EXPIRED  → ACTIVE    user sets a new quota; deadline_at reset to
                             tonight's midnight, tasks_completed_today reset to 0
        COMPLETE → ACTIVE    daily reset fires the next morning: same quota
                             carried forward, tasks_completed_today reset to 0,
                             last_quota_adjusted_at cleared for the new day
        COMPLETE → EMPTY     all tasks cleared, none remaining

### Daily Quota
- [x] Deadlines table updated to include daily_quota, tasks_completed_today,
      last_reset_at, and last_quota_adjusted_at columns
- [x] TypeScript types regenerated after schema update
- [x] On first task creation, user is prompted to set a daily quota —
      how many qualifying tasks they believe they can complete today
      (minimum 1). Quota and task are saved atomically; cancelling
      discards both.
- [x] If a deadline is active, its daily_quota must be at least 1
- [x] Quota picker shown on first task creation (EMPTY state) and after
      EXPIRED when the app is reopened; not shown in COMPLETE state since
      the quota carries forward automatically to the next day via reset
- [x] Quota picker is non-dismissible — the user cannot skip setting
      a quota (they may cancel adding the task entirely instead,
      which saves nothing)
- [x] Once per day, the user may opt (but is not prompted) to adjust
      their quota via a settings affordance on the task list screen.
      Minimum value of 1. This counts as the daily adjustment and
      cannot be changed again until the next day.
- [x] Priority task rule enforced: if one or more Priority tasks exist,
      only completing a Priority task counts toward the daily quota
- [x] Partial completion acknowledged in UI and SMS copy when the day
      ends with some but not all quota tasks completed — e.g.
      "You completed 2 of 3 tasks today."
- [x] tasks_completed_today resets to 0 at the daily reset

### Daily Reset
- [x] Daily reset fires at midnight
- [x] At daily reset, tasks_completed_today resets to 0 in Supabase
- [x] Incomplete tasks carry forward automatically to the next day's list
- [x] If quota was met before reset, state transitions to COMPLETE and
      no SMS fires
- [x] If quota was not met at reset, state transitions to EXPIRED and
      SMS fires

### Countdown Timer
- [x] Countdown timer displayed on task list screen in dd:hh:mm:ss format
- [x] Timer visible only when app state is ACTIVE
- [x] Timer counts down to deadline_at in real time
- [x] Timer counts down to end of day (midnight) rather than a
      user-chosen timestamp

### Notifications
- [ ] expo-notifications permissions requested on first task creation
- [ ] Notification sequence pre-scheduled at quota-setting time:
        Morning reminder at a user-chosen wake time (if set)
        2 hours before midnight — gentle nudge
        1 hour before midnight — direct reminder
        At midnight — urgent, references accountability partner
- [ ] Only future-dated notifications are scheduled relative to
      the moment the quota is set
- [ ] Notification copy escalates in urgency toward midnight
- [ ] All pending notifications cancelled when daily quota is met
- [ ] Notification sequence rescheduled when a new quota is set after
      EXPIRED → ACTIVE (user-initiated); the COMPLETE → ACTIVE daily reset
      reuses the existing quota and reschedules automatically

## 📋 Sprint 3 — Accountability Backend

- [ ] Twilio account configured with a phone number
- [ ] Supabase Edge Function: schedule Twilio SMS at deadline time
      (default midnight that night) when daily reset fires without quota met
- [ ] Twilio message SID stored against deadline record in Supabase
- [ ] Default SMS copy implemented, referencing partial completion
      where applicable:
        Full miss:    "[Name] didn't complete any of their tasks yesterday."
        Partial miss: "[Name] completed [X] of [Y] tasks yesterday."
        Priority miss: "[Name] didn't complete any of their Priority tasks
                        yesterday."
- [ ] Supabase Edge Function: cancel scheduled Twilio SMS via stored SID
      when daily quota is met before deadline expires
- [ ] Graceful handling if SMS already sent — late completion acknowledged
      in UI without error

## 📋 Sprint 4 — Accountability Partner Setup & Onboarding

- [ ] Onboarding flow scaffolded
- [ ] expo-contacts integration for partner selection
- [ ] Partner name and phone number stored in Supabase against user account
- [ ] Informed consent copy shown before partner is saved
- [ ] Custom SMS message input (shown during onboarding, stored in Supabase)
- [ ] Custom message used in place of default when set

## 📋 Sprint 5 — Auth & User Accounts

- [ ] Supabase Auth configured
- [ ] OAuth login implemented via Supabase's OAuth client library,
      supporting Google and Apple, and custom email/password login
- [ ] Sign up / sign in screens with OAuth provider buttons
- [ ] User session managed in app
- [ ] RLS policies written/updated if needed for all tables
      (tasks, deadlines, users) to account for new login methods
- [ ] Onboarding only shown to new users

## 📋 Sprint 6 — Polish & Launch Prep

- [ ] UI polish pass across all screens
- [ ] Error states and loading states throughout
- [ ] Edge case handling (no tasks, no deadline set, partner not set)
- [ ] EAS Build configured for custom dev client
- [ ] TestFlight internal testing
- [ ] App Store listing prep

### Post-Launch Consideration
- [ ] Deadline audit log table for analytics and debugging if
      user retention data becomes valuable
- [ ] Daily recurring tasks (exercise, make bed, etc.) that
      automatically appear in the task list each day and count
      toward the daily quota