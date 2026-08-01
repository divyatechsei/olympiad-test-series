/**
 * Generic bulk question importer — UPSERTS from any JSON file, so
 * it's safe to run repeatedly as you add new grades, subjects, or
 * corrections.
 *
 * Usage:
 *   node scripts/import-questions.js data/grade6_imo.json
 *   node scripts/import-questions.js data/grade7_nso.json
 *
 * Expected JSON shape — grade and subject at the top level, then
 * questions grouped by set label:
 *
 *   {
 *     "grade": 6,
 *     "subject": "IMO",
 *     "sets": {
 *       "A": [
 *         {
 *           "qNum": 1,
 *           "section": "A",
 *           "marks": 1,
 *           "text": "...",
 *           "opts": ["...", "...", "...", "..."],
 *           "ans": "B",
 *           "steps": ["...", "..."],
 *           "imgParams": { "type": "angle", "angle": 90 }   // optional
 *         },
 *         ...
 *       ],
 *       "B": [ ... ]
 *     }
 *   }
 *
 * `marks` is required per question (not assumed) because different
 * grades use different schemes — e.g. Grade 5's Achievers section is
 * 2 marks/question, Grade 6-8's is 3 marks/question.
 *
 * `subject` must be one of the codes registered in lib/catalog.js
 * (currently IMO, NSO) — add new ones there first if needed.
 *
 * Matching is by (grade, subject, set_label, q_num): existing rows
 * are UPDATED in place, new ones INSERTED. Nothing is ever deleted
 * by this script.
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const GRADES = [2, 3, 4, 5, 6, 7, 8];
const SUBJECT_CODES = ['IMO', 'NSO'];
// Any positive non-zero integer is a valid set label — no fixed upper
// bound, so new question papers (11, 12, ...) never need this script
// edited. Mirrors lib/catalog.js's isValidSetLabel().
const SET_LABEL_PATTERN = /^[1-9][0-9]*$/;
const SECTIONS = ['A', 'B', 'C', 'D'];
const ANSWERS = ['A', 'B', 'C', 'D'];

function validateQuestion(setLabel, q) {
  const errs = [];
  if (!Number.isInteger(q.qNum) || q.qNum < 1) errs.push(`qNum must be a positive integer, got ${JSON.stringify(q.qNum)}`);
  if (!SECTIONS.includes(q.section)) errs.push(`section must be A-D, got ${JSON.stringify(q.section)}`);
  if (!Number.isInteger(q.marks) || q.marks < 1 || q.marks > 10) errs.push(`marks must be a whole number from 1-10, got ${JSON.stringify(q.marks)}`);
  if (!q.text || !String(q.text).trim()) errs.push('text is required');
  if (!Array.isArray(q.opts) || q.opts.length !== 4 || q.opts.some((o) => !String(o).trim())) errs.push('opts must be an array of exactly 4 non-empty strings');
  if (!ANSWERS.includes(q.ans)) errs.push(`ans must be A-D, got ${JSON.stringify(q.ans)}`);
  if (!Array.isArray(q.steps) || q.steps.length === 0) errs.push('steps must be a non-empty array');
  if (q.imgParams && !q.imgParams.type) errs.push('imgParams present but missing a "type" field');
  return errs;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/import-questions.js <path-to-json-file>');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  let file;
  try {
    file = require(absPath);
  } catch (e) {
    console.error(`Could not read/parse ${absPath}:`, e.message);
    process.exit(1);
  }

  const { grade, subject, sets } = file;
  const topErrors = [];
  if (!GRADES.includes(grade)) topErrors.push(`top-level "grade" must be one of ${GRADES.join(', ')}, got ${JSON.stringify(grade)}`);
  if (!SUBJECT_CODES.includes(subject)) topErrors.push(`top-level "subject" must be one of ${SUBJECT_CODES.join(', ')}, got ${JSON.stringify(subject)}. Add new subject codes to lib/catalog.js first.`);
  if (!sets || typeof sets !== 'object') topErrors.push('top-level "sets" object is required');
  if (topErrors.length) {
    console.error('❌ Problems with the file itself:\n');
    topErrors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }

  // Validate everything BEFORE writing anything.
  let allErrors = [];
  for (const [setLabel, questions] of Object.entries(sets)) {
    if (!SET_LABEL_PATTERN.test(setLabel)) { allErrors.push(`Unknown set label "${setLabel}"`); continue; }
    if (!Array.isArray(questions)) { allErrors.push(`Set ${setLabel}: expected an array of questions`); continue; }
    const seenQNums = new Set();
    questions.forEach((q, i) => {
      const errs = validateQuestion(setLabel, q);
      if (seenQNums.has(q.qNum)) errs.push(`duplicate qNum ${q.qNum} within this file`);
      seenQNums.add(q.qNum);
      errs.forEach((e) => allErrors.push(`Set ${setLabel}, item ${i} (qNum ${q.qNum}): ${e}`));
    });
  }
  if (allErrors.length) {
    console.error(`❌ Found ${allErrors.length} problem(s) — fixing these before importing:\n`);
    allErrors.slice(0, 30).forEach((e) => console.error('  -', e));
    if (allErrors.length > 30) console.error(`  ... and ${allErrors.length - 30} more`);
    process.exit(1);
  }

  const supabase = createClient(url, key);
  let inserted = 0;
  let updated = 0;

  for (const [setLabel, questions] of Object.entries(sets)) {
    for (const q of questions) {
      const { data: existing } = await supabase
        .from('questions')
        .select('id')
        .eq('grade', grade)
        .eq('subject', subject)
        .eq('set_label', setLabel)
        .eq('q_num', q.qNum)
        .single();

      const row = {
        grade,
        subject,
        set_label: setLabel,
        q_num: q.qNum,
        section: q.section,
        marks: q.marks,
        text: q.text,
        opts: q.opts,
        ans: q.ans,
        steps: q.steps,
        img_params: q.imgParams || null,
      };

      if (existing) {
        const { error } = await supabase.from('questions').update(row).eq('id', existing.id);
        if (error) { console.error(`Failed updating Set ${setLabel} Q${q.qNum}:`, error.message); process.exit(1); }
        updated++;
      } else {
        const { error } = await supabase.from('questions').insert(row);
        if (error) { console.error(`Failed inserting Set ${setLabel} Q${q.qNum}:`, error.message); process.exit(1); }
        inserted++;
      }
    }
    console.log(`Set ${setLabel}: processed ${sets[setLabel].length} question(s)`);
  }

  console.log(`\n✅ Done. Grade ${grade} ${subject}: inserted ${inserted} new, updated ${updated} existing question(s).`);
  console.log('   Remember: this content is not visible to students until you unlock it in Admin → Unlocks.');
}

main();
