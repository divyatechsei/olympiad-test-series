import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../../../lib/authOptions';
import { GRADES, SUBJECTS, SET_LABELS } from '../../../../../lib/catalog';
import { isSetUnlocked } from '../../../../../lib/unlocks';
import QuizClient from './QuizClient';

export default async function QuizPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role !== 'student') redirect('/admin');

  const grade = Number(params.grade);
  const subject = params.subject?.toUpperCase();
  const setLabel = params.setLabel?.toUpperCase();

  // Each of these used to redirect straight back to /dashboard with no
  // explanation, which looks identical to "the Start button did nothing."
  // Now each failure carries a reason so the dashboard can show exactly
  // what went wrong instead of silently bouncing the student back.
  if (!GRADES.includes(grade)) redirect('/dashboard?blocked=invalid_grade');
  if (!SUBJECTS.some((s) => s.code === subject)) redirect('/dashboard?blocked=invalid_subject');
  if (!SET_LABELS.includes(setLabel)) redirect('/dashboard?blocked=invalid_set');

  let unlocked;
  try {
    unlocked = await isSetUnlocked(grade, subject, setLabel, session.user.id);
  } catch (e) {
    // A thrown error here usually means the unlock tables don't exist yet
    // (migration_003 not run) or the Supabase connection itself is broken —
    // surface that distinctly rather than treating it the same as "locked."
    redirect('/dashboard?blocked=unlock_check_failed');
  }
  if (!unlocked) redirect(`/dashboard?blocked=locked&grade=${grade}&subject=${subject}&set=${setLabel}`);

  return <QuizClient grade={grade} subject={subject} setLabel={setLabel} />;
}
