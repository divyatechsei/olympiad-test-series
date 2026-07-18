-- ============================================================
-- Migration 003: Multi-grade / multi-subject + unlock system
-- Run this in the Supabase SQL Editor AFTER migration_002_questions.sql.
-- ============================================================

-- --- Add grade/subject to questions -----------------------------------
-- subject is free text (not an enum) so you can add new subjects
-- (IMO, NSO, IEO, ...) later without another migration.
alter table questions add column if not exists grade int not null default 5;
alter table questions add column if not exists subject text not null default 'IMO';

-- The old (set_label, q_num) uniqueness isn't enough once multiple
-- grades/subjects exist — replace it with a grade+subject-aware one.
-- Both drops make this block safe to run more than once: Postgres has
-- no "ADD CONSTRAINT IF NOT EXISTS", so we drop-then-add instead.
alter table questions drop constraint if exists questions_set_label_q_num_key;
alter table questions drop constraint if exists questions_grade_subject_set_qnum_key;
alter table questions add constraint questions_grade_subject_set_qnum_key
  unique (grade, subject, set_label, q_num);

create index if not exists idx_questions_grade_subject on questions(grade, subject);

-- --- Add grade/subject to attempts -------------------------------------
alter table attempts add column if not exists grade int not null default 5;
alter table attempts add column if not exists subject text not null default 'IMO';

create index if not exists idx_attempts_grade_subject on attempts(grade, subject);

-- --- Unlock system -------------------------------------------------------
-- Three levels, checked from broad to narrow: a grade must be unlocked
-- for its subjects to matter, a (grade, subject) must be unlocked for
-- its sets to matter. Nothing is visible to students by default —
-- the admin opts things in.

create table if not exists unlocked_grades (
  grade int primary key,
  unlocked_at timestamptz not null default now()
);

create table if not exists unlocked_subjects (
  grade int not null,
  subject text not null,
  unlocked_at timestamptz not null default now(),
  primary key (grade, subject)
);

create table if not exists unlocked_sets (
  grade int not null,
  subject text not null,
  set_label text not null,
  unlocked_at timestamptz not null default now(),
  primary key (grade, subject, set_label)
);

alter table unlocked_grades enable row level security;
alter table unlocked_subjects enable row level security;
alter table unlocked_sets enable row level security;
-- No policies — service_role key only, same default-deny posture as
-- the rest of the schema.

-- --- Unlock Grade 5 / IMO / Sets A-J by default -------------------------
-- so your existing live content keeps working for students exactly as
-- it does today, with no manual step required after this migration.
insert into unlocked_grades (grade) values (5) on conflict do nothing;
insert into unlocked_subjects (grade, subject) values (5, 'IMO') on conflict do nothing;
insert into unlocked_sets (grade, subject, set_label)
  select 5, 'IMO', s from unnest(array['A','B','C','D','E','F','G','H','I','J']) as s
  on conflict do nothing;
