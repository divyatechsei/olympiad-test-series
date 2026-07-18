import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/authOptions';
import { getUnlockedGrades, getUnlockedSubjects, getUnlockedSets } from '../../../lib/unlocks';
import { subjectName } from '../../../lib/catalog';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const grades = await getUnlockedGrades();
  const catalog = [];
  for (const grade of grades) {
    const subjects = await getUnlockedSubjects(grade);
    const subjectEntries = [];
    for (const subject of subjects) {
      const sets = await getUnlockedSets(grade, subject);
      if (sets.length > 0) {
        subjectEntries.push({ code: subject, name: subjectName(subject), sets: sets.sort() });
      }
    }
    if (subjectEntries.length > 0) {
      catalog.push({ grade, subjects: subjectEntries });
    }
  }

  return NextResponse.json({ catalog });
}
