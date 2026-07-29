import { getSupabaseAdmin } from './supabaseAdmin';

// A grade/subject/set is accessible to students only if all three
// levels above it (and including it) are unlocked, OR the specific
// student has a personal override for that exact set (see
// student_unlocked_sets / migration_005). Pass studentId to also
// check the personal path; omit it to check the global chain only.
//
// Self-registered accounts (migration_006) see the global chain the
// same as any other student — registering yourself is just a
// convenience for account creation, not a content gate. The
// self_registered flag is used for display (badges in the admin
// panel) only, not access control.
export async function isSetUnlocked(grade, subject, setLabel, studentId = null) {
  const supabase = getSupabaseAdmin();
  const [g, s, t] = await Promise.all([
    supabase.from('unlocked_grades').select('grade').eq('grade', grade).single(),
    supabase.from('unlocked_subjects').select('grade').eq('grade', grade).eq('subject', subject).single(),
    supabase.from('unlocked_sets').select('grade').eq('grade', grade).eq('subject', subject).eq('set_label', setLabel).single(),
  ]);
  if (g.data && s.data && t.data) return true;

  if (studentId) {
    const { data: personal } = await supabase
      .from('student_unlocked_sets')
      .select('student_id')
      .eq('student_id', studentId)
      .eq('grade', grade)
      .eq('subject', subject)
      .eq('set_label', setLabel)
      .single();
    return !!personal;
  }

  return false;
}

export async function getUnlockedGrades() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('unlocked_grades').select('grade').order('grade');
  return (data || []).map((r) => r.grade);
}

export async function getUnlockedSubjects(grade) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('unlocked_subjects').select('subject').eq('grade', grade);
  return (data || []).map((r) => r.subject);
}

export async function getUnlockedSets(grade, subject) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('unlocked_sets').select('set_label').eq('grade', grade).eq('subject', subject);
  return (data || []).map((r) => r.set_label);
}

// Full unlock map for the admin panel: which grades/subjects/sets are
// currently unlocked, in one shot.
export async function getFullUnlockState() {
  const supabase = getSupabaseAdmin();
  const [grades, subjects, sets] = await Promise.all([
    supabase.from('unlocked_grades').select('grade'),
    supabase.from('unlocked_subjects').select('grade, subject'),
    supabase.from('unlocked_sets').select('grade, subject, set_label'),
  ]);
  return {
    grades: (grades.data || []).map((r) => r.grade),
    subjects: (subjects.data || []).map((r) => `${r.grade}:${r.subject}`),
    sets: (sets.data || []).map((r) => `${r.grade}:${r.subject}:${r.set_label}`),
  };
}

export async function setGradeUnlocked(grade, unlocked) {
  const supabase = getSupabaseAdmin();
  if (unlocked) {
    await supabase.from('unlocked_grades').upsert({ grade });
  } else {
    await supabase.from('unlocked_grades').delete().eq('grade', grade);
  }
}

export async function setSubjectUnlocked(grade, subject, unlocked) {
  const supabase = getSupabaseAdmin();
  if (unlocked) {
    await supabase.from('unlocked_subjects').upsert({ grade, subject });
  } else {
    await supabase.from('unlocked_subjects').delete().eq('grade', grade).eq('subject', subject);
  }
}

export async function setSetUnlocked(grade, subject, setLabel, unlocked) {
  const supabase = getSupabaseAdmin();
  if (unlocked) {
    await supabase.from('unlocked_sets').upsert({ grade, subject, set_label: setLabel });
  } else {
    await supabase.from('unlocked_sets').delete().eq('grade', grade).eq('subject', subject).eq('set_label', setLabel);
  }
}

// ------------------------------------------------------------------
// Per-student overrides (migration_005_student_unlocks.sql). A row
// here grants one student access to one (grade, subject, set) even
// if that set isn't globally unlocked yet.
// ------------------------------------------------------------------

export async function getStudentUnlockedSets(studentId) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('student_unlocked_sets')
    .select('grade, subject, set_label')
    .eq('student_id', studentId);
  return (data || []).map((r) => ({ grade: r.grade, subject: r.subject, setLabel: r.set_label }));
}

export async function setStudentSetUnlocked(studentId, grade, subject, setLabel, unlocked) {
  const supabase = getSupabaseAdmin();
  if (unlocked) {
    await supabase
      .from('student_unlocked_sets')
      .upsert({ student_id: studentId, grade, subject, set_label: setLabel });
  } else {
    await supabase
      .from('student_unlocked_sets')
      .delete()
      .eq('student_id', studentId)
      .eq('grade', grade)
      .eq('subject', subject)
      .eq('set_label', setLabel);
  }
}
