/**
 * One-time migration: loads data/quiz_data.json (your original 350
 * Grade 5 IMO questions across Sets A-J) into the `questions` table,
 * tagged as grade=5, subject='IMO'.
 *
 * Run this ONCE, after running migration_002_questions.sql AND
 * migration_003_grades_and_unlocks.sql:
 *
 *   node scripts/migrate-questions.js
 *
 * Safe to re-run — it skips any (grade, subject, set_label, q_num)
 * combination that's already in the database.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const quizData = require('../data/quiz_data.json');

const GRADE = 5;
const SUBJECT = 'IMO';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: existingRows, error: fetchError } = await supabase
    .from('questions')
    .select('set_label, q_num')
    .eq('grade', GRADE)
    .eq('subject', SUBJECT);
  if (fetchError) {
    console.error('Could not read existing questions — did you run migration_002_questions.sql and migration_003_grades_and_unlocks.sql first?');
    console.error(fetchError.message);
    process.exit(1);
  }
  const existingKeys = new Set(existingRows.map((r) => `${r.set_label}:${r.q_num}`));

  let inserted = 0;
  let skipped = 0;

  for (const [setLabel, questions] of Object.entries(quizData)) {
    const rows = questions
      .filter((q) => !existingKeys.has(`${setLabel}:${q.qNum}`))
      .map((q) => ({
        grade: GRADE,
        subject: SUBJECT,
        set_label: setLabel,
        q_num: q.qNum,
        section: q.section,
        marks: q.section === 'D' ? 2 : 1,
        text: q.text,
        opts: q.opts,
        ans: q.ans,
        steps: q.steps || [],
        img_params: q.imgParams || null,
      }));

    skipped += questions.length - rows.length;
    if (rows.length === 0) continue;

    const { error: insertError } = await supabase.from('questions').insert(rows);
    if (insertError) {
      console.error(`Failed inserting Set ${setLabel}:`, insertError.message);
      process.exit(1);
    }
    inserted += rows.length;
    console.log(`Set ${setLabel}: inserted ${rows.length} question(s)`);
  }

  console.log(`\nDone. Inserted ${inserted} new question(s), skipped ${skipped} already-present question(s).`);
  console.log(`All tagged as Grade ${GRADE}, Subject ${SUBJECT}.`);
}

main();
