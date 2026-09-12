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

## ✅ Sprint 2 — Daily Quota, Timer & Notifications

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
        EXPIRED  — midnight passed without meeting quota; accountability
                   push dispatched (or skipped), awaiting new quota
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
                             accountability push fires, status set to expired
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
- [x] Partial completion acknowledged in UI and accountability copy when
      the day ends with some but not all quota tasks completed — e.g.
      "You completed 2 of 3 tasks today."
- [x] tasks_completed_today resets to 0 at the daily reset

### Daily Reset
- [x] Daily reset fires at midnight
- [x] At daily reset, tasks_completed_today resets to 0 in Supabase
- [x] Incomplete tasks carry forward automatically to the next day's list
- [x] If quota was met before reset, state transitions to COMPLETE and
      no accountability push fires
- [x] If quota was not met at reset, state transitions to EXPIRED and
      accountability push fires (server-owned)

### Countdown Timer
- [x] Countdown timer displayed on task list screen in dd:hh:mm:ss format
- [x] Timer visible only when app state is ACTIVE
- [x] Timer counts down to deadline_at in real time
- [x] Timer counts down to end of day (midnight) rather than a
      user-chosen timestamp

## ✅ Sprint 3 — Accountability Partner Setup & Onboarding
> **Note (Sprint 5.5):** SMS / phone-number partner setup below is **complete but disabled**.
> Live accountability now uses in-app friends + remote push (see Sprint 5.5).

- [x] Onboarding flow scaffolded and shown only on first app launch
- [x] User display name input during onboarding, stored in Supabase
      against user account
- [x] Accountability partner name and phone number entered manually
      during onboarding (typed in — **removed from live path**; SMS stubbed)
- [x] Partner details stored in Supabase against user account (legacy columns
      nullable; unused while ACCOUNTABILITY_CHANNEL is push)
- [x] Informed consent copy shown before partner details are saved —
      (legacy SMS consent; replaced by friend-push consent in Sprint 5.5)
- [x] Custom SMS message input during onboarding — shown after consent,
      stored in Supabase. If left blank, the default copy is used.
      (Column retained as custom accountability push body.)
- [x] Default accountability copy implemented, referencing partial
      completion where applicable:
        Full miss:     "[Name] didn't complete any of their tasks yesterday."
        Partial miss:  "[Name] completed [X] of [Y] tasks yesterday."
        Priority miss: "[Name] didn't complete any of their Priority
                        tasks yesterday."
- [x] Custom message used in place of default when set, with the same
      partial completion variables available as placeholders
- [x] Onboarding cannot be skipped — display name required; friend code
      shown; custom message optional (Sprint 5.5)
- [x] Partner / friend details editable post-onboarding via a settings screen

## ✅ Sprint 4 — Accountability Backend (SMS)
> **Note (Sprint 5.5):** Twilio Edge Functions remain in the repo but are
> **safely inoperable** (`ACCOUNTABILITY_CHANNEL = 'push'`). They return
> `{ disabled: true }` before any Twilio call.

- [x] Twilio account configured with a phone number (legacy)
- [x] Supabase Edge Function: schedule-sms — stubbed / disabled
- [x] Supabase Edge Function: cancel-sms — stubbed / disabled
- [x] Twilio message SID column retained on deadlines (unused)
- [x] Client SMS helpers are no-ops; live path uses schedule/cancel-accountability
- [x] Edge Function failures must never crash the app or block a state transition

## ✅ Sprint 5 — Auth & User Accounts

- [x] Supabase Auth configured (email/password)
- [x] Email/password sign up and sign in
- [x] Sign up / sign in screens
- [x] User session managed in app (persisted across restarts, sign out,
      expired sessions route to sign in)
- [x] Anonymous session upgrade via updateUser on sign-up (preserves
      existing data under the same auth.uid())
- [x] RLS policies written/updated for all tables (tasks, deadlines,
      profiles) — authenticated role, gated on auth.uid()
- [x] Onboarding only shown to new users (no profiles row / incomplete onboarding)
- [x] PII excluded from logs and client-facing errors
- [x] Sign out on settings screen

## ✅ Sprint 5.5 — Friend Accounts & Remote Push Accountability

- [x] ACCOUNTABILITY_CHANNEL flag (`push` | `sms`); SMS path stubbed
- [x] Schema: friend_code on profiles, friendships, accountability_targets,
      push_tokens, deadlines.accountability_status / accountability_sent_at
- [x] SECURITY DEFINER RPCs: lookup_friend_code, lookup_friend_profiles,
      request_friendship, respond_to_friendship, set/remove_accountability_target
- [x] Onboarding: display name → friend code + optional invite → custom message
- [x] Settings: friend code, add/accept friends, notify-target toggles,
      custom message, push permission status
- [x] Quota cannot be confirmed without ≥1 notify-target friend
- [x] Last notify target cannot be removed while a pending active day is scheduled
- [x] Expo push token registration (lib/pushToken + usePushToken)
- [x] Edge Functions: schedule-accountability, cancel-accountability,
      dispatch-accountability (CRON_SECRET; decide-at-send-time)
- [x] Hourly cron helper reads SUPABASE_URL and CRON_SECRET from Vault
- [x] Server owns midnight expiry + Expo push to selected friends' tokens
- [x] Client daily reset is idempotent with server dispatch
- [x] Pure modules + Vitest coverage for copy, eligibility, friend codes
- [x] Docs updated (README, ROADMAP, .env.example, .cursorrules)

## 📋 Sprint 6 — Polish & Launch Prep

- [ ] Google and Apple OAuth (requires provider dashboard setup;
      linkIdentity helpers ready in lib/authActions.ts)
- [ ] UI polish pass across all screens
- [ ] Error states and loading states throughout
- [ ] Edge case handling (no tasks, no deadline set, no notify-target friend)
- [ ] EAS Build configured for custom dev client (required for reliable iOS push)
- [ ] TestFlight internal testing
- [ ] App Store listing prep
- [ ] ~~expo-contacts / phone partner picker~~ — **removed** (friends are in-app only)

### Local reminder notifications (user's own device — not the punishment channel)
- [ ] expo-notifications permissions requested on first task creation
      (push registration for accountability already runs on login)
- [ ] Local reminder sequence pre-scheduled at quota-setting time:
        9am - motivational morning message
        1pm - gentle reminder
        5pm - slightly more urgent reminder
        9pm - urgent and final reminder, references friends being notified upon expiry
- [ ] Only future-dated notifications are scheduled relative to
      the moment the quota is set
- [ ] Notification copy escalates in urgency closer to expiry
- [ ] All pending local reminders cancelled when daily quota is met
- [ ] Reminder sequence rescheduled when a new quota is set after
      EXPIRED → ACTIVE (user-initiated); the COMPLETE → ACTIVE daily reset
      reuses the existing quota and reschedules automatically

### Post-Launch Consideration
- [ ] Deadline audit log table for analytics and debugging if
      user retention data becomes valuable
- [ ] Daily recurring tasks (exercise, make bed, etc.) that
      automatically appear in the task list each day and count
      toward the daily quota
- [ ] Optional Twilio SMS revival behind ACCOUNTABILITY_CHANNEL = 'sms'
