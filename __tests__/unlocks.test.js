const { makeSupabaseClient, makeChain } = require('./helpers/mockSupabase');

jest.mock('../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: jest.fn(),
}));

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const {
  isSetUnlocked,
  getUnlockedGrades,
  getUnlockedSubjects,
  getUnlockedSets,
  getFullUnlockState,
  setGradeUnlocked,
  setSubjectUnlocked,
  setSetUnlocked,
  getStudentUnlockedSets,
  setStudentSetUnlocked,
} = require('../lib/unlocks');

describe('isSetUnlocked - global chain', () => {
  it('is unlocked when grade, subject, and set are all globally unlocked', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: { grade: 5 }, error: null },
      unlocked_subjects: { data: { grade: 5 }, error: null },
      unlocked_sets: { data: { grade: 5 }, error: null },
    }));
    await expect(isSetUnlocked(5, 'IMO', 'A')).resolves.toBe(true);
  });

  it('is locked when the grade is not unlocked, even if subject and set are', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: null, error: null },
      unlocked_subjects: { data: { grade: 5 }, error: null },
      unlocked_sets: { data: { grade: 5 }, error: null },
    }));
    await expect(isSetUnlocked(5, 'IMO', 'A')).resolves.toBe(false);
  });

  it('is locked when the subject is not unlocked', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: { grade: 5 }, error: null },
      unlocked_subjects: { data: null, error: null },
      unlocked_sets: { data: { grade: 5 }, error: null },
    }));
    await expect(isSetUnlocked(5, 'IMO', 'A')).resolves.toBe(false);
  });

  it('is locked when the specific set is not unlocked', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: { grade: 5 }, error: null },
      unlocked_subjects: { data: { grade: 5 }, error: null },
      unlocked_sets: { data: null, error: null },
    }));
    await expect(isSetUnlocked(5, 'IMO', 'A')).resolves.toBe(false);
  });
});

describe('isSetUnlocked - per-student override', () => {
  it('does not check the personal table when no studentId is given', async () => {
    const client = makeSupabaseClient({
      unlocked_grades: { data: null, error: null },
      unlocked_subjects: { data: null, error: null },
      unlocked_sets: { data: null, error: null },
    });
    getSupabaseAdmin.mockReturnValue(client);
    await isSetUnlocked(5, 'IMO', 'A');
    expect(client.from).not.toHaveBeenCalledWith('student_unlocked_sets');
  });

  it('is unlocked via personal override even when globally locked', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: null, error: null },
      unlocked_subjects: { data: null, error: null },
      unlocked_sets: { data: null, error: null },
      student_unlocked_sets: { data: { student_id: 'stu-1' }, error: null },
    }));
    await expect(isSetUnlocked(5, 'IMO', 'A', 'stu-1')).resolves.toBe(true);
  });

  it('stays locked when a studentId is given but has no personal override', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: null, error: null },
      unlocked_subjects: { data: null, error: null },
      unlocked_sets: { data: null, error: null },
      student_unlocked_sets: { data: null, error: null },
    }));
    await expect(isSetUnlocked(5, 'IMO', 'A', 'stu-1')).resolves.toBe(false);
  });

  it('global unlock short-circuits before the personal table is even consulted', async () => {
    const client = makeSupabaseClient({
      unlocked_grades: { data: { grade: 5 }, error: null },
      unlocked_subjects: { data: { grade: 5 }, error: null },
      unlocked_sets: { data: { grade: 5 }, error: null },
    });
    getSupabaseAdmin.mockReturnValue(client);
    await expect(isSetUnlocked(5, 'IMO', 'A', 'stu-1')).resolves.toBe(true);
    expect(client.from).not.toHaveBeenCalledWith('student_unlocked_sets');
  });
});

describe('getUnlockedGrades / getUnlockedSubjects / getUnlockedSets', () => {
  it('maps rows to a flat list of grade numbers', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: [{ grade: 2 }, { grade: 3 }], error: null },
    }));
    await expect(getUnlockedGrades()).resolves.toEqual([2, 3]);
  });

  it('returns an empty array when data is null', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: null, error: null },
    }));
    await expect(getUnlockedGrades()).resolves.toEqual([]);
  });

  it('maps unlocked subjects to a flat list of subject codes', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_subjects: { data: [{ subject: 'IMO' }, { subject: 'NSO' }], error: null },
    }));
    await expect(getUnlockedSubjects(5)).resolves.toEqual(['IMO', 'NSO']);
  });

  it('maps unlocked sets to a flat list of set labels', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_sets: { data: [{ set_label: 'A' }, { set_label: 'B' }], error: null },
    }));
    await expect(getUnlockedSets(5, 'IMO')).resolves.toEqual(['A', 'B']);
  });

  it('returns an empty array for unlocked sets when data is null', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_sets: { data: null, error: null },
    }));
    await expect(getUnlockedSets(5, 'IMO')).resolves.toEqual([]);
  });
});

describe('getFullUnlockState', () => {
  it('combines grades, subjects, and sets into prefixed string lists', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: [{ grade: 5 }], error: null },
      unlocked_subjects: { data: [{ grade: 5, subject: 'IMO' }], error: null },
      unlocked_sets: { data: [{ grade: 5, subject: 'IMO', set_label: 'A' }], error: null },
    }));

    await expect(getFullUnlockState()).resolves.toEqual({
      grades: [5],
      subjects: ['5:IMO'],
      sets: ['5:IMO:A'],
    });
  });

  it('degrades gracefully to empty lists when every table is empty', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: [], error: null },
      unlocked_subjects: { data: [], error: null },
      unlocked_sets: { data: [], error: null },
    }));

    await expect(getFullUnlockState()).resolves.toEqual({ grades: [], subjects: [], sets: [] });
  });

  it('degrades gracefully to empty lists when every table returns null data', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      unlocked_grades: { data: null, error: null },
      unlocked_subjects: { data: null, error: null },
      unlocked_sets: { data: null, error: null },
    }));

    await expect(getFullUnlockState()).resolves.toEqual({ grades: [], subjects: [], sets: [] });
  });
});

describe('setGradeUnlocked', () => {
  it('upserts the grade when unlocking', async () => {
    const chain = makeChain({ data: null, error: null });
    const from = jest.fn(() => chain);
    getSupabaseAdmin.mockReturnValue({ from });

    await setGradeUnlocked(5, true);

    expect(from).toHaveBeenCalledWith('unlocked_grades');
    expect(chain.upsert).toHaveBeenCalledWith({ grade: 5 });
    expect(chain.delete).not.toHaveBeenCalled();
  });

  it('deletes the grade row when locking', async () => {
    const chain = makeChain({ data: null, error: null });
    const from = jest.fn(() => chain);
    getSupabaseAdmin.mockReturnValue({ from });

    await setGradeUnlocked(5, false);

    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('grade', 5);
    expect(chain.upsert).not.toHaveBeenCalled();
  });
});

describe('setSubjectUnlocked', () => {
  it('upserts grade+subject when unlocking', async () => {
    const chain = makeChain({ data: null, error: null });
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) });

    await setSubjectUnlocked(5, 'IMO', true);
    expect(chain.upsert).toHaveBeenCalledWith({ grade: 5, subject: 'IMO' });
  });

  it('deletes by grade+subject when locking', async () => {
    const chain = makeChain({ data: null, error: null });
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) });

    await setSubjectUnlocked(5, 'IMO', false);
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('grade', 5);
    expect(chain.eq).toHaveBeenCalledWith('subject', 'IMO');
  });
});

describe('setSetUnlocked', () => {
  it('upserts grade+subject+set_label when unlocking', async () => {
    const chain = makeChain({ data: null, error: null });
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) });

    await setSetUnlocked(5, 'IMO', 'A', true);
    expect(chain.upsert).toHaveBeenCalledWith({ grade: 5, subject: 'IMO', set_label: 'A' });
  });

  it('deletes by grade+subject+set_label when locking', async () => {
    const chain = makeChain({ data: null, error: null });
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) });

    await setSetUnlocked(5, 'IMO', 'A', false);
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('grade', 5);
    expect(chain.eq).toHaveBeenCalledWith('subject', 'IMO');
    expect(chain.eq).toHaveBeenCalledWith('set_label', 'A');
  });
});

describe('getStudentUnlockedSets', () => {
  it('maps rows to camelCase setLabel objects', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      student_unlocked_sets: {
        data: [{ grade: 5, subject: 'IMO', set_label: 'A' }, { grade: 6, subject: 'NSO', set_label: 'C' }],
        error: null,
      },
    }));

    await expect(getStudentUnlockedSets('stu-1')).resolves.toEqual([
      { grade: 5, subject: 'IMO', setLabel: 'A' },
      { grade: 6, subject: 'NSO', setLabel: 'C' },
    ]);
  });

  it('returns an empty array when the student has no overrides', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      student_unlocked_sets: { data: null, error: null },
    }));
    await expect(getStudentUnlockedSets('stu-1')).resolves.toEqual([]);
  });
});

describe('setStudentSetUnlocked', () => {
  it('upserts a personal override when unlocking', async () => {
    const chain = makeChain({ data: null, error: null });
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) });

    await setStudentSetUnlocked('stu-1', 5, 'IMO', 'A', true);
    expect(chain.upsert).toHaveBeenCalledWith({
      student_id: 'stu-1', grade: 5, subject: 'IMO', set_label: 'A',
    });
  });

  it('deletes the personal override by all four keys when locking', async () => {
    const chain = makeChain({ data: null, error: null });
    getSupabaseAdmin.mockReturnValue({ from: jest.fn(() => chain) });

    await setStudentSetUnlocked('stu-1', 5, 'IMO', 'A', false);
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('student_id', 'stu-1');
    expect(chain.eq).toHaveBeenCalledWith('grade', 5);
    expect(chain.eq).toHaveBeenCalledWith('subject', 'IMO');
    expect(chain.eq).toHaveBeenCalledWith('set_label', 'A');
  });
});
