import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../../../../lib/supabaseAdmin';
import { computeResult, getFullQuestions, TIME_LIMIT_SECONDS } from '../../../../../../../lib/quizData';
import { isSetUnlocked } from '../../../../../../../lib/unlocks';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const grade = Number(params.grade);
  const subject = params.subject?.toUpperCase();
  const setLabel = params.setLabel?.toUpperCase();

  // Re-check on submit too, not just on fetch — an admin could lock a
  // test mid-attempt, or a student could have an old tab open.
  const unlocked = await isSetUnlocked(grade, subject, setLabel);
  if (!unlocked) {
    return NextResponse.json({ error: 'This test is no longer available.' }, { status: 403 });
  }

  const body = await request.json();
  const answers = body.answers || {};
  const timeRemaining = Math.max(0, Math.min(TIME_LIMIT_SECONDS, Number(body.timeRemaining) || 0));
  const timeTaken = TIME_LIMIT_SECONDS - timeRemaining;

  const scored = await computeResult(grade, subject, setLabel, answers, timeRemaining, timeTaken);

  const supabase = getSupabaseAdmin();
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('username', session.user.username)
    .single();
  if (studentError || !student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: attempt, error: insertError } = await supabase
    .from('attempts')
    .insert({
      student_id: student.id,
      grade,
      subject,
      set_label: setLabel,
      answers,
      marks: scored.marks,
      max_marks: scored.maxMarks,
      time_bonus: scored.timeBonus,
      final_score: scored.finalScore,
      time_taken_seconds: timeTaken,
      time_remaining_seconds: timeRemaining,
      section_breakdown: scored.sectionBreakdown,
    })
    .select('*')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const fullQuestions = await getFullQuestions(grade, subject, setLabel);
  return NextResponse.json({ attempt, questions: fullQuestions });
}
