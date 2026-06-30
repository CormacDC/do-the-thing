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

## ✅ Sprint 3 — Accountability Partner Setup & Onboarding

- [x] Onboarding flow scaffolded and shown only on first app launch
- [x] User display name input during onboarding, stored in Supabase
      against user account
- [x] Accountability partner name and phone number entered manually
      during onboarding (typed in — expo-contacts integration deferred
      to Sprint 6)
- [x] Partner details stored in Supabase against user account
- [x] Informed consent copy shown before partner details are saved —
      the user must explicitly acknowledge that their partner will
      receive an automated SMS if they miss their daily quota
- [x] Custom SMS message input during onboarding — shown after consent,
      stored in Supabase. If left blank, the default copy is used.
- [x] Default SMS copy implemented in Supabase, referencing partial
      completion where applicable:
        Full miss:     "[Name] didn't complete any of their tasks yesterday."
        Partial miss:  "[Name] completed [X] of [Y] tasks yesterday."
        Priority miss: "[Name] didn't complete any of their Priority
                        tasks yesterday."
- [x] Custom message used in place of default when set, with the same
      partial completion variables available as placeholders
- [x] Onboarding cannot be skipped — the app is not usable until
      display name, partner details, and consent are completed
- [x] Partner details editable post-onboarding via a settings screen

## 📋 Sprint 4 — Accountability Backend

- [ ] Twilio account configured with a phone number
- [ ] Supabase Edge Function: schedule-sms
        Called when daily reset fires without quota met
        Fetches user display name, partner phone number, daily_quota,
        tasks_completed_today, and Priority task status from Supabase
        Selects correct SMS copy based on completion state
        Sends SMS immediately via Twilio API
        Stores returned Twilio message SID in deadline record
- [ ] Supabase Edge Function: cancel-sms
        Called when daily quota is met before deadline expires
        Fetches twilio_message_sid from deadline record
        Cancels scheduled message via Twilio API if SID exists
        Clears twilio_message_sid to null in Supabase on success
        Returns gracefully if no SID exists or message already sent
- [ ] Twilio message SID stored against deadline record in Supabase
- [ ] Both Edge Functions called from existing client-side state
      transition logic — schedule-sms on ACTIVE → EXPIRED,
      cancel-sms on ACTIVE → COMPLETE
- [ ] Both Edge Functions fail silently on the client — a Twilio
      error must never crash the app or block a state transition
- [ ] Graceful late completion: if quota is met after deadline and
      SMS has already been sent, transition to COMPLETE normally
      and display an acknowledgment — e.g. "Nice work finishing up.
      Your accountability partner was notified earlier, but you
      still got it done." Do not attempt cancellation.

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

### Contacts
- [ ] expo-contacts integration added to accountability partner setup —
      replace manual phone number entry with contact picker. Partner
      name and number are pre-filled from the selected contact and
      remain editable before saving.

### Notifications
- [ ] expo-notifications permissions requested on first task creation
- [ ] Notification sequence pre-scheduled at quota-setting time:
        9am - motivational morning message
        1pm - gentle reminder
        5pm - slightly more urgent reminder
        9pm - urgent and final reminder, references accountability partner being notified upon expiry
- [ ] Only future-dated notifications are scheduled relative to
      the moment the quota is set
- [ ] Notification copy escalates in urgency closer to expiry
- [ ] All pending notifications cancelled when daily quota is met
- [ ] Notification sequence rescheduled when a new quota is set after
      EXPIRED → ACTIVE (user-initiated); the COMPLETE → ACTIVE daily reset
      reuses the existing quota and reschedules automatically

### Post-Launch Consideration
- [ ] Deadline audit log table for analytics and debugging if
      user retention data becomes valuable
- [ ] Daily recurring tasks (exercise, make bed, etc.) that
      automatically appear in the task list each day and count
      toward the daily quota