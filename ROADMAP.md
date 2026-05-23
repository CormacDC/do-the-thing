# Do The Thing — Build Roadmap

## ✅ Sprint 0 — Project Setup (Current)

- [ ] Expo project initialized with TypeScript
- [ ] Folder structure established (/app, /components, /hooks, /lib, /types)
- [x] .cursorrules file in place
- [ ] Core navigation scaffolded
- [ ] Task list screen scaffolded (UI only, no logic yet)
- [ ] Supabase project created and client configured in /lib
- [ ] Environment variables set up (.env, .env.example)

## 📋 Sprint 1 — Task List Logic

- [ ] Add task functionality
- [ ] Display task list
- [ ] Mark one or more tasks as Priority
- [ ] Mark task as complete
- [ ] Qualifying task logic implemented (any task if no Priority exists;
      any Priority task if one or more exist)
- [ ] Task data persisted to Supabase tasks table

## 📋 Sprint 2 — Task Timer & Notifications

- [ ] Deadline picker on task list screen
- [ ] Deadline timestamp recorded in Supabase deadlines table
- [ ] expo-notifications permissions requested during onboarding
- [ ] Notification sequence scheduled at deadline-setting time:
      - 24 hours before (if deadline is far enough out)
      - 1 hour before (if deadline is far enough out)
      - At the deadline
      - Every 30 minutes after, up to 3 hours post-deadline
- [ ] Only future-dated notifications are scheduled
- [ ] Notification copy escalates in urgency after deadline passes
- [ ] All pending notifications cancelled on qualifying task completion
- [ ] Deadline reset flow: on qualifying completion, fresh deadline of
      same original duration is created from current moment and
      notification sequence is rescheduled

## 📋 Sprint 3 — Accountability Backend

- [ ] Supabase deadlines table schema finalized:
      id, user_id, deadline_at, twilio_message_sid, status, created_at
- [ ] Twilio account configured with a phone number
- [ ] Supabase Edge Function: schedule Twilio SMS at deadline-setting time
      via Twilio's message scheduling API
- [ ] Twilio message SID stored against deadline record in Supabase
- [ ] Default SMS copy implemented:
      "[User's name] wanted you to know they still haven't completed
      any tasks!"
- [ ] Supabase Edge Function: cancel scheduled Twilio SMS via stored SID
      on qualifying task completion
- [ ] Graceful handling if SMS already sent (no cancellation attempted,
      late completion acknowledged in UI without error)
- [ ] Deadline reset flow: on qualifying completion, new deadline record
      created, new Twilio SMS scheduled, old record marked cancelled

## 📋 Sprint 4 — Accountability Partner Setup & Onboarding

- [ ] Onboarding flow scaffolded
- [ ] expo-contacts integration for partner selection
- [ ] Partner name and phone number stored in Supabase against user account
- [ ] Informed consent copy shown before partner is saved
- [ ] Custom SMS message input (shown during onboarding, stored in Supabase)
- [ ] Custom message used in place of default when set

## 📋 Sprint 5 — Auth & User Accounts

- [ ] Supabase Auth configured
- [ ] Sign up / sign in screens
- [ ] User session managed in app
- [ ] RLS policies written for all tables (tasks, deadlines, users)
- [ ] Onboarding only shown to new users

## 📋 Sprint 6 — Polish & Launch Prep

- [ ] UI polish pass across all screens
- [ ] Error states and loading states throughout
- [ ] Edge case handling (no tasks, no deadline set, partner not set)
- [ ] EAS Build configured for custom dev client
- [ ] TestFlight internal testing
- [ ] App Store listing prep
