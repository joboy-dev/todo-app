<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Todo List App

## Stack
- **Framework**: Next.js (App Router), TypeScript
- **DB**: Turso (hosted libSQL — sqlite-compatible, persists across serverless invocations, unlike a raw sqlite file which does not survive Vercel's ephemeral/read-only filesystem). Local dev uses a file-based libSQL DB (`local.db`) via the same client.
- **ORM**: Drizzle ORM (`drizzle-orm/libsql` client)
- **Deploy**: Vercel
- **Auth**: none — single-user/no-login app

## Project structure
```
app/
  page.tsx              # todo list UI (server component, fetches todos)
  layout.tsx
  actions.ts            # Server Actions: addTodo, toggleTodo, deleteTodo, editTodo
  todo-item.tsx          # client component for per-todo interactivity
db/
  schema.ts             # Drizzle schema (todos table)
  client.ts             # libSQL client + drizzle instance (Turso in prod, local.db in dev)
drizzle/                # generated migrations (drizzle-kit)
drizzle.config.ts
.env.local              # TURSO_DATABASE_URL, TURSO_AUTH_TOKEN (unset locally = falls back to local.db)
```

## Data model
```ts
// db/schema.ts
todos {
  id: integer, primary key, autoincrement
  title: text, not null
  completed: integer (boolean), default 0
  createdAt: text, default now
}
```
No user_id column — single shared list, no auth/ownership scoping.

## Request/workflow lifecycle
1. **List todos**: `app/page.tsx` (server component) queries Drizzle directly at render time — no client fetch for initial load.
2. **Create todo**: form calls `addTodo` Server Action → insert row → `revalidatePath("/")` → UI updates.
3. **Toggle todo**: checkbox calls `toggleTodo` Server Action → update `completed` → revalidate.
4. **Edit todo**: inline edit calls `editTodo` Server Action → update `title` → revalidate.
5. **Delete todo**: delete button calls `deleteTodo` Server Action → remove row → revalidate.
6. All writes go through Server Actions in `app/actions.ts` — no separate `/api/*` route handlers needed for this app's size.

## Local dev
- `npm run dev` — Next.js dev server (uses `local.db` file, gitignored)
- `npx drizzle-kit push` — sync schema to the active DB (local or Turso, based on env vars)
- `npx drizzle-kit studio` — inspect data

## Environment variables
```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```
Unset in local dev → client falls back to `file:local.db`. Set both in Vercel project settings (Production + Preview) pointing at a real Turso DB.

## Deployment
- Push to GitHub, import repo in Vercel, set the two env vars above, deploy.
- Schema sync is automatic: `package.json`'s `vercel-build` script (`drizzle-kit push --force && next build`) runs on every Vercel deploy, so the `todos` table is created/updated against the Turso DB before the app builds. No manual `drizzle-kit push` step needed for Vercel deploys — only run it manually for local dev (`local.db`) or if pushing schema changes outside of a deploy.

## Conventions for agents working in this repo
- Keep it flat — one `todos` table, no auth, no multi-tenant scoping. Don't add user accounts, JWTs, or role checks unless explicitly asked.
- Use Server Components for reads, Server Actions for writes. Avoid client-side data-fetching libraries (SWR/React Query) — unnecessary for this scale.
- Don't reintroduce any of the removed FastAPI/Postgres/Firebase boilerplate (this repo previously contained unrelated leftover boilerplate from a project called "GreenTrac API" — fully removed).
- No comments explaining what code does; only note non-obvious constraints (e.g. why Turso instead of raw sqlite).
