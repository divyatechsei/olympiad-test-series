import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/authOptions';
import { getUnlockedGrades, getUnlockedSubjects, getUnlockedSets, getStudentUnlockedSets } from '../../../lib/unlocks';
import { subjectName } from '../../../lib/catalog';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [globalGrades, personalSets] = await Promise.all([
    getUnlockedGrades(),
    getStudentUnlockedSets(session.user.id),
  ]);

  const grades = [...new Set([...globalGrades, ...personalSets.map((p) => p.grade)])].sort((a, b) => a - b);

  const catalog = [];
  for (const grade of grades) {
    const globalSubjects = await getUnlockedSubjects(grade);
    const personalForGrade = personalSets.filter((p) => p.grade === grade);
    const subjects = [...new Set([...globalSubjects, ...personalForGrade.map((p) => p.subject)])];

    const subjectEntries = [];
    for (const subject of subjects) {
      const globalSets = globalSubjects.includes(subject) ? await getUnlockedSets(grade, subject) : [];
      const personalForSubject = personalForGrade.filter((p) => p.subject === subject).map((p) => p.setLabel);
      const sets = [...new Set([...globalSets, ...personalForSubject])];
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
