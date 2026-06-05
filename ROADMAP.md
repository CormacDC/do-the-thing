# Do The Thing — Build Roadmap

## ✅ Sprint 0 — Project Setup

- [x] Expo project initialized with TypeScript
- [x] Folder structure established (/app, /components, /hooks, /lib, /types)
- [x] .cursorrules file in place
- [x] Core navigation scaffolded
- [x] Task list screen scaffolded (UI only, no logic yet)
- [x] Supabase project created and client configured in /lib
- [x] Environment variables set up (.env, .env.example)
- [x] .gitignore file in place, set up to keep the project secure and reduce file noise in the repository

## 📋 Sprint 1 — Task List Logic

- [x] Add task functionality
- [x] Display task list
- [x] Mark one or more tasks as Priority
- [x] Mark task as complete
- [x] RLS exists for anonymous sign-ins for testing purposes
- [x] Task data persisted to Supabase tasks table

## 📋 Sprint 2 — Task Timer & Notifications (Current)

### Supabase
- [x] Deadlines table created with schema:
      id, user_id, deadline_at, twilio_message_sid (nullable & unused until sprint 3),
      status, created_at, updated_at
- [x] Unique constraint on user_id (one deadline record per user, ever)
- [x] RLS enabled on deadlines table with policies:
      users can only select, insert, and update their own deadline record
- [x] updated_at trigger applied to deadlines table (same pattern as tasks)
- [x] TypeScript types regenerated to include deadlines table

### App State
- [x] App state model implemented as a TypeScript enum with four values:
        EMPTY    — no tasks present, no deadline set
        ACTIVE   — deadline set and counting down
        EXPIRED  — deadline passed, SMS fired, awaiting new deadline
        COMPLETE — all tasks completed, eligible for fresh start
- [x] A deadline is mandatory and non-dismissible: a task can never exist
      without a deadline (the deadline is chosen as part of adding the first
      task), and tasks cannot be added or completed without an active deadline
- [x] App state is derived from Supabase on session start and kept in
      sync with all subsequent task and deadline operations
- [x] State transitions:
        EMPTY    → ACTIVE    first task added with its mandatory deadline
        ACTIVE   → ACTIVE    qualifying task completed while other tasks remain:
                             deadline_at resets from current time by original duration,
                             updated_at refreshed
        ACTIVE   → COMPLETE  all tasks completed before deadline passes
        ACTIVE   → EXPIRED   deadline passes without qualifying completion:
                             deadline status set to expired, deadline_at and
                             duration_seconds left untouched
        EXPIRED  → ACTIVE    user opens app and sets a new deadline
        COMPLETE → ACTIVE    new task added with its mandatory deadline
        COMPLETE → EMPTY     all completed tasks cleared, no tasks remaining

### Deadline Picker
- [x] Deadline picker shown (and required) when the first task is added; the
      task is only saved once a deadline is chosen (committed together)
- [x] Deadline picker is non-dismissible — the user cannot skip setting a
      deadline (during the new-task flow they may cancel adding the task
      entirely instead, which saves nothing)
- [x] Deadline picker re-shown when a new task is added after COMPLETE
- [x] Deadline picker re-prompted on app open in EXPIRED, with an
      acknowledgment ("your deadline passed and your partner was notified")
      shown before the picker
- [x] Deadline record inserted into Supabase when user confirms deadline,
      status set to ACTIVE
- [x] Deadline setting available only when no deadline is active (first task,
      after COMPLETE, or after EXPIRED); locked out while ACTIVE

### Countdown Timer
- [x] Countdown timer displayed on task list screen in dd:hh:mm:ss format
- [x] Timer visible only when app state is ACTIVE
- [x] Timer counts down to deadline_at in real time
- [x] Timer drives the ACTIVE → EXPIRED transition when it reaches deadline_at

### Notifications
- [ ] expo-notifications permissions requested during onboarding
- [ ] Notification sequence pre-scheduled at deadline-setting time:
        24 hours before  (only if deadline is far enough out)
        2 hours before   (only if deadline is far enough out)
        1 hour before    (only if deadline is far enough out)
        At the deadline
- [ ] Only future-dated notifications are scheduled relative to
      the moment the deadline is set
- [ ] Notification copy escalates in urgency after the deadline passes
- [ ] All pending notifications cancelled on all-tasks-complete
- [ ] Notification sequence rescheduled when a new deadline is set
      after a COMPLETE → ACTIVE transition

## 📋 Sprint 3 — Accountability Backend

- [ ] Supabase deadlines table schema updated to include twilio_message_sid
- [ ] Twilio account configured with a phone number
- [ ] Supabase Edge Function: schedule Twilio SMS at deadline-setting time
      via Twilio's message scheduling API
- [ ] Twilio message SID stored against deadline record in Supabase
- [ ] Default SMS copy implemented:
      "[User's name] wanted you to know they still haven't completed
      any tasks!"
- [ ] Supabase Edge Function: cancel scheduled Twilio SMS via stored SID
      on qualifying task completion and schedule new SMS
- [ ] Graceful handling if SMS already sent (no cancellation attempted,
      late completion acknowledged in UI without error)

## 📋 Sprint 4 — Accountability Partner Setup & Onboarding

- [ ] Onboarding flow scaffolded
- [ ] expo-contacts integration for partner selection
- [ ] Partner name and phone number stored in Supabase against user account
- [ ] Informed consent copy shown before partner is saved
- [ ] Custom SMS message input (shown during onboarding, stored in Supabase)
- [ ] Custom message used in place of default when set

## 📋 Sprint 5 — Auth & User Accounts

- [ ] Supabase Auth configured
- [ ] OAuth login implemented via Supabase's OAuth client library, supporting Google and Apple, and custom email/passowrd login
- [ ] Sign up / sign in screens with OAuth provider buttons
- [ ] User session managed in app
- [ ] RLS policies written/updated if needed for all tables (tasks, deadlines, users) to account for new login methods
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
