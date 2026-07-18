import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../../../lib/supabaseAdmin';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, name, username')
    .eq('username', params.username)
    .single();
  if (studentError || !student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('student_id', student.id)
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student, attempts });
}
