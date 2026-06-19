# FitTrack — Setup & Operations Guide

A multi-page vanilla HTML/JS fitness tracker. No build step, no backend server —
your browser talks directly to a free Neon PostgreSQL database and to OpenRouter
for the AI coach. English + বাংলা throughout.

---

## 1. Prerequisites

- A modern browser (Chrome, Edge, Firefox, Safari).
- Any static file server (the app uses ES modules, so opening `index.html` via
  `file://` will **not** work — modules require http/https).
- Optional but recommended: a free [Neon](https://neon.tech) account (database)
  and a free [OpenRouter](https://openrouter.ai) account (AI coach).

### Quickest local server options

```bash
# Python (preinstalled on most systems)
cd fittrack
python3 -m http.server 8080
# then open http://localhost:8080/setup.html

# OR Node
npx serve .
```

For free hosting, drop the folder onto **Netlify**, **Vercel**, **GitHub Pages**
or **Cloudflare Pages** — it's pure static files.

---

## 2. Folder structure

```
fittrack/
├── setup.html            ← first-run wizard (start here)
├── index.html            ← dashboard
├── exercises.html        ← exercise library + body explorer
├── workout.html          ← warmup → live session → summary
├── planner.html          ← weekly plan + templates
├── meals.html            ← meal & water logging, macro rings
├── progress.html         ← charts, streaks, PRs
├── profile.html          ← profile, DB & AI settings, preferences
├── ai-coach.html         ← streaming AI chat with your real data
├── reference.html        ← BMI / TDEE / protein calculators + tables
├── schema.sql            ← full DB schema (optional manual run)
├── js/
│   ├── app.js            ← shared utils + app shell (sidebar/bottom nav)
│   ├── db.js             ← Neon driver + ALL queries + offline mock
│   ├── auth.js           ← user session + admin password (SHA-256)
│   ├── exercises.js      ← library logic + 30-exercise seed
│   ├── workout.js        ← session engine, rest timer, PR detection
│   ├── planner.js        ← plans, 4 split templates, drag & drop
│   ├── meals.js          ← macros, rings, water, 60-food seed
│   ├── progress.js       ← analytics + CSS/SVG charts
│   ├── profile.js        ← profile persistence + unit conversion
│   ├── ai.js             ← OpenRouter streaming + prompt builder
│   └── admin.js          ← admin shell, seeds, AI config storage
└── admin/
    ├── login.html        ← set password on first visit, then login
    ├── index.html        ← admin dashboard + system status
    ├── exercises.html    ← full exercise CRUD + bulk seed
    ├── meals.html        ← food database + meal template builder
    ├── blogs.html        ← markdown blog editor (EN/BN)
    ├── guides.html       ← guide editor (EN/BN)
    ├── users.html        ← user overview + detail panel
    ├── ai-config.html    ← API key, model, prompt editor, test panel
    └── warmup.html       ← warmup steps, drag to reorder
```

---

## 3. Getting your free Neon database

1. Go to **https://neon.tech** and sign up (free tier is plenty).
2. Click **New Project**, name it `fittrack`, pick the region closest to you
   (Singapore `ap-southeast-1` is usually best from Bangladesh).
3. On the project dashboard, find **Connection string** and choose the
   **pooled** connection. It looks like:
   ```
   postgresql://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy it. You'll paste it into the app in the next step.

### Creating the tables — two ways (pick one)

**A. Automatic (recommended):** paste the connection string in
`setup.html` step 3 (or Profile → Database → *Initialize Tables*).
The app runs every `CREATE TABLE IF NOT EXISTS` for you.

**B. Manual:** open the **SQL Editor** in Neon, paste the contents of
`schema.sql`, and run it. The statements are identical to what the app runs
(the file is generated from the same source), so it's safe to do both.

---

## 4. Getting an OpenRouter API key (AI Coach)

1. Sign up at **https://openrouter.ai**.
2. Go to **Keys → Create Key**; copy the `sk-or-v1-…` value.
3. Free usage: models tagged `:free` (Llama 3.3 8B, Mistral 7B) cost nothing.
   Paid models need a few dollars of credit.
4. Enter the key in **Admin → AI Config** (shared default for all users), or in
   **Profile → AI Settings** (personal override, stored only in that browser).
5. Press **Test** — you should see "Connected to OpenRouter ✓".

---

## 5. First-time walkthrough

1. Serve the folder and open **`/setup.html`**.
2. **Step 1** — name + email (this is your identity; no password for users).
3. **Step 2** — height/weight/age/sex, pick a goal and activity level, press
   *Calculate My Stats* to see your BMR/TDEE/protein/calorie targets.
4. **Step 3** — paste the Neon connection string and press *Test & Connect*
   (or *Skip* to run fully offline in localStorage).
5. The app then creates the tables, your account/profile, and seeds:
   30 exercises, 6 warmup steps, and 60 foods — then lands on the dashboard.
6. Visit **Planner**, apply a template (e.g. *PPL 3-Day*), press **Save Plan**.
7. On a training day, open **Workout** → complete the guided warmup → log sets
   (checking a set starts the rest timer with beeps) → save the session.

---

## 6. Admin panel

- Open **`/admin/login.html`**.
- **First visit:** there is no password yet — the page switches to
  *Set Admin Password* mode. Choose one (min 6 chars, pick something long).
  It is hashed with SHA-256 (SubtleCrypto) and stored in the `admins` table
  (or localStorage in offline mode). **There is no password recovery** — if
  you forget it, delete the row in Neon
  (`DELETE FROM admins WHERE username='admin';`) and set a new one.
- The session lives in `sessionStorage` and ends when the tab closes.
- From the admin you can: seed/edit exercises, foods and warmup steps, build
  meal templates, write bilingual blog posts and guides, inspect users, and
  control everything about the AI (key, model, temperature, the full system
  prompt with `{{variables}}`, quick prompts, and a live test panel).

---

## 7. Security — read this before sharing the app

This is a **client-only architecture**: convenient, free, and great for
personal/small-group use — but you must understand its trust model.

**Where secrets live**

| Secret | Stored in | Visible to |
|---|---|---|
| Neon connection string | browser `localStorage` (`neon_url`) | anyone using that browser profile |
| OpenRouter key (admin default) | `app_config` table in *your* DB | anyone with DB access / any app user once loaded |
| OpenRouter key (personal) | `localStorage` | that browser only |
| Admin password | SHA-256 hash in `admins` table | hash only |

**Implications & recommendations**

1. **Everyone who uses the app shares the same database credentials.** The
   connection string in the browser grants full read/write to all tables.
   Treat this app as *trusted-users-only* (yourself, family, your gym buddies).
   Do **not** deploy it publicly as a multi-tenant product without putting a
   real backend/API in front of the database.
2. **Use a dedicated Neon project** containing only FitTrack data, so a leaked
   string can't touch anything else. Neon lets you **reset the password** from
   the dashboard at any time — do that immediately if you ever paste your
   string somewhere by mistake.
3. **OpenRouter spend limits:** set a monthly credit limit on your OpenRouter
   account so a leaked key can't run up costs; keys can also be revoked and
   recreated in seconds.
4. **Admin auth is a gate, not a vault.** It stops casual users opening the
   admin screens; it does not stop someone who already has the DB string from
   editing data directly. The hash is salted with an app constant — fine for
   this threat model, but again: trusted users only.
5. **User "login" is identity, not authentication** — anyone can type any
   email. That's by design for a personal tracker; don't store sensitive
   personal data of other people.
6. **HTTPS:** always host over HTTPS (Netlify/Vercel/Pages do this for free)
   so the connection string and API key aren't sent over plain HTTP.
7. **Backups:** Neon free tier keeps point-in-time history; you can also
   export with `pg_dump` from their console.
8. **XSS hygiene:** all user-entered text is escaped before rendering
   (`esc()` in `js/app.js`), and the markdown renderer escapes first, then
   formats. Keep that pattern if you extend the app.

---

## 8. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Blank page, console says "Failed to resolve module" | You opened via `file://`. Serve over http (see §1). |
| "No database connected" | Connect in Profile → Database, or re-run setup. The app otherwise falls back to localStorage. |
| Connection test fails | Use the **pooled** Neon string with `?sslmode=require`; check the project isn't suspended (free tier sleeps — first query wakes it, retry once). |
| CORS error talking to Neon | You're using the wrong string format. The serverless driver needs the standard `postgresql://` string; it tunnels over HTTPS automatically. |
| AI replies "No OpenRouter API key configured" | Add a key in Admin → AI Config or Profile → AI Settings. |
| AI error 402 | Out of OpenRouter credit — switch to a `:free` model in Admin → AI Config. |
| Images don't load | Unsplash source URLs occasionally rate-limit; the admin exercise editor lets you paste any direct image URL instead. |
| Rest timer has no sound | Browsers block audio until first interaction; tap anywhere once, and check the tab isn't muted. |
| Admin password forgotten | `DELETE FROM admins WHERE username='admin';` in Neon SQL editor, then revisit `/admin/login.html` to set a new one. |
| Wiped browser storage = "logged out" | Identity lives in localStorage. Re-run setup with the **same email** — your data in Neon reattaches to that account. |
| Want to start fresh | Drop all tables in Neon (or delete the project), clear site data in the browser, open `/setup.html`. |

---

## 9. Extending

- All DB access goes through `js/db.js`; add new queries there (both the SQL
  branch and the localStorage branch) and the rest of the app stays clean.
- The AI system prompt is fully editable in Admin → AI Config; new
  `{{variables}}` just need a matching field in `gatherUserContext()`
  (`js/ai.js`).
- Design tokens (colors/fonts) live in the small `tailwind.config` block at the
  top of every page — change once per page, or regenerate via the pattern in
  `_build/` if you keep it.
