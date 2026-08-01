-- ============================================================
-- Migration 008: Numeric set labels (A-J -> 1-10)
-- Run this in the Supabase SQL Editor AFTER migration_007_phone_school.sql.
--
-- Sets used to be labelled with letters (A, B, C, ... J). Going
-- forward they're labelled with numbers (1, 2, 3, ... 10) instead,
-- so more sets can keep being added without running out of letters
-- or needing another alphabet-vs-number decision later.
--
-- This does NOT touch:
--   - questions.section / attempts.section_breakdown keys (the
--     Logical Reasoning / Math Reasoning / Everyday Maths /
--     Achievers exam sections, still A-D)
--   - questions.ans / attempts.answers values (the A/B/C/D
--     multiple-choice option letters)
-- Only the *set* labels (which paper/set a question or attempt
-- belongs to) are converted.
-- ============================================================

-- --- Drop the old letter-only CHECK constraints first, so the data
-- --- update below isn't rejected mid-way through.
alter table questions drop constraint if exists questions_set_label_check;
alter table attempts drop constraint if exists attempts_set_label_check;

-- --- Convert existing data: A->1, B->2, ..., J->10 ----------------------
update questions set set_label = (
  case set_label
    when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4'
    when 'E' then '5' when 'F' then '6' when 'G' then '7' when 'H' then '8'
    when 'I' then '9' when 'J' then '10'
    else set_label
  end
);

update attempts set set_label = (
  case set_label
    when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4'
    when 'E' then '5' when 'F' then '6' when 'G' then '7' when 'H' then '8'
    when 'I' then '9' when 'J' then '10'
    else set_label
  end
);

update unlocked_sets set set_label = (
  case set_label
    when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4'
    when 'E' then '5' when 'F' then '6' when 'G' then '7' when 'H' then '8'
    when 'I' then '9' when 'J' then '10'
    else set_label
  end
);

update student_unlocked_sets set set_label = (
  case set_label
    when 'A' then '1' when 'B' then '2' when 'C' then '3' when 'D' then '4'
    when 'E' then '5' when 'F' then '6' when 'G' then '7' when 'H' then '8'
    when 'I' then '9' when 'J' then '10'
    else set_label
  end
);

-- --- Re-add CHECK constraints restricting to the new numeric labels -----
alter table questions add constraint questions_set_label_check
  check (set_label in ('1','2','3','4','5','6','7','8','9','10'));

alter table attempts add constraint attempts_set_label_check
  check (set_label in ('1','2','3','4','5','6','7','8','9','10'));

-- unlocked_sets and student_unlocked_sets never had a CHECK constraint
-- on set_label (just "text not null"), so nothing to re-add there —
-- the UPDATEs above already brought their data in line.
