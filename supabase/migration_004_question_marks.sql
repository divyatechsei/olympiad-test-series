-- ============================================================
-- Migration 004: Per-question marks
-- Run this in the Supabase SQL Editor AFTER migration_003.
--
-- Why: marks-per-question used to be derived from a hardcoded
-- section lookup (A/B/C = 1 mark, D = 2 marks) shared across every
-- grade. That breaks for grades whose Achievers section is worth a
-- different amount — Grade 6-8 use 3 marks for Section D, not 2.
-- Storing marks directly on each question fixes this for good and
-- lets any future grade/subject use whatever marks scheme it needs.
-- ============================================================

alter table questions add column if not exists marks int not null default 1;

-- Backfill existing rows using the old hardcoded rule, so current
-- Grade 5 IMO data (and its live scoring) is unaffected by this
-- migration: Sections A/B/C stay at 1 mark, Section D becomes 2.
-- Scoped explicitly to Grade 5 IMO (rather than "any section D
-- row") so this is safe to run even if other grades' data with a
-- different marks scheme already exists by the time this runs.
update questions
set marks = 2
where section = 'D' and marks = 1 and grade = 5 and subject = 'IMO';

alter table questions add constraint questions_marks_positive check (marks > 0);
