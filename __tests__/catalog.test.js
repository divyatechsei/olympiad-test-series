const { GRADES, SUBJECTS, SET_LABELS, isValidSetLabel, subjectName } = require('../lib/catalog');

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
  it('has a 1-10 quick-pick list (UI convenience only, not the validation rule)', () => {
    expect(SET_LABELS).toHaveLength(10);
    expect(SET_LABELS).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });
});

describe('catalog.isValidSetLabel', () => {
  it('accepts any positive non-zero integer, with no upper bound', () => {
    ['1', '2', '10', '11', '99', '1000'].forEach((label) => {
      expect(isValidSetLabel(label)).toBe(true);
    });
  });

  it('rejects zero, leading zeros, negatives, decimals, and non-numeric values', () => {
    ['0', '01', '-1', '3.5', 'A', '', ' 1', '1 '].forEach((label) => {
      expect(isValidSetLabel(label)).toBe(false);
    });
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
