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
  page.tsx              # server component: fetches todos, renders layout
  layout.tsx
  actions.ts            # Server Actions: addTodo, toggleTodo, editTodo, deleteTodo,
                         #   updatePriority, updateDueDate, updateCategory,
                         #   clearCompleted, toggleAll, reorderTodos
  add-todo-form.tsx      # client component: new-todo form (title, priority, due date, category)
  todo-app.tsx           # client component: search/filter/sort state, bulk actions, drag context
  todo-item.tsx          # client component: single sortable todo row
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
  priority: text ("low" | "medium" | "high"), default "medium"
  category: text, nullable          # free-text tag, e.g. "work"
  dueDate: text, nullable           # ISO date "YYYY-MM-DD"
  sortOrder: integer, default 0     # manual drag-and-drop order
  createdAt: text, default now
}
```
No user_id column — single shared list, no auth/ownership scoping.

## Request/workflow lifecycle
1. **List todos**: `app/page.tsx` (server component) queries Drizzle directly at render time, ordered by `sortOrder` — no client fetch for initial load.
2. **Create todo**: `AddTodoForm` calls `addTodo` Server Action (title + priority + optional due date/category) → insert row with `sortOrder = max + 1` → `revalidatePath("/")`.
3. **Toggle/edit fields**: checkbox/select/date/text inputs in `TodoItem` call `toggleTodo` / `editTodo` / `updatePriority` / `updateDueDate` / `updateCategory` on change or blur → revalidate.
4. **Delete todo**: delete button calls `deleteTodo` → remove row → revalidate.
5. **Bulk actions**: `clearCompleted` (deletes all completed rows) and `toggleAll` (marks every row complete/incomplete), triggered from the toolbar in `TodoApp`.
6. **Search / filter / sort**: handled client-side in `TodoApp` over the full todo list passed down as props — no server round-trip. Status filter (all/active/completed), category filter, text search, and sort mode (manual/priority/due date) all compose together.
7. **Drag-and-drop reorder** (`@dnd-kit`): only enabled when the view is unfiltered/unsorted (`sortMode === "manual"`, no search, no filters) — otherwise the visual order wouldn't match `sortOrder` and dragging would be confusing. On drop, `reorderTodos` persists the new `sortOrder` values.
8. All writes go through Server Actions in `app/actions.ts` — no separate `/api/*` route handlers.

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
