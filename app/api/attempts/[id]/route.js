import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getFullQuestions } from '../../../../lib/quizData';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: student } = await supabase.from('students').select('id').eq('username', session.user.username).single();
  if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: attempt, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
  // Ownership check: students can only review their own attempts.
  if (attempt.student_id !== student.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const questions = await getFullQuestions(attempt.grade, attempt.subject, attempt.set_label);
  return NextResponse.json({ attempt, questions });
}
