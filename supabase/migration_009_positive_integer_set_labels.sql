-- ============================================================
-- Migration 009: set_label = any positive non-zero integer
-- Run this in the Supabase SQL Editor AFTER migration_008_numeric_set_labels.sql.
--
-- migration_008 restricted set_label to a fixed list ('1'..'10').
-- That means every time a new set (11, 12, 13, ...) is added, this
-- constraint would need editing again. This migration replaces the
-- fixed list with an open-ended rule instead: set_label must be a
-- string of digits, no leading zero, and not "0" — i.e. any positive
-- non-zero integer, with no upper bound.
--
-- Valid:   '1', '2', '11', '347'
-- Invalid: '0', '01', '-1', 'A', '', '3.5'
-- ============================================================

alter table questions drop constraint if exists questions_set_label_check;
alter table questions add constraint questions_set_label_check
  check (set_label ~ '^[1-9][0-9]*$');

alter table attempts drop constraint if exists attempts_set_label_check;
alter table attempts add constraint attempts_set_label_check
  check (set_label ~ '^[1-9][0-9]*$');

-- unlocked_sets and student_unlocked_sets were never constrained to
-- the fixed list (just "text not null"), so there's nothing to
-- loosen there — they already accept any set_label value.
