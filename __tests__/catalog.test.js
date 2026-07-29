const { GRADES, SUBJECTS, SET_LABELS, subjectName } = require('../lib/catalog');

describe('catalog.GRADES', () => {
  it('lists grades 2 through 8 inclusive, in order', () => {
    expect(GRADES).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('contains only numbers', () => {
    GRADES.forEach((g) => expect(typeof g).toBe('number'));
  });
});

describe('catalog.SUBJECTS', () => {
  it('defines IMO and NSO with display names', () => {
    expect(SUBJECTS).toEqual([
      { code: 'IMO', name: 'Mathematics (IMO)' },
      { code: 'NSO', name: 'Science (NSO)' },
    ]);
  });

  it('has unique subject codes', () => {
    const codes = SUBJECTS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('catalog.SET_LABELS', () => {
  it('has 10 labels from A to J', () => {
    expect(SET_LABELS).toHaveLength(10);
    expect(SET_LABELS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  });
});

describe('catalog.subjectName', () => {
  it('resolves a known subject code to its display name', () => {
    expect(subjectName('IMO')).toBe('Mathematics (IMO)');
    expect(subjectName('NSO')).toBe('Science (NSO)');
  });

  it('falls back to the raw code for an unknown subject', () => {
    expect(subjectName('XYZ')).toBe('XYZ');
  });

  it('falls back to the raw value for undefined/empty input', () => {
    expect(subjectName(undefined)).toBe(undefined);
    expect(subjectName('')).toBe('');
  });
});
