-- ============================================================
-- Migration 006: Self-service student registration
-- Run this in the Supabase SQL Editor AFTER migration_005_student_unlocks.sql.
--
-- Adds a `self_registered` flag to students. Accounts created by the
-- admin (Admin -> Students tab) keep self_registered = false and see
-- the normal mix of global unlocks + personal overrides, exactly as
-- today. Accounts created through the public /register page get
-- self_registered = true, which means the global unlock chain
-- (unlocked_grades / unlocked_subjects / unlocked_sets) is IGNORED for
-- them — they see nothing until an admin explicitly grants them
-- access, test-by-test, in Admin -> Student Access.
-- ============================================================

alter table students add column if not exists self_registered boolean not null default false;

create index if not exists idx_students_self_registered on students(self_registered);
