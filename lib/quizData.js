import { getSupabaseAdmin } from './supabaseAdmin';

// Section names are still used for display (e.g. "Section B — Mathematical
// Reasoning") but marks are no longer derived from this — they're read
// per-question from the database, since different grades use different
// marks schemes (Grade 5's Achievers section is 2 marks/question, Grade
// 6-8's is 3 marks/question).
const SECTION_NAMES = {
  A: 'Logical Reasoning',
  B: 'Mathematical Reasoning',
  C: 'Everyday Mathematics',
  D: 'Achievers Section',
};

export const TIME_LIMIT_SECONDS = 60 * 60;

function rowToQuestion(row) {
  return {
    id: row.id,
    grade: row.grade,
    subject: row.subject,
    setLabel: row.set_label,
    qNum: row.q_num,
    section: row.section,
    marks: row.marks,
    text: row.text,
    opts: row.opts,
    ans: row.ans,
    steps: row.steps,
    imgParams: row.img_params || undefined,
  };
}

// Full question set including the answer key and solution steps.
// Server-side use only — never pass the result of this function
// directly into page/component props that get serialized to the
// client, or the answers leak.
export async function getFullQuestions(grade, subject, setLabel) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('grade', grade)
    .eq('subject', subject)
    .eq('set_label', setLabel)
    .order('q_num', { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(rowToQuestion);
}

// Client-safe question set: `ans` and `steps` removed. `marks` is kept
// (needed to show "2 marks" on-screen) — it's not sensitive, unlike the
// answer key. This is what the quiz-taking screen receives.
export async function getPublicQuestions(grade, subject, setLabel) {
  const full = await getFullQuestions(grade, subject, setLabel);
  return full.map(({ ans, steps, ...rest }) => rest);
}

export async function computeResult(grade, subject, setLabel, answers, timeRemaining, timeTaken) {
  const questions = await getFullQuestions(grade, subject, setLabel);
  if (!questions.length) throw new Error(`No questions found for grade ${grade} ${subject} set ${setLabel}`);

  let marks = 0;
  let maxMarks = 0;
  const sectionBreakdown = { A: { correct: 0, total: 0 }, B: { correct: 0, total: 0 }, C: { correct: 0, total: 0 }, D: { correct: 0, total: 0 } };

  questions.forEach((q) => {
    maxMarks += q.marks;
    sectionBreakdown[q.section].total += 1;
    if (answers[String(q.qNum)] === q.ans) {
      marks += q.marks;
      sectionBreakdown[q.section].correct += 1;
    }
  });

  const timeBonus = Math.round(10 * (timeRemaining / TIME_LIMIT_SECONDS));
  const finalScore = marks + timeBonus;

  return { marks, maxMarks, timeBonus, finalScore, sectionBreakdown };
}

export { SECTION_NAMES };
