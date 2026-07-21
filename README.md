# lifeQuest

A personal task/quest tracking dashboard with a light RPG gamification touch. Real
accountability tool: surfaces what needs attention today, tracks task chains, and
includes an AI assistant (the Oracle) that turns natural-language narration into
task suggestions you explicitly approve, edit, or reject.

See `CLAUDE.md` for the full product spec and conventions.

## Stack

- Frontend: React (JS) + Vite, plain CSS per component (`frontend/src/styles`)
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL (Docker Compose locally, Neon in production)
- Oracle AI: Anthropic Claude API (offline fallback if no key is configured)

## Local setup

### 1. Database

```
docker compose up -d
```

Starts Postgres on `localhost:5432` (user/pass/db: `lifequest`).

### 2. Backend

```
cd backend
cp .env.example .env      # fill in JWT_SECRET and ANTHROPIC_API_KEY
npm install
npx prisma migrate dev
npm run dev                # http://localhost:4000
```

Without an `ANTHROPIC_API_KEY`, the Oracle runs in offline mode (replies with a
notice instead of parsing narration) — everything else works normally.

### 3. Frontend

```
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173`. First visit takes you to Login/Setup where you
create the single account for this deployment (name, email, password, avatar
gender aesthetic).

## Deployment targets

- Backend → Render (`npm run prisma:deploy` on release, `npm start` to run)
- Frontend → Vercel (static Vite build, set `VITE`-less proxy via a rewrite to
  the Render backend URL, or configure `FRONTEND_ORIGIN`/API base accordingly)
- Database → Neon (swap `DATABASE_URL` in the backend environment)

No infra was provisioned as part of this build — the app runs fully locally
against the Dockerized Postgres instance described above.
