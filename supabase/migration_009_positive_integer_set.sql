
-- Migration 009: Change set_label to allow any positive integer
-- Run this in the Supabase SQL Editor AFTER migration_008_numeric_set_labels.sql.

-- migration__008 restricted set_label to the range 1-10. This migration relaxes that restriction to allow  
-- any positive integer. This is to accommodate future expansion of the question bank beyond 10 sets per grade/subject.

-- valid : '1', '2', '11', '347'
--Invalid : '0', '-5', 'abc'
alter table question drop constraint questions_set_label_check;
alter table question add constraint questions_set_label_check 
    check (set_label ~ '^[1-9][0-9]*$');

alter table attempts drop constraint if exists attempts_set_label_check;
alter table attempts add constraint attempts_set_label_check 
    check (set_label ~ '^[1-9][0-9]*$');

-- unlocked_sets and student_unlocked_sets already have no constraint on set_label, so no changes are needed there.