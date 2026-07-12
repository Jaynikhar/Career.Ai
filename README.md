# CareerPrep AI — runnable MVP (MERN)

A working scaffold of the platform: auth, 7-day trial gating on company prep, job board with application tracking, a subscriber-only AI agent (resume/cover-letter/cold-email drafting), simulated subscription checkout, and an admin dashboard.

This is a genuine MVP you can run locally today — not a mockup. A few things are intentionally simulated so you can build and demo without paying for external services yet (clearly marked below); everything else is real, working code against a real MongoDB database.

## What's real vs. simulated

| Feature | Status |
|---|---|
| Signup/login, JWT auth, bcrypt hashing | Real |
| 7-day trial + subscription gating middleware | Real |
| Company prep, job board, application tracking, admin routes | Real, backed by MongoDB |
| AI agent (resume/cover letter/cold email) | Real request flow. Returns clearly-labeled mock text unless you set `OPENAI_API_KEY`, in which case it calls OpenAI for real. |
| Automatic job fetching | Real — pulls from live public job-board APIs (Remotive, Arbeitnow) on a schedule. See §7. |
| Automatic question generation | Real request flow, same mock/live split as the AI agent. Generates original questions, never scraped. See §7. |
| Subscription checkout | Simulated — instantly activates a subscription in the DB so you can test gating. Swap in real Stripe Checkout + webhook verification before launch (see `server/src/controllers/subscription.controller.js` for where to plug it in). |
| Recruiter discovery / automated outreach | **Not included in this scaffold.** As flagged earlier, this feature carries real legal/ToS risk (LinkedIn scraping, CAN-SPAM/GDPR) and needs a licensed data source plus a user-review-before-send flow — build it deliberately rather than automate it outright. |

## Requirements

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## 1. Backend setup

```bash
cd server
cp .env.example .env
npm install
npm run seed     # populates companies, questions, jobs, and a seeded admin user
npm run dev       # starts on http://localhost:5000
```

Seeded admin login: `admin@careerprep.dev` / `AdminPass123`

## 2. Frontend setup

```bash
cd client
npm install
npm run dev       # starts on http://localhost:5173
```

Open http://localhost:5173, sign up, and you're in. The Vite dev server proxies `/api` to the backend, so no CORS config is needed in development.

## 3. Try the trial/paywall logic

New users get a 7-day trial (configurable via `TRIAL_DAYS` in `server/.env`). To test the "expired" state quickly without waiting a week, either:
- lower `TRIAL_DAYS` to `0` in `.env` and restart the server, or
- manually edit a user's `trialStartedAt` in MongoDB to a date more than 7 days ago.

## 4. Try the AI agent gate

The AI agent routes require an **active subscription**, not just the trial. Go to `/subscription` and choose a plan (this instantly activates it in this scaffold) — then `/ai-agent` will unlock.

## 5. Enabling real AI output

Set `OPENAI_API_KEY` in `server/.env` and restart the server. `server/src/services/ai.service.js` will call OpenAI's chat completions endpoint instead of returning mock text. Swap the model/provider there if you'd rather use a different one.

## 6. Going to production

Before shipping this for real users:
1. Replace simulated checkout with real Stripe Checkout Sessions + webhook signature verification.
2. Move LaTeX resume compilation into a sandboxed container (no shell-escape, no network) — see the architecture doc's security section.
3. Add the outreach feature deliberately: licensed recruiter-data source, user-reviewed drafts before send, audit logging, unsubscribe tokens, and rate limits (again, see the architecture doc).
4. Add refresh-token rotation, email verification, and password reset flows — this scaffold covers signup/login only.
5. Add structured logging (Winston/Pino) and error monitoring (Sentry).

## 7. Automatic content pipeline (jobs + questions, on a schedule)

Two recurring workers keep the app's content fresh without any manual entry:

| Worker | What it does | Why it's built this way |
|---|---|---|
| `src/jobs/ingestJobs.js` | Pulls live postings from **public job-board APIs** (Remotive, Arbeitnow — both free, no scraping, no ToS risk) and upserts them by `externalId`, so re-running never creates duplicates. | Scraping a company's careers page or LinkedIn directly would violate their ToS. These APIs are built for exactly this kind of aggregation. |
| `src/jobs/generateQuestions.js` | For each company, tops up each question type (OA/Technical/HR) up to a target count using **AI-generated original questions** via `services/questionGenerator.service.js`. | Scraping question banks from sites like Glassdoor or GeeksforGeeks and re-hosting them is a real copyright problem — those are copyrighted compilations, not public data. Generating original, representative questions gets you the same "always-growing content" outcome without that exposure. |

Both are scheduled with `node-cron` from `src/jobs/scheduler.js`, started from `server.js` when `ENABLE_SCHEDULER=true`.

**To enable:**
```bash
# in server/.env
ENABLE_SCHEDULER=true
JOB_INGEST_CRON=0 */6 * * *      # every 6 hours
QUESTION_GEN_CRON=0 3 * * *      # once a day at 3am
QUESTION_BANK_TARGET_PER_TYPE=10 # cap per company per question type
MAX_NEW_QUESTIONS_PER_RUN=3      # cap on AI calls per company per run
```

When enabled, both workers also run once immediately on server boot, so you're not waiting for the first cron tick right after `npm run seed`.

**To trigger a run manually** (e.g. to see it work without waiting): log in as the seeded admin, go to `/admin`, and use the "Content pipeline" section — or call the endpoints directly:
```bash
POST /api/admin/ingest/jobs
POST /api/admin/ingest/questions
```

**Cost control:** question generation only calls the AI provider (or returns mock output if `OPENAI_API_KEY` isn't set) up to `MAX_NEW_QUESTIONS_PER_RUN` per company per run, and stops entirely once a company's bank hits `QUESTION_BANK_TARGET_PER_TYPE` for a given type — it won't generate unboundedly.

**Extending job sources:** add more providers (Adzuna, USAJobs, Greenhouse/Lever public job boards) as fetch+normalize functions in `services/jobFeed.service.js` — each just needs to map that API's fields onto the same shape (`title`, `companyName`, `description`, `applyUrl`, `location`, `jobType`, `source`, `externalId`).

## Project structure

```
server/   Node + Express + MongoDB API
client/   React + Vite frontend
```

See inline comments in `server/src/middleware/subscription.middleware.js` and `server/src/services/ai.service.js` for where the "real vs. simulated" seams live.
