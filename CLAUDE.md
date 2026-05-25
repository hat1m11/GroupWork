# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Next.js 16 + Turbopack)
npm run build    # production build
npm run lint     # eslint
```

## Stack

- **Next.js 16.2.6** (App Router) — see AGENTS.md; middleware is now `proxy.ts`, not `middleware.ts`
- **Supabase** — auth + postgres + realtime; `@supabase/ssr` 0.10.3
- **Tailwind CSS v4**
- **TypeScript**

## Supabase Client Pattern

There are three clients — always choose the right one:

| Client | File | Use for |
|---|---|---|
| Server (user JWT) | `lib/supabase/server.ts` | `auth.getUser()` only |
| Admin (service role) | `lib/supabase/admin.ts` | All DB reads/writes in API routes |
| Browser | `lib/supabase/client.ts` | Realtime subscriptions in client components |

**Rule:** API routes always call `createClient()` for auth, then `createAdminClient()` for every DB operation. Never use the server client for DB queries — RLS + session forwarding is unreliable in Route Handlers.

## Auth & Session

- `proxy.ts` (Next.js 16 name for middleware) refreshes the Supabase session cookie on every request
- Protected routes: `/dashboard`, `/groups/*`, `/my-tasks` — guarded in both `proxy.ts` and each page via `auth.getUser()` + redirect
- `public.users` mirrors `auth.users` via a DB trigger (`handle_new_user`). Always reference `public.users`, not `auth.users`, for profile data

## Database

All tables have RLS enabled. A `security definer` function `is_group_member(group_id uuid)` exists to avoid recursive RLS on `group_members`. Use it in new policies on tables that join through `group_members`.

Current tables: `users`, `groups`, `group_members`, `rubric_sections`, `tasks`, `subtasks`, `messages`, `notifications`, `contribution_logs`

Migrations live in `supabase/migrations/` and must be run manually in the Supabase SQL Editor.

## Architecture

**Pages** are async Server Components that fetch all data, then pass it to `"use client"` components as props. No client-side data fetching on initial load.

**Mutations** go through API routes (`app/api/`), never directly from client components to Supabase. Client components call `fetch("/api/...")`, then update local state optimistically.

**Realtime** (chat + notifications) uses `createClient()` (browser) in `useEffect` with `supabase.channel(...).on("postgres_changes", ...)`. Always clean up with `supabase.removeChannel(channel)` on unmount.

**Group workspace** (`/groups/[groupId]`) uses a `GroupWorkspace` client component as a tab switcher between `TaskBoard` and `ChatPanel` — this avoids hydration issues from mixing server and client trees.

## Key Conventions

- Date formatting: always pass `"en-GB"` as the locale to `toLocaleDateString()` to avoid SSR/client hydration mismatches
- `params` in App Router route handlers are `Promise<{ ... }>` — always `await params`
- New DB tables need entries in `lib/supabase/types.ts` (Row/Insert/Update + convenience alias at bottom)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
