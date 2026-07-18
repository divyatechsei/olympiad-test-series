-- ============================================================
-- Grade 5 IMO Quiz App — Database Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- Students table: admin-managed roster. Passwords are bcrypt-hashed,
-- never stored in plain text.
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Admins table: same pattern as students, kept separate so admin
-- accounts are never mixed into the student roster or student-facing
-- queries by accident.
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Quiz attempts: one row per completed test. Answers are stored so
-- the review screen can be regenerated later, but the correct-answer
-- key itself lives only in the server-side question data file, never
-- in a column here — the score is computed once, server-side, at
-- submission time and stored as the result of that computation.
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  set_label text not null check (set_label in ('A','B','C','D','E','F','G','H','I','J')),
  answers jsonb not null,              -- { "1": "A", "2": "C", ... }
  marks int not null,
  max_marks int not null,
  time_bonus int not null,
  final_score int not null,
  time_taken_seconds int not null,
  time_remaining_seconds int not null,
  section_breakdown jsonb not null,    -- { "A": {"correct":8,"total":10}, ... }
  submitted_at timestamptz not null default now()
);

create index if not exists idx_attempts_student on attempts(student_id);
create index if not exists idx_attempts_set on attempts(set_label);

-- Row Level Security: the app talks to Supabase using the service-role
-- key from server-side API routes only (never from the browser), so
-- these tables don't need RLS policies for the app to function — but
-- we enable RLS and add a default-deny posture as defense in depth,
-- in case the anon key is ever accidentally exposed client-side.
alter table students enable row level security;
alter table admins enable row level security;
alter table attempts enable row level security;

-- No policies are created, which means: with RLS on and no policies,
-- all access via the anon/public key is denied by default. Only the
-- service_role key (used server-side, kept in env vars, never shipped
-- to the browser) bypasses RLS.
