# Do The Thing

A minimalist iOS accountability app built with Expo and React Native. Do The Thing strips away the complexity of traditional to-do apps and replaces it with a single, motivating question: what happens if you *don't* do it?

---

## The Idea

Most productivity apps give you more ways to organize tasks than to actually do them. Do The Thing takes the opposite approach. You add your tasks, set a deadline, and designate an accountability partner. If you don't complete a qualifying task before the clock runs out, your partner gets a text. That's it.

---

## Core Features

### Task List

Add tasks and optionally mark one or more as **Priority**. Priority tasks change the rules: once any Priority task exists, only completing a Priority task counts as progress. Non-priority completions won't reset the clock or stop the accountability mechanic from firing.

### Task Timer

When you add your first task, you set a deadline. The app schedules a sequence of push notifications to keep you honest:

- 24 hours before the deadline
- 1 hour before the deadline
- At the deadline
- Every 30 minutes for up to 3 hours after — escalating in urgency

Complete a qualifying task at any point and the clock resets, giving you a fresh deadline of the same original duration. All pending notifications are cancelled and rescheduled from the current moment.

### Accountability System

When you set a deadline, an SMS is immediately scheduled via Twilio for delivery at the exact deadline timestamp. If you complete a qualifying task in time, the scheduled message is cancelled. If the deadline passes without completion, your accountability partner gets the text automatically — no manual trigger, no delay.

The default message reads something like:

> *"[Your name] wanted you to know they still haven't completed any tasks!"*

You can customize this message during onboarding.

### Accountability Partner Setup

During onboarding, you select one contact from your phone as your accountability partner. Their name and number are stored securely against your account. You're shown a clear consent notice before saving — so you know exactly what you're signing them up to receive.

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
- **deadlines** — deadline records including Twilio message SID and status

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
