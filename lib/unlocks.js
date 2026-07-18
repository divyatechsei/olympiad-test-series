import { getSupabaseAdmin } from './supabaseAdmin';

// A grade/subject/set is accessible to students only if all three
// levels above it (and including it) are unlocked. This function
// checks the specific set; the dashboard-listing functions below
// check broader levels for building menus.
export async function isSetUnlocked(grade, subject, setLabel) {
  const supabase = getSupabaseAdmin();
  const [g, s, t] = await Promise.all([
    supabase.from('unlocked_grades').select('grade').eq('grade', grade).single(),
    supabase.from('unlocked_subjects').select('grade').eq('grade', grade).eq('subject', subject).single(),
    supabase.from('unlocked_sets').select('grade').eq('grade', grade).eq('subject', subject).eq('set_label', setLabel).single(),
  ]);
  return !!(g.data && s.data && t.data);
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
