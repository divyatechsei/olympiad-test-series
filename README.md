# Grade 5 IMO Quiz App — Setup Guide

> **Upgrading from an earlier version?** Run the new SQL files in order
> (`migration_002_questions.sql` if you haven't already, then
> `migration_003_grades_and_unlocks.sql`, then
> `migration_004_question_marks.sql`), then redeploy the updated code.
> These migrations automatically preserve your existing Grade 5 / IMO
> content and its marks exactly as they work today — everything new
> (other grades, other subjects) starts **locked** until you unlock it
> from Admin → Unlocks.

This is the production version of your Olympiad Prep app: real authentication
(hashed passwords, not visible in the browser), a real Postgres database via
Supabase, and server-side scoring so the answer key never reaches a student's
browser until after they submit.

Follow these steps in order. None of them require coding — it's all account
creation, copy-pasting keys, and running two commands.

---

## Step 1 — Create your Supabase project (free tier is fine)

1. Go to **supabase.com** → sign up → **New Project**.
2. Pick a name (e.g. `olympiad-prep`), set a database password (save it
   somewhere), choose a region close to your users, and click **Create**.
   Wait ~2 minutes for it to provision.
3. Once it's ready, go to **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase/schema.sql` from this project, copy its entire contents,
   paste into the SQL editor, and click **Run**. This creates the
   `students`, `admins`, and `attempts` tables.
5. **New query** again → open `supabase/migration_002_questions.sql` →
   copy, paste, **Run**. This creates the `questions` table, which is
   what makes questions editable from the admin panel instead of living
   in a static file.
6. **New query** once more → open `supabase/migration_003_grades_and_unlocks.sql`
   → copy, paste, **Run**. This adds grade/subject support and the
   unlock system, and automatically unlocks Grade 5 / IMO / Sets A–J so
   your existing content keeps working immediately.
7. **One more query** → open `supabase/migration_004_question_marks.sql`
   → copy, paste, **Run**. This moves marks-per-question onto each
   question directly (needed because Grade 6-8's Achievers section is
   worth 3 marks/question, not Grade 5's 2) and automatically backfills
   your existing Grade 5 data so nothing changes for it.
8. Go to **Project Settings → API**. You'll need two values from this page
   in Step 2:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **service_role key** (under "Project API keys" — click reveal). This
     key has full database access, so treat it like a password. It's used
     server-side only and is never sent to the browser.

---

## Step 2 — Configure your environment variables

1. In this project folder, copy `.env.local.example` to a new file named
   `.env.local`.
2. Fill in the four values:
   - `SUPABASE_URL` → the Project URL from Step 1.5
   - `SUPABASE_SERVICE_ROLE_KEY` → the service_role key from Step 1.5
   - `NEXTAUTH_SECRET` → run `openssl rand -base64 32` in a terminal
     (Mac/Linux) and paste the output, or use any long random string.
     On Windows, you can generate one at https://generate-secret.vercel.app/32
   - `NEXTAUTH_URL` → leave as `http://localhost:3000` for now; you'll
     change this when you deploy.

`.env.local` is already in `.gitignore` — it will never be committed.

---

## Step 3 — Install dependencies, load your questions, and create your admin account

```bash
npm install
npm run seed-admin
node scripts/migrate-questions.js
```

The seed script creates one admin account:
- **username:** `admin`
- **password:** `Techsei2025`

The migration script loads all 350 original questions (Sets A–J) from
`data/quiz_data.json` into your new `questions` database table. This is a
**one-time** step — from now on, questions live in the database and you
manage them from the admin panel (Admin → Questions tab): add new ones,
edit text/options/answers/explanations, attach diagrams, or delete
questions, all without touching a file or redeploying.

(You can open `scripts/seed-admin.js` and change the admin username/password
before running it, or just run it as-is and change the password later by
deleting that row in Supabase's Table Editor and re-running the script.)

---

## Admin panel — what you can do

Log in with the Admin tab. Four tabs:

- **Students** — add/remove student accounts (name, username, password)
- **Unlocks** — control what students can see, at three independent
  levels: grade, subject (within a grade), and individual test set
  (within a grade+subject). **Nothing is visible to any student until
  you unlock it here** — this is what lets you prepare a new grade's
  content ahead of time without anyone seeing it early, and lets you
  release test sets on your own schedule (e.g. one per week) instead of
  all at once. Click a grade to expand its subjects, click a subject to
  expand its individual sets (A–J), and toggle any of the three levels
  independently.
- **Questions** — pick a grade, subject, and test set, see all its
  questions, add new ones or edit existing ones. Each question has:
  text, 4 options (click the letter circle to mark the correct one),
  and solution steps (add as many lines as you want — these show up in
  the student's review screen). Optionally attach a diagram (pattern,
  angle, bar graph, etc.) — pick a type from the dropdown, edit the JSON
  on the left, and see a live preview on the right before saving.
- **Results** — every student's completion count, average, and best
  score across everything they've attempted. Click a student to see
  every individual attempt (grade, subject, set, date, score); click an
  attempt to see their full question-by-question review (their answer
  vs. the correct one, same as what they see). **Export CSV** downloads
  every attempt across all students — one row per attempt, with grade,
  subject, and per-section breakdowns — ready to drop into a
  spreadsheet for report cards or parent meetings.

---

## Adding content for other grades and subjects

The app now supports Grades 2–8 and multiple subjects (Mathematics/IMO
and Science/NSO are registered by default in `lib/catalog.js` — add more
subject codes there if you need them). Grade 5 IMO is the only one with
content in it out of the box; every other grade/subject combination
exists in the UI but is **empty and locked** until you add content and
unlock it.

**To add a new grade/subject's worth of questions:**

1. Generate (or ask me to generate) a JSON file shaped like this:
   ```json
   {
     "grade": 6,
     "subject": "IMO",
     "sets": {
       "A": [ /* questions with an explicit "marks" field each — Grade 6-8's
                Achievers section is 3 marks/question, not Grade 5's 2, so
                this isn't assumed automatically */ ],
       "B": [ ... ]
     }
   }
   ```
   (Full format documented at the top of `scripts/import-questions.js`.)
2. Import it:
   ```bash
   npm run import-questions path/to/grade6_imo.json
   ```
3. Go to **Admin → Unlocks**, and unlock Grade 6 → IMO → whichever sets
   are ready. Students won't see any of it until you do this step.

Nothing here requires a code change or redeploy — it's all data +
one admin toggle.

---

## Two ways to manage content: admin UI vs. bulk JSON import

**Use the admin panel (Questions tab)** for small, occasional changes —
fixing a typo, correcting an answer, adding a couple of questions someone
flagged as missing.

**Use bulk JSON import** for anything larger — a new grade or subject, a
big batch of new questions, or mass corrections. Generating a file and
importing it is far more reliable than hand-typing many questions into a
form, especially ones with diagrams.

```bash
npm run import-questions data/grade6_imo.json
npm run import-questions data/grade7_nso.json
```

This script is **safe to re-run** — it validates the entire file first
(and refuses to write anything if it finds a problem, so you can't end up
with a half-imported grade), then **upserts**: existing `(grade, subject,
set, question number)` combinations are updated in place, new ones are
inserted. Nothing is ever deleted by this script.

The expected file format (grade + subject + sets, documented at the top
of `scripts/import-questions.js`) is different from the original
`data/quiz_data.json`, which predates multi-grade support and is only
used by `scripts/migrate-questions.js`. If you want a new batch of
questions generated in the current format (a new grade, a new subject,
more questions for an existing set), just ask — I can generate a
correctly-formatted, pre-validated JSON file the same way I built the
original 350 questions, and you drop it in with one command. Remember to
unlock the new content in Admin → Unlocks once it's imported.

## Step 4 — Run it locally

```bash
npm run dev
```

Open **http://localhost:3000** — you'll land on the login page.

- Sign in with the **Admin** tab using `admin` / `Techsei2025`, and add
  your first few students from the admin panel.
- Sign out, sign in with the **Student** tab using credentials you just
  created, and take a test end to end to confirm everything works: timer
  counts down, submitting shows your score, review shows solutions, badges
  unlock, and the share card generates.

---

## Step 5 — Deploy it for real (Vercel, free tier)

1. Push this project to a GitHub repository (create a new repo, then
   `git init && git add . && git commit -m "initial" && git push`).
2. Go to **vercel.com** → sign up with GitHub → **Add New Project** →
   import your repo.
3. Before clicking Deploy, expand **Environment Variables** and add the
   same four values from your `.env.local` — except set `NEXTAUTH_URL` to
   your real Vercel URL (Vercel shows you this before you deploy, something
   like `https://olympiad-prep.vercel.app`; you can also add it after the
   first deploy once you know the URL, then redeploy).
4. Click **Deploy**. After it finishes, visit your live URL — you now have
   a real, publicly reachable app.
5. Run the seed script once against production too, so the live database
   has an admin account. Easiest way: temporarily point your local
   `.env.local`'s Supabase values at the same project (they already are,
   since you're using one Supabase project for both), and run
   `npm run seed-admin` locally again — it writes to the same database
   your deployed app reads from. You only need to do this once.

From here on, every `git push` to your repo automatically redeploys the
live site.

---

## What changed from the prototype, and why

| | Prototype (artifact) | This version |
|---|---|---|
| Admin password | Hardcoded in browser-visible code | Bcrypt-hashed in the database, checked server-side |
| Student passwords | Plain text in shared storage | Bcrypt-hashed, never stored in plain text |
| Correct answers | Sent to the browser with every question | Stripped from the question payload; only revealed after the server scores your submission |
| Scoring | Computed in the browser (could be tampered with) | Computed server-side from the real answer key; the client can't fake a score |
| Data storage | Claude artifact key-value store (demo-only) | Real Postgres database (Supabase) |
| Sessions | None — a page refresh logs you out | Real signed sessions (NextAuth), survive refreshes |

---

## Troubleshooting

- **Student dashboard shows "No tests are available yet"** — nothing is
  unlocked for that student. Go to Admin → Unlocks, and check all three
  levels (grade → subject → set) are toggled on for what you want them
  to see. All three are independent and default to locked.
- **"This test has no questions yet"** — you haven't run
  `node scripts/migrate-questions.js` yet, or you're looking at a set that
  genuinely has no questions in the database. Check Admin → Questions →
  pick that grade/subject/set, and see how many are listed.
- **"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"** — you haven't
  created `.env.local`, or a value is missing/misspelled. Double-check
  against `.env.local.example`.
- **Login always fails** — confirm you ran `npm run seed-admin` and that
  it printed a success message (not "already exists" pointing at a
  different password than you expect).
- **Students can't log in after being added** — passwords are case-sensitive
  and usernames are lowercased automatically; make sure you're giving
  students the exact password you typed in the admin panel.
- **Build fails on Vercel but works locally** — almost always a missing
  environment variable in the Vercel project settings. Re-check Step 5.3.
#   o l y m p i a d - t e s t - s e r i e s  
 #   o l y m p i a d - t e s t - s e r i e s  
 #   o l y m p i a d - t e s t - s e r i e s  
 