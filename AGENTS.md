# Agent instructions for noteApp

## Repo structure

- `note-app-client/` — Next.js 16 app (App Router, React 19). **All code lives here.**
- `note-app-server/` — Empty placeholder. Ignore for now.

## Quick commands

All commands run from `note-app-client/`:

```bash
npm install          # install deps (first time)
npm run dev          # start dev server on http://localhost:3000
npm run build        # production build
npm run lint         # ESLint (flat config, next/core-web-vitals)
```

No test suite exists. No typecheck script (project uses jsconfig, not tsconfig).

## Key facts

- **Next.js 16.3** — breaking changes vs earlier versions. Consult `note-app-client/node_modules/next/dist/docs/` before modifying Next-specific code.
- **React Compiler** enabled in `next.config.mjs` (`reactCompiler: true`).
- **Tailwind CSS v4** — config is CSS-based in `src/app/globals.css` via `@theme`. No `tailwind.config` file.
- **Path alias** `@/*` maps to `./src/*` (jsconfig.json).
- **Auth**: better-auth with MongoDB adapter. Server config in `src/lib/auth.js`, client in `src/lib/auth-client.js`.
  - `auth-client.js` hardcodes `baseURL: "http://localhost:3000"` — update if deploying elsewhere.
- **Database**: MongoDB Atlas via `MONGODB_URI` in `.env`.
- **`.env` contains secrets** — already in repo history. `.gitignore` has `.env*` but the file was committed. Do not add new secrets.

## Code conventions

- `"use client"` on pages that use state/hooks (page.js, login, signup). Server components are the default.
- Components are `.jsx`, pages are `.js` or `.jsx`. No TypeScript.
- Inline Tailwind classes throughout. Custom CSS variables defined in `globals.css` `@theme` block.
- All notes are hardcoded in `src/app/page.js` (no API/persistence yet). Editing is local state only.

## Gotchas

- `next dev` auto-generates an `AGENTS.md` block inside `note-app-client/AGENTS.md`. Don't remove it — it regenerates.
- The login page (`src/app/login/page.jsx`) calls `authClient.signUp.email` — likely a bug (should be `signIn.email`).
- No server-side API routes exist yet. Auth endpoints are served by better-auth's built-in handler.
