# Todo List App

Simple todo list. Next.js (App Router) + Drizzle ORM + libSQL (Turso in prod, local file db in dev). No auth.

See [AGENTS.md](./AGENTS.md) for architecture, data model, and workflow details.

## Local dev

```bash
npm install
npx drizzle-kit push   # creates local.db and applies schema
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Create a database at [turso.tech](https://turso.tech) (free tier).
2. Push this repo to GitHub, import into Vercel, set `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` in the project's env vars.
3. Deploy — the `vercel-build` script pushes the schema to Turso automatically before every build, so the `todos` table is always in sync. No manual migration step needed.
