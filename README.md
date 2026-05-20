<div align="center">

# GroupWork

**The group assignment manager built for university students.**

Shared task board · Real-time chat · Deadline tracking · Grade-weighted rubrics

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38BDF8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## What is GroupWork?

GroupWork replaces the chaos of group-project WhatsApp threads with a proper workspace. Each group gets a kanban board mapped to the assignment rubric, a built-in chat with threading and @mentions, and a deadline dashboard that surfaces overdue work before it's too late.

Built specifically for university students — no enterprise pricing, no admin overhead, no learning curve.

---

## Features

### Task Board
- **Rubric-based kanban** — columns map to rubric sections, each showing grade weight and completion %
- **Priority levels** — Urgent / High / Medium / Low with colour-coded badges
- **Subtask checklists** — break tasks into steps with live progress bars
- **Labels** — tag tasks as research, writing, review, design, or code
- **Filter & sort** — filter by priority or label, sort by priority within columns
- **Blocked tasks** — surface blocked work in a dedicated alert band

### Group Chat
- **Real-time messaging** via Supabase Realtime
- **Threaded replies** — reply to any message to keep conversations focused
- **@mentions** — mention teammates with autocomplete; they get a notification
- **Pinned messages** — pin important links or decisions for the group
- **Emoji reactions** — quick reactions on any message
- **Message grouping** — consecutive messages from the same person are visually grouped

### Dashboard & Deadlines
- **My Groups** — all active group projects with urgency indicators
- **Upcoming Deadlines** — tasks due in the next 7 days at a glance
- **Overdue alerts** — groups with overdue tasks are flagged on the card
- **My Tasks** — every task assigned to you across all groups, grouped by status or due date

### Group Workspace

| Tab | What it shows |
|---|---|
| **Board** | Rubric-based kanban board |
| **Chat** | Real-time group chat |
| **Calendar** | Tasks plotted on a monthly calendar |
| **Workload** | Per-member task load with overdue indicators |
| **Resources** | Shared links — Google Docs, PDFs, slides |
| **Meetings** | Scheduled calls with join links |
| **Activity** | Full audit log of group actions |
| **Notes** | Shared auto-saving freeform document |

### Everything Else
- **Invite codes** — join a group with an 8-character code
- **Live presence** — see who was active recently on each member
- **Light / dark mode** — full CSS-variable theme with persistent preference
- **Responsive** — works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) |
| Deployment | [Vercel](https://vercel.com) (recommended) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Clone the repo

```bash
git clone https://github.com/hat1m11/GroupWork.git
cd GroupWork
npm install
```

### 2. Set up environment variables

Create `.env.local` in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these in your Supabase project under **Settings → API**.

### 3. Run the database migrations

Open your Supabase project → **SQL Editor**, and run each file in `supabase/migrations/` in order.

The migrations create:

```
users            — mirrors auth.users via trigger
groups           — group projects
group_members    — membership + roles
rubric_sections  — assignment rubric columns
tasks            — kanban cards
subtasks         — checklist items
messages         — group chat messages
notifications    — in-app notification feed
contribution_logs — activity audit trail
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
groupwork/
├── app/
│   ├── (auth)/              # Login & signup pages
│   ├── (dashboard)/         # Protected app routes
│   │   ├── dashboard/       # My Groups page
│   │   ├── my-tasks/        # All tasks across groups
│   │   └── groups/[id]/     # Individual group workspace
│   ├── api/                 # API route handlers
│   ├── globals.css          # Design system + CSS token definitions
│   └── layout.tsx           # Root layout with ThemeProvider
├── components/
│   ├── chat/                # ChatPanel, ChatMessage
│   ├── dashboard/           # UpcomingDeadlinesWidget
│   ├── groups/              # GroupHeader, GroupWorkspace, modals
│   ├── providers/           # ThemeProvider (dark / light mode)
│   ├── tasks/               # TaskBoard, TaskCard, RubricSectionColumn
│   └── ui/                  # LogoutButton, NotificationBell, ThemeToggle
├── lib/
│   └── supabase/            # Server, admin & browser clients + types
├── supabase/
│   └── migrations/          # SQL migration files
└── proxy.ts                 # Next.js middleware (session refresh)
```

---

## Design System

All theme colours are CSS custom properties. The `light` class on `<html>` swaps the values — no Tailwind dark variants needed.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--ct-bg` | `#0A0F1E` | `#F1F5F9` | Page background |
| `--ct-nav` | `#0D1424` | `#FFFFFF` | Navigation bar |
| `--ct-surf` | `#111827` | `#FFFFFF` | Card surfaces |
| `--ct-card` | `#141E2D` | `#F8FAFC` | Nested cards (tasks) |
| `--ct-hi` | `#1E2A3A` | `#F1F5F9` | Hover backgrounds |
| `--ct-bd` | `#1E2A3A` | `#E2E8F0` | Borders |
| `--ct-bdh` | `#2D3F55` | `#CBD5E1` | Hover borders |
| `--ct-in` | `#0D1424` | `#FFFFFF` | Input backgrounds |

---

## Scripts

```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add the three environment variables in the Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a branch — `git checkout -b feature/my-feature`
3. Commit — `git commit -m 'Add my feature'`
4. Push — `git push origin feature/my-feature`
5. Open a pull request

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built for students · Always free</sub>
</div>
