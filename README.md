# BrightPath ✦ UK Exam Prep PWA

> Free, calm, 5-minute daily exam prep for UK students in Years 8–12.  
> **GCSE Track** (Years 8–10) · **A-Level Track** (Years 11–12: UCAT, LNAT, TMUA, ESAT, TSA, STEP)

---

## Tech Stack (100% free tier)

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite + PWA (installable, offline-capable) |
| Routing | React Router v6 |
| Backend / DB | Supabase (auth + Postgres + RLS) |
| AI Explanations | Claude via Supabase Edge Function (Deno) |
| Hosting | GitHub Pages (free, automatic via Actions) |
| CI/CD | GitHub Actions |

---

## One-time Setup (≈ 30 minutes)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/brightpath.git
cd brightpath
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier)
2. Wait ~2 min for it to spin up
3. Go to **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → keep secret, only for admin scripts

### 3. Run database migrations

```bash
# Install Supabase CLI (once)
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Push the schema
supabase db push
```

Or copy-paste `supabase/migrations/001_init.sql` directly into the Supabase SQL editor.

### 4. Configure environment

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 5. Set AI API key (Edge Function secret)

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 6. Deploy Edge Function

```bash
supabase functions deploy explain
```

### 7. Run locally

```bash
npm run dev
# → http://localhost:5173
```

---

## Deploy to GitHub Pages (automatic)

### Add GitHub Secrets

In your repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_ACCESS_TOKEN` | From supabase.com → Account → Access tokens |
| `SUPABASE_PROJECT_ID` | Your project ref (e.g. `abcdefghijklmnop`) |

### Enable GitHub Pages

Repo → **Settings → Pages → Source: GitHub Actions**

### Push to main

```bash
git add .
git commit -m "initial deploy"
git push origin main
```

The Actions workflow builds the PWA and deploys it automatically.  
Your app will be live at: `https://YOUR_USERNAME.github.io/brightpath`

---

## Project Structure

```
brightpath/
├── src/
│   ├── components/
│   │   └── LoadingSpinner.jsx
│   ├── data/
│   │   └── questions.js          ← All question banks (GCSE + A-Level)
│   ├── hooks/
│   │   ├── useAuth.js            ← Auth state + anonymous sign-in
│   │   └── useProgress.js        ← XP, streak, session writes
│   ├── lib/
│   │   ├── supabase.js           ← Supabase client singleton
│   │   ├── db.js                 ← All DB query functions
│   │   └── ai.js                 ← AI explanation caller
│   ├── pages/
│   │   ├── LandingPage.jsx       ← Stream selector
│   │   ├── HomePage.jsx          ← Subject/exam picker + XP banner
│   │   ├── QuizPage.jsx          ← Quiz flow
│   │   ├── ResultPage.jsx        ← Score + AI explain modal
│   │   ├── ProgressPage.jsx      ← Weekly heatmap + topic bars
│   │   └── TeacherPage.jsx       ← Public teacher dashboard (/teacher/:token)
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx                   ← Router
│   └── main.jsx                  ← Entry point
├── supabase/
│   ├── migrations/
│   │   └── 001_init.sql          ← Full schema + RLS + RPC functions
│   └── functions/
│       └── explain/
│           └── index.ts          ← Edge Function (AI proxy)
├── .github/
│   └── workflows/
│       └── deploy.yml            ← CI/CD: build → GitHub Pages + Edge Functions
├── .env.example
├── vite.config.js                ← PWA config
└── index.html
```

---

## Supabase Free Tier Limits (you won't hit these early on)

| Resource | Free limit |
|---|---|
| Database | 500 MB |
| Auth users | Unlimited |
| Edge Function invocations | 500,000 / month |
| Storage | 1 GB |
| Realtime connections | 200 concurrent |

---

## Adding Questions

Edit `src/data/questions.js`. Each question follows this shape:

```js
{
  id:         "maths_009",      // unique, format: "<subject>_<num>"
  q:          "Question text",
  opts:       ["A","B","C","D"],
  ans:        1,                // 0-indexed correct option
  topic:      "Algebra",
  hint:       "One-line hint shown on request",
  difficulty: 2,                // 1 easy | 2 medium | 3 hard
  tags:       ["algebra","gcse-foundation"],
}
```

---

## Teacher Dashboard

Generate a token in the Supabase SQL editor:

```sql
insert into teacher_tokens (token, teacher_id, label)
values ('tok_abc123', 'uuid-of-teacher', 'Year 9 Maths Set 1');
```

Share the URL: `https://your-app.com/teacher/tok_abc123`

No teacher login required — the token is the credential.

---

## Roadmap

- [ ] Spaced repetition engine (SM-2 algorithm)
- [ ] Push notifications for daily streak reminders (Web Push API)
- [ ] Email sign-up upgrade from anonymous account
- [ ] Premium tier (£4.99/mo) — unlimited AI explanations, full question bank
- [ ] School licence portal
- [ ] Parent progress digest email (weekly)

---

## Licence

MIT — free to use, fork, and build on.
