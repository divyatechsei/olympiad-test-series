import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getFullUnlockState, setGradeUnlocked, setSubjectUnlocked, setSetUnlocked } from '../../../../lib/unlocks';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const state = await getFullUnlockState();
  return NextResponse.json(state);
}

// Body: { level: 'grade'|'subject'|'set', grade, subject?, setLabel?, unlocked: boolean }
export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { level, grade, subject, setLabel, unlocked } = body;

  if (!grade || typeof unlocked !== 'boolean') {
    return NextResponse.json({ error: 'grade and unlocked are required.' }, { status: 400 });
  }

  if (level === 'grade') {
    await setGradeUnlocked(grade, unlocked);
  } else if (level === 'subject') {
    if (!subject) return NextResponse.json({ error: 'subject is required for level=subject.' }, { status: 400 });
    await setSubjectUnlocked(grade, subject, unlocked);
  } else if (level === 'set') {
    if (!subject || !setLabel) return NextResponse.json({ error: 'subject and setLabel are required for level=set.' }, { status: 400 });
    await setSetUnlocked(grade, subject, setLabel, unlocked);
  } else {
    return NextResponse.json({ error: 'level must be grade, subject, or set.' }, { status: 400 });
  }

  const state = await getFullUnlockState();
  return NextResponse.json(state);
}
