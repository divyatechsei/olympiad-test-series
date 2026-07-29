const { makeSupabaseClient } = require('./helpers/mockSupabase');

jest.mock('../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: jest.fn(),
}));

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const {
  getFullQuestions,
  getPublicQuestions,
  computeResult,
  SECTION_NAMES,
  TIME_LIMIT_SECONDS,
} = require('../lib/quizData');

const SAMPLE_ROWS = [
  {
    id: 'q1', grade: 5, subject: 'IMO', set_label: 'A', q_num: 1, section: 'A',
    marks: 1, text: 'Q1?', opts: ['1', '2', '3', '4'], ans: 'A', steps: ['step1'], img_params: null,
  },
  {
    id: 'q2', grade: 5, subject: 'IMO', set_label: 'A', q_num: 2, section: 'B',
    marks: 2, text: 'Q2?', opts: ['1', '2', '3', '4'], ans: 'B', steps: ['step2'],
    img_params: { type: 'angle', angle: 90 },
  },
  {
    id: 'q3', grade: 5, subject: 'IMO', set_label: 'A', q_num: 3, section: 'D',
    marks: 3, text: 'Q3?', opts: ['1', '2', '3', '4'], ans: 'C', steps: ['step3'], img_params: null,
  },
];

function mockQuestionsTable(result) {
  getSupabaseAdmin.mockReturnValue(makeSupabaseClient({ questions: result }));
}

describe('quizData.TIME_LIMIT_SECONDS / SECTION_NAMES', () => {
  it('time limit is one hour', () => {
    expect(TIME_LIMIT_SECONDS).toBe(3600);
  });

  it('every section A-D has a display name', () => {
    expect(Object.keys(SECTION_NAMES).sort()).toEqual(['A', 'B', 'C', 'D']);
    Object.values(SECTION_NAMES).forEach((name) => expect(typeof name).toBe('string'));
  });
});

describe('getFullQuestions', () => {
  it('maps snake_case DB rows to camelCase question objects', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const questions = await getFullQuestions(5, 'IMO', 'A');

    expect(questions).toHaveLength(3);
    expect(questions[0]).toEqual({
      id: 'q1', grade: 5, subject: 'IMO', setLabel: 'A', qNum: 1, section: 'A',
      marks: 1, text: 'Q1?', opts: ['1', '2', '3', '4'], ans: 'A', steps: ['step1'], imgParams: undefined,
    });
  });

  it('keeps img_params as imgParams when present', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const questions = await getFullQuestions(5, 'IMO', 'A');
    expect(questions[1].imgParams).toEqual({ type: 'angle', angle: 90 });
  });

  it('throws with the Supabase error message when the query fails', async () => {
    mockQuestionsTable({ data: null, error: { message: 'connection refused' } });
    await expect(getFullQuestions(5, 'IMO', 'A')).rejects.toThrow('connection refused');
  });

  it('returns an empty array when no rows match', async () => {
    mockQuestionsTable({ data: [], error: null });
    const questions = await getFullQuestions(5, 'IMO', 'Z');
    expect(questions).toEqual([]);
  });
});

describe('getPublicQuestions', () => {
  it('strips the answer key and solution steps from every question', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const questions = await getPublicQuestions(5, 'IMO', 'A');

    expect(questions).toHaveLength(3);
    questions.forEach((q) => {
      expect(q).not.toHaveProperty('ans');
      expect(q).not.toHaveProperty('steps');
    });
  });

  it('still exposes marks, since that is shown on-screen', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const questions = await getPublicQuestions(5, 'IMO', 'A');
    expect(questions.map((q) => q.marks)).toEqual([1, 2, 3]);
  });
});

describe('computeResult', () => {
  it('throws when there are no questions for the requested set', async () => {
    mockQuestionsTable({ data: [], error: null });
    await expect(
      computeResult(5, 'IMO', 'Z', {}, 1800, 1800)
    ).rejects.toThrow('No questions found for grade 5 IMO set Z');
  });

  it('scores a fully correct attempt at full marks', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const answers = { 1: 'A', 2: 'B', 3: 'C' };
    const result = await computeResult(5, 'IMO', 'A', answers, 1800, 1800);

    expect(result.marks).toBe(6); // 1 + 2 + 3
    expect(result.maxMarks).toBe(6);
  });

  it('scores partial credit for partially correct answers', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const answers = { 1: 'A', 2: 'X', 3: 'X' }; // only Q1 correct
    const result = await computeResult(5, 'IMO', 'A', answers, 1800, 1800);

    expect(result.marks).toBe(1);
    expect(result.maxMarks).toBe(6);
  });

  it('scores zero for an entirely empty answer set', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const result = await computeResult(5, 'IMO', 'A', {}, 1800, 1800);
    expect(result.marks).toBe(0);
    expect(result.maxMarks).toBe(6);
  });

  it('builds a per-section correct/total breakdown', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const answers = { 1: 'A', 2: 'B', 3: 'X' };
    const result = await computeResult(5, 'IMO', 'A', answers, 1800, 1800);

    expect(result.sectionBreakdown).toEqual({
      A: { correct: 1, total: 1 },
      B: { correct: 1, total: 1 },
      C: { correct: 0, total: 0 },
      D: { correct: 0, total: 1 },
    });
  });

  it('awards the maximum time bonus (10) when the full time remains', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const result = await computeResult(5, 'IMO', 'A', {}, TIME_LIMIT_SECONDS, 0);
    expect(result.timeBonus).toBe(10);
  });

  it('awards no time bonus when no time remains', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const result = await computeResult(5, 'IMO', 'A', {}, 0, TIME_LIMIT_SECONDS);
    expect(result.timeBonus).toBe(0);
  });

  it('rounds a partial time bonus to the nearest whole number', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    // half the time remaining -> 10 * 0.5 = 5 exactly
    const result = await computeResult(5, 'IMO', 'A', {}, TIME_LIMIT_SECONDS / 2, TIME_LIMIT_SECONDS / 2);
    expect(result.timeBonus).toBe(5);
  });

  it('finalScore is marks plus timeBonus', async () => {
    mockQuestionsTable({ data: SAMPLE_ROWS, error: null });
    const answers = { 1: 'A', 2: 'B', 3: 'C' }; // 6 marks
    const result = await computeResult(5, 'IMO', 'A', answers, TIME_LIMIT_SECONDS, 0); // +10 bonus
    expect(result.finalScore).toBe(16);
  });
});
