import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getFullQuestions } from '../../../../../lib/quizData';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: attempt, error } = await supabase
    .from('attempts')
    .select('*, students(name, username)')
    .eq('id', params.id)
    .single();

  if (error || !attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });

  const questions = await getFullQuestions(attempt.grade, attempt.subject, attempt.set_label);
  return NextResponse.json({ attempt, questions });
}
