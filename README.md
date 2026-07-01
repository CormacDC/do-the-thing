# Do The Thing

A minimalist iOS accountability app built with Expo and React Native. Do The Thing strips away the complexity of traditional to-do apps and replaces it with a single, motivating question: what happens if you *don't* do it?

---

## The Idea

Most productivity apps give you more ways to organize tasks than to actually do them. Do The Thing takes the opposite approach. Each morning you add your tasks, commit to a daily quota — the number you'll complete before midnight — and designate an accountability partner. If you don't hit your quota by the time the clock strikes twelve, your partner gets a text. That's it.

The deadline is always midnight. There's no choosing a duration, no extensions, no grace period. You have today. Use it.

---

## Core Features

### Task List

Add tasks and optionally mark one or more as **Priority**. Priority tasks change the rules: once any Priority task exists, only completing a Priority task counts toward your daily quota. This lets you signal to the app — and to yourself — what actually matters today.

Tasks are never deleted at the end of the day. Anything left incomplete carries forward automatically to tomorrow's list.

### Daily Quota

When you add your first task, you commit to a daily quota: the number of qualifying tasks you will complete before midnight. The app counts down to midnight in real time.

- Meet your quota at any point during the day and the SMS is cancelled. Your day is done.
- Miss your quota at midnight and the SMS fires immediately — no delay, no manual trigger.
- After a successful day, the same quota carries forward to the next morning automatically. You can adjust it once per day via a subtle option on the task list screen.
- After a missed day, you set a fresh quota before continuing.

Completing tasks beyond your quota is always allowed. They just don't count toward anything — the objective for the day is already met.

### Accountability System

When you commit to a quota, an SMS is scheduled via Twilio for delivery at midnight. If you complete your quota before then, the scheduled message is cancelled. If midnight arrives and the quota isn't met, the message fires automatically.

The default message reflects how the day actually went:

> *"[Name] didn't complete any of their tasks today."*
> *"[Name] completed 2 of 3 tasks today."*
> *"[Name] didn't complete any of their Priority tasks today."*

You can replace the default with a custom message during onboarding.

### SMS Consent

Do The Thing sends automated SMS notifications to a user-designated 
accountability partner. The app requires explicit informed consent 
from the user during onboarding before any partner information is 
saved or any messages are sent. Partners are designated voluntarily 
by the user and messages are only sent when a user misses their 
daily task quota.

### Push Notifications

The app pre-schedules a sequence of local push notifications when you set your quota:

- Morning reminder at a user-chosen wake time (if configured)
- 2 hours before midnight — gentle nudge
- 1 hour before midnight — direct reminder
- At midnight — urgent, references your accountability partner

Notification copy escalates in urgency as midnight approaches. All pending notifications are cancelled the moment your quota is met. If you set a new quota (after a missed day), the sequence is rescheduled from the current moment — only future-dated notifications are added.

### Accountability Partner Setup

During onboarding, you select one contact from your phone as your accountability partner. Their name and number are stored securely against your account. A clear consent notice is shown before saving — so you know exactly what you're signing them up to receive.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (custom dev client) |
| Language | TypeScript |
| Navigation | Expo Router |
| Backend | Supabase (Postgres + Edge Functions) |
| SMS | Twilio Programmable Messaging |
| Notifications | expo-notifications |
| Contacts | expo-contacts |
| Auth | Supabase Auth |

---

## Project Structure

```
/app          # Screens and navigation (Expo Router)
/components   # Reusable UI components
/hooks        # Custom React hooks
/lib          # Supabase client, Twilio helpers, utilities
/types        # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (required for Expo SDK 56)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A [Supabase](https://supabase.com) account and project
- A [Twilio](https://twilio.com) account with a phone number and messaging scheduling enabled
- An iOS device or simulator for local development

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
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

> **Note:** Twilio credentials should only ever live in Supabase Edge Functions and never be exposed to the client. The `.env` entries above are for local Edge Function development only.

### Running Locally

```bash
npx expo start
```

For a custom dev client build, see the EAS setup instructions in Sprint 6 of [ROADMAP.md](./ROADMAP.md).

---

## Database Schema

The core tables in Supabase are:

- **users** — account info and accountability partner details
- **tasks** — individual tasks with priority and completion status
- **deadlines** — one record per user tracking their daily quota, today's completion count, the last reset timestamp, and the scheduled Twilio message SID

Row Level Security is enabled on all tables. Users can only read and write their own data.

---

## Build Status

This project is currently in active development. See [ROADMAP.md](./ROADMAP.md) for a full sprint-by-sprint breakdown of completed and upcoming work.

---

## Contributing

This is a personal project at an early stage. Issues and suggestions are welcome — open an issue to start a conversation before submitting a pull request.

---

## License

MIT
