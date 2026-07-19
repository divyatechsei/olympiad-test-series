-- ============================================================
-- Migration 005: Per-student unlocks
-- Run this in the Supabase SQL Editor AFTER migration_003_grades_and_unlocks.sql.
--
-- This does NOT replace the existing global unlock system
-- (unlocked_grades / unlocked_subjects / unlocked_sets). It adds a
-- second, independent path: a specific student can be granted access
-- to a specific (grade, subject, set) even if that set isn't globally
-- unlocked yet. A set is visible to a student if EITHER the global
-- unlock chain is on, OR they have a personal override row here.
-- ============================================================

create table if not exists student_unlocked_sets (
  student_id uuid not null references students(id) on delete cascade,
  grade int not null,
  subject text not null,
  set_label text not null,
  unlocked_at timestamptz not null default now(),
  primary key (student_id, grade, subject, set_label)
);

create index if not exists idx_student_unlocked_sets_student on student_unlocked_sets(student_id);

alter table student_unlocked_sets enable row level security;
-- No policies — service_role key only, same default-deny posture as
-- the rest of the schema.
