import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getFullUnlockState, getStudentUnlockedSets, setStudentSetUnlocked } from '../../../../lib/unlocks';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

// GET /api/admin/student-unlocks?studentId=<uuid>
// Returns both the global unlock state (so the UI can show "already
// unlocked for everyone" and grey out the toggle) and this student's
// personal overrides.
export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId query param is required.' }, { status: 400 });

  const [global, personalSets] = await Promise.all([
    getFullUnlockState(),
    getStudentUnlockedSets(studentId),
  ]);

  return NextResponse.json({ global, personalSets });
}

// Body: { studentId, grade, subject, setLabel, unlocked: boolean }
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { studentId, grade, subject, setLabel, unlocked } = body;

  if (!studentId || !grade || !subject || !setLabel || typeof unlocked !== 'boolean') {
    return NextResponse.json(
      { error: 'studentId, grade, subject, setLabel, and unlocked are all required.' },
      { status: 400 }
    );
  }

  await setStudentSetUnlocked(studentId, grade, subject, setLabel, unlocked);

  const personalSets = await getStudentUnlockedSets(studentId);
  return NextResponse.json({ personalSets });
}
