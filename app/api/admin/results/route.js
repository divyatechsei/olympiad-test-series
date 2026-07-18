import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, username, name');
  if (studentsError) return NextResponse.json({ error: studentsError.message }, { status: 500 });

  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('student_id, set_label, marks, max_marks, final_score, submitted_at');
  if (attemptsError) return NextResponse.json({ error: attemptsError.message }, { status: 500 });

  const byStudent = students.map((s) => ({
    ...s,
    attempts: attempts.filter((a) => a.student_id === s.id),
  }));

  return NextResponse.json({ students: byStudent });
}
