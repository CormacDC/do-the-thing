# Do The Thing

A minimalist iOS accountability app built with Expo and React Native. Do The Thing strips away the complexity of traditional to-do apps and replaces it with a single, motivating question: what happens if you *don't* do it?

---

## The Idea

Most productivity apps give you more ways to organize tasks than to actually do them. Do The Thing takes the opposite approach. Each morning you add your tasks, commit to a daily quota — the number you'll complete before midnight — and choose friends who also use the app. If you don't hit your quota by the time the clock strikes twelve, those friends get a push notification. That's it.

The deadline is always midnight. There's no choosing a duration, no extensions, no grace period. You have today. Use it.

---

## Core Features

### Task List

Add tasks and optionally mark one or more as **Priority**. Priority tasks change the rules: once any Priority task exists, only completing a Priority task counts toward your daily quota. This lets you signal to the app — and to yourself — what actually matters today.

Tasks are never deleted at the end of the day. Anything left incomplete carries forward automatically to tomorrow's list.

### Daily Quota

When you add your first task, you commit to a daily quota: the number of qualifying tasks you will complete before midnight. The app counts down to midnight in real time.

- Meet your quota at any point during the day and the pending accountability push is cancelled. Your day is done.
- Miss your quota at midnight and selected friends are notified via remote push — no delay, no need for anyone to open the app.
- After a successful day, the same quota carries forward to the next morning automatically. You can adjust it once per day via a subtle option on the task list screen.
- After a missed day, you set a fresh quota before continuing.

Completing tasks beyond your quota is always allowed. They just don't count toward anything — the objective for the day is already met.

You cannot set a quota until at least one accepted friend is marked as a **notify target** in Settings.

### Accountability System

When you commit to a quota, the app records a *pending* accountability intent in Supabase. At deadline time a server job (`dispatch-accountability`) decides whether to send:

- If the quota was met → no push.
- If not → Expo Push delivers a notification to each selected friend's devices.

Cancellation is a database write when you hit your quota. Friends do not need to open the app for schedule or cancel to work.

Default message copy reflects how the day went:

> *"[Name] didn't complete any of their tasks yesterday."*
> *"[Name] completed 2 of 3 tasks yesterday."*
> *"[Name] didn't complete any of their Priority tasks yesterday."*

You can replace the default with a custom message during onboarding or in Settings (`{name}`, `{completed}`, `{quota}` placeholders).

### Friends & Consent

Accountability partners are other Do The Thing users linked by **friend code**. Friendship is mutual after accept. Being friends is not the same as being notified — you choose who receives the midnight push.

Friends must have the app installed and notification permission granted so their Expo push token can be stored. Explicit onboarding copy explains that selected friends will receive a push if you miss your quota.

### Local Reminder Notifications

(Planned — Sprint 6.) The app can also schedule a sequence of **local** reminders on *your* device when you set a quota. Those are separate from the remote punishment push sent to friends.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (custom dev client) |
| Language | TypeScript |
| Navigation | Expo Router |
| Backend | Supabase (Postgres + Edge Functions + Cron) |
| Accountability | Expo Push Notifications (server-sent) |
| Local reminders | expo-notifications (planned) |
| Auth | Supabase Auth |

SMS via Twilio was implemented in earlier sprints and remains in the repo as a **disabled stub** (`ACCOUNTABILITY_CHANNEL = 'push'`).

---

## Project Structure

```
/app                 # Screens and navigation (Expo Router)
/components          # Reusable UI components
/hooks               # Custom React hooks
/lib                 # Supabase client, accountability/push helpers, utilities
/types               # Shared TypeScript types
/supabase/functions  # Edge Functions (schedule/cancel/dispatch + SMS stubs)
/supabase/migrations # Postgres schema and RPCs
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (required for Expo SDK 56)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A [Supabase](https://supabase.com) account and project
- An iOS device or simulator for local development
- A **custom Expo dev client / EAS build** for reliable iOS remote push (Expo Go is not the launch target)

### Installation

```bash
git clone https://github.com/your-username/do-the-thing.git
cd do-the-thing
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Edge Function secrets (set with `supabase secrets set`, not in the app):

- `CRON_SECRET` — required by `dispatch-accountability`
- `EXPO_ACCESS_TOKEN` — optional Expo push API access token
- Twilio vars — optional / unused while SMS is disabled

### Running Locally

```bash
npx expo start
```

```bash
npm run typecheck
npm test
```

For a custom dev client build, see the EAS setup instructions in Sprint 6 of [ROADMAP.md](./ROADMAP.md).

Apply new migrations and deploy Edge Functions before testing accountability end-to-end:

```bash
supabase db push
supabase functions deploy schedule-accountability
supabase functions deploy cancel-accountability
supabase functions deploy dispatch-accountability
```

Configure `app.settings.supabase_url` / `app.settings.cron_secret` (or equivalent) so the minute cron job can call `dispatch-accountability`.

---

## Database Schema

Core tables:

- **profiles** — display name, friend code, optional custom message, onboarding flag
- **tasks** — individual tasks with priority and completion status
- **deadlines** — one record per user: quota, progress, accountability_status
- **friendships** — pending / accepted / declined friend links
- **accountability_targets** — which friends receive the midnight push
- **push_tokens** — Expo push tokens per device

Row Level Security is enabled. Friend lookup and mutations go through SECURITY DEFINER RPCs so profiles stay private.

---

## Build Status

This project is currently in active development. See [ROADMAP.md](./ROADMAP.md) for a full sprint-by-sprint breakdown of completed and upcoming work.

---

## Contributing

This is a personal project at an early stage. Issues and suggestions are welcome — open an issue to start a conversation before submitting a pull request.

---

## License

MIT
