import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/authOptions';
import { getPublicQuestions, TIME_LIMIT_SECONDS } from '../../../../../../lib/quizData';
import { isSetUnlocked } from '../../../../../../lib/unlocks';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const grade = Number(params.grade);
  const subject = params.subject?.toUpperCase();
  const setLabel = params.setLabel?.toUpperCase();

  const unlocked = await isSetUnlocked(grade, subject, setLabel, session.user.id);
  if (!unlocked) {
    return NextResponse.json({ error: 'This test is not available yet. Ask your admin to unlock it.' }, { status: 403 });
  }

  try {
    const questions = await getPublicQuestions(grade, subject, setLabel);
    if (!questions.length) {
      return NextResponse.json({ error: 'This test has no questions yet. Ask your admin to add some.' }, { status: 404 });
    }
    return NextResponse.json({ questions, timeLimitSeconds: TIME_LIMIT_SECONDS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
