# Nexora — Full Tech Stack Reference

> UK Exam Prep PWA · GCSE & A-Level (UCAT, LNAT, TMUA, ESAT, TSA, STEP)
> Built and maintained by @fazilathafif

---

## Live Services & Dashboards

| Service | Purpose | Dashboard / Link |
|---|---|---|
| **Vercel** | Hosting, CDN, auto-deploy | https://vercel.com/dashboard |
| **Supabase** | Auth, PostgreSQL, Edge Functions | https://supabase.com/dashboard/project/nwouvraxquxdjgfxljui |
| **GitHub** | Source control, CI/CD trigger | https://github.com/fazilathafif/nexora |
| **Anthropic** | Claude AI model (quiz explanations) | https://console.anthropic.com |
| **Google Cloud** | Google OAuth credentials | https://console.cloud.google.com |

---

## Frontend

| Tool | Version | Role |
|---|---|---|
| **React** | 18.3.1 | UI library |
| **Vite** | 5.4.0 | Build tool, dev server |
| **React Router DOM** | v6.26.0 | Client-side routing (SPA) |
| **react-markdown** | 10.1.0 | Render AI explanation markdown |
| **vite-plugin-pwa** | 0.20.0 | Service worker, Web App Manifest |
| **Workbox** | (via plugin) | Offline caching, background sync |
| **Inter** (Google Fonts) | — | UI typeface |
| **Playfair Display** (Google Fonts) | — | Logo / headings typeface |

> **Framework note:** No CSS framework — all styles are inline React style objects for zero-bundle CSS and mobile-first design.

---

## Hosting — Vercel

- **Deployment trigger:** push to `main` branch on GitHub → Vercel auto-builds and deploys.
- **Build command:** `npm run build` (Vite)
- **Output directory:** `dist/`
- **SPA rewrite rule** (`vercel.json`):
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
  Required so React Router handles deep links (e.g. `/alevel/quiz/ucat`).
- **Environment variables** set in Vercel project settings:

  | Variable | Value | Visibility |
  |---|---|---|
  | `VITE_SUPABASE_URL` | `https://nwouvraxquxdjgfxljui.supabase.co` | Public (prefixed `VITE_`) |
  | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_1ApxMrPiF0jv_SEnVUChNw_NhJhMg2j` | Public (anon/publishable key) |

---

## Backend — Supabase

**Project ref:** `nwouvraxquxdjgfxljui`
**Region:** (set during project creation)

### Auth

Supabase Auth handles all identity. Two methods are enabled:

| Method | Provider | Notes |
|---|---|---|
| Email + Password | Built-in | Sign-up sends confirmation email; reset sends password-reset email |
| Google OAuth | Google (`provider: 'google'`) | Configured in Supabase → Auth → Providers → Google |

**Google OAuth setup requires:**
1. A **Google Cloud OAuth 2.0 Client ID + Secret** — obtained from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Both values pasted into Supabase → Auth → Providers → Google.
3. `Authorized redirect URI` in Google Cloud set to:
   `https://nwouvraxquxdjgfxljui.supabase.co/auth/v1/callback`

**Session persistence logic:**
- `localStorage: nexora_remember_me` — set on email sign-in when "Remember me" is ticked; OAuth users always get this.
- `sessionStorage: nexora_session_active` — set on every sign-in; cleared on sign-out. Guards against tab-close expiry for non-remembered sessions.

### PostgreSQL Database

All tables use **Row Level Security (RLS)** — users can only access their own rows.

| Table | Key columns | Purpose |
|---|---|---|
| `profiles` | `id (uuid, FK auth.users)`, `stream`, `xp`, `streak`, `exam_date` | One row per user — XP, streak, stream choice, exam date |
| `sessions` | `user_id`, `stream`, `subject`, `score`, `duration_seconds` | One row per completed quiz or mock attempt |
| `answers` | `session_id`, `question_id`, `topic`, `chosen_index`, `is_correct`, `hint_used` | One row per answered question — used for topic accuracy + SRS |
| `daily_activity` | `(user_id, date)` composite PK, `sessions` | Drives weekly heatmap and streak calculation |

**Stored Procedures (RPCs):**

| Function | Caller | Purpose |
|---|---|---|
| `get_admin_stats()` | SysAdminPage | Returns aggregated counts (users, sessions, answers, signups this week) |
| `increment_xp(user_id, amount)` | QuizPage / MockPage | Atomically adds XP to a profile |
| `get_class_summary(token)` | TeacherPage | Returns class stats for a teacher token |

### Edge Functions (Deno runtime)

| Function | URL | Purpose |
|---|---|---|
| `explain` | `https://nwouvraxquxdjgfxljui.supabase.co/functions/v1/explain` | Calls Anthropic Claude API and streams the response back to the browser as plain text |

The `explain` function reads the `ANTHROPIC_API_KEY` secret from Supabase secrets (never exposed to the browser). It uses Claude `claude-haiku-4-5-20251001` with streaming enabled (`"stream": true`), forwarding SSE delta events back as chunked plain text.

**To update the secret:**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## AI — Anthropic

| Setting | Value |
|---|---|
| **Model** | `claude-haiku-4-5-20251001` |
| **API endpoint** | `https://api.anthropic.com/v1/messages` |
| **API version header** | `anthropic-version: 2023-06-01` |
| **Max tokens** | 350 (standard) / 450 (elaborate mode) |
| **Streaming** | Yes — SSE delta events forwarded via Edge Function |
| **Key location** | Supabase secret `ANTHROPIC_API_KEY` (server-side only) |
| **Console** | https://console.anthropic.com |

Two prompt modes: **standard** (Why/Key concept/Exam tip, ≤180 words) and **elaborate** (Worked example/Deeper concept/Connections, ≤280 words).

---

## Source Control & CI/CD — GitHub

| Item | Value |
|---|---|
| **Repository** | https://github.com/fazilathafif/nexora |
| **Default branch** | `main` |
| **Deploy trigger** | Every push to `main` → Vercel auto-deploys |
| **No CI pipeline** | Tests are run locally (`npm run build`) before pushing |

---

## PWA Configuration

Configured via `vite-plugin-pwa` in `vite.config.js`:

| Setting | Value |
|---|---|
| App name | Nexora – UK Exam Prep |
| Short name | Nexora |
| Theme colour | `#0F766E` |
| Display mode | `standalone` (installs like a native app) |
| Orientation | `portrait` |
| Icons | 192×192 and 512×512 PNG in `/public/icons/` |
| SW strategy | `generateSW` (Workbox auto-generate) |
| SW update | `autoUpdate` (skipWaiting + clientsClaim) |

**Workbox caching rules:**
- Supabase API calls → `NetworkFirst` (1-day cache, 50 entries max)
- Google Fonts → `CacheFirst` (1-year cache)
- All static assets (JS/CSS/HTML/PNG/SVG) → precached at build time

---

## Client-Side Storage (localStorage / sessionStorage)

| Key | Storage | Purpose |
|---|---|---|
| `nx_srs` | localStorage | SM-2 spaced repetition schedule `{ [questionId]: { interval, ease, reps, nextDue } }` |
| `nx_heaven` | localStorage | Card Heaven mastery counts `{ [questionId]: easyCount }` — promoted to heaven at 3× Easy |
| `nx_guest_profile` | localStorage | Offline guest profile (XP, streak, stream) when Supabase is not configured |
| `nexora_remember_me` | localStorage | Presence flag — keeps email auth session alive across browser closes |
| `nexora_session_active` | sessionStorage | Tab-scoped flag — prevents auto-signout when navigating within a single tab |

---

## Key Environment Variables Summary

| Variable | Where set | Value | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` + Vercel | `https://nwouvraxquxdjgfxljui.supabase.co` | Public — safe to expose |
| `VITE_SUPABASE_ANON_KEY` | `.env` + Vercel | `sb_publishable_1ApxMrPiF0jv_SEnVUChNw_NhJhMg2j` | Anon/publishable key — safe to expose, protected by RLS |
| `ANTHROPIC_API_KEY` | Supabase secrets only | `sk-ant-...` | **Never in frontend.** Server-side Edge Function only |
| `VITE_APP_ENV` | `.env` | `development` / `production` | Used for conditional behaviour |

> **Security note:** The Supabase anon key is intentionally public — it only allows operations permitted by Row Level Security policies. The Anthropic key is the only truly secret credential and lives exclusively in Supabase's encrypted secrets vault.

---

## Project Structure (key files)

```
brightpath-scaffold/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx       # Stream selector (GCSE / A-Level)
│   │   ├── HomePage.jsx          # Subject/exam picker, XP banner, Pomodoro launcher
│   │   ├── QuizPage.jsx          # Practice quiz with AI explanations + Brain Break
│   │   ├── MockPage.jsx          # Timed mock exam
│   │   ├── ResultPage.jsx        # Post-session results breakdown
│   │   ├── FlashcardsPage.jsx    # SRS flashcards, swipe gestures, Card Heaven
│   │   ├── MatchPage.jsx         # Match Mode tile game
│   │   ├── ProgressPage.jsx      # Topic accuracy heatmap + SRS due count
│   │   ├── StudyPlanPage.jsx     # AI-generated study plan
│   │   ├── TeacherPage.jsx       # Teacher class dashboard (token-based)
│   │   ├── SysAdminPage.jsx      # Admin stats (password protected)
│   │   ├── AuthGate.jsx          # Full-page sign-in (Google + email)
│   │   └── UpdatePasswordPage.jsx# Password recovery flow
│   ├── components/
│   │   ├── PomodoroTimer.jsx     # 25/5 floating Pomodoro widget
│   │   ├── AuthModal.jsx         # In-app sign-in modal (for guest → account upgrade)
│   │   ├── WelcomeModal.jsx      # First-visit onboarding modal
│   │   └── LoadingSpinner.jsx    # Full-page loading state
│   ├── lib/
│   │   ├── supabase.js           # Supabase client initialisation
│   │   ├── db.js                 # All database/auth helper functions
│   │   ├── srs.js                # SM-2 spaced repetition logic (localStorage)
│   │   ├── ai.js                 # Fetch wrapper for the explain Edge Function
│   │   └── guest.js              # Offline guest profile helpers
│   ├── hooks/
│   │   └── useAuth.js            # Auth state, session persistence, signOut
│   └── data/
│       ├── questions.js          # All question banks (GCSE + A-Level)
│       └── breaks.js             # Brain Break tip/joke/motivation content
├── supabase/
│   ├── functions/explain/        # Deno Edge Function (Anthropic streaming)
│   └── migrations/               # SQL migrations (001_init, 002_exam_date, 003_admin_stats)
├── public/icons/                 # PWA icons (192, 512)
├── vercel.json                   # SPA rewrite rule
├── vite.config.js                # Vite + PWA plugin config
└── .env                          # Local env vars (not committed)
```

---

## Deployment Checklist

When deploying to a new environment or rotating credentials:

- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings
- [ ] Set `ANTHROPIC_API_KEY` via `supabase secrets set`
- [ ] Enable Google OAuth in Supabase → Auth → Providers, paste Client ID + Secret from Google Cloud Console
- [ ] Add `https://<your-supabase-ref>.supabase.co/auth/v1/callback` to Google Cloud authorised redirect URIs
- [ ] Add your Vercel domain to Supabase → Auth → URL Configuration → Site URL and Redirect URLs
- [ ] Run `supabase db push` if there are pending migrations
- [ ] Push to `main` — Vercel auto-deploys
