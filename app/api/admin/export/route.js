import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

function csvEscape(value) {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('*, students(name, username)')
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = [
    'Student Name', 'Username', 'Grade', 'Subject', 'Test Set', 'Marks', 'Max Marks', 'Percentage',
    'Time Bonus', 'Final Score', 'Time Taken', 'Section A', 'Section B', 'Section C', 'Section D',
    'Submitted At',
  ];

  const rows = attempts.map((a) => {
    const pct = Math.round((a.marks / a.max_marks) * 100);
    const sb = a.section_breakdown || {};
    const secStr = (s) => (sb[s] ? `${sb[s].correct}/${sb[s].total}` : '');
    return [
      a.students?.name || '', a.students?.username || '', a.grade, a.subject, a.set_label,
      a.marks, a.max_marks, `${pct}%`,
      a.time_bonus, a.final_score, formatDuration(a.time_taken_seconds),
      secStr('A'), secStr('B'), secStr('C'), secStr('D'),
      new Date(a.submitted_at).toLocaleString('en-IN'),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="olympiad_prep_results_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
