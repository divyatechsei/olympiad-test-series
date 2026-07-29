const { BADGE_DEFS, TIME_LIMIT_SECONDS } = require('../lib/badges');

function findBadge(id) {
  const badge = BADGE_DEFS.find((b) => b.id === id);
  if (!badge) throw new Error(`No badge definition found for id "${id}"`);
  return badge;
}

describe('badges.TIME_LIMIT_SECONDS', () => {
  it('is one hour', () => {
    expect(TIME_LIMIT_SECONDS).toBe(3600);
  });
});

describe('badges.BADGE_DEFS shape', () => {
  it('defines exactly 7 badges with unique ids', () => {
    expect(BADGE_DEFS).toHaveLength(7);
    const ids = BADGE_DEFS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every badge has an id, name, desc, icon, and check function', () => {
    BADGE_DEFS.forEach((badge) => {
      expect(typeof badge.id).toBe('string');
      expect(typeof badge.name).toBe('string');
      expect(typeof badge.desc).toBe('string');
      expect(typeof badge.icon).toBe('string');
      expect(typeof badge.check).toBe('function');
    });
  });

  it('every check function returns false for an empty attempt list', () => {
    BADGE_DEFS.forEach((badge) => {
      expect(badge.check([])).toBeFalsy();
    });
  });
});

describe('first_step badge', () => {
  const check = findBadge('first_step').check;

  it('is earned after a single attempt', () => {
    expect(check([{ set_label: 'A', marks: 5, max_marks: 10 }])).toBe(true);
  });

  it('is not earned with no attempts', () => {
    expect(check([])).toBe(false);
  });
});

describe('perfect badge', () => {
  const check = findBadge('perfect').check;

  it('is earned when any attempt has marks === max_marks', () => {
    const attempts = [
      { marks: 5, max_marks: 10 },
      { marks: 10, max_marks: 10 },
    ];
    expect(check(attempts)).toBe(true);
  });

  it('is not earned when no attempt reaches full marks', () => {
    const attempts = [
      { marks: 5, max_marks: 10 },
      { marks: 9, max_marks: 10 },
    ];
    expect(check(attempts)).toBe(false);
  });

  it('does not treat 0/0 as a fluke pass unless it truly is equal', () => {
    // Edge case: marks === max_marks holds for 0 === 0 too, which is
    // arguably correct (a zero-question test scored 100%), so we
    // document the current behavior rather than assume it's a bug.
    expect(check([{ marks: 0, max_marks: 0 }])).toBe(true);
  });
});

describe('speedster badge', () => {
  const check = findBadge('speedster').check;

  it('is earned when time_remaining_seconds is over half the time limit', () => {
    expect(check([{ time_remaining_seconds: 1801 }])).toBe(true);
  });

  it('is not earned at exactly half the time limit (strictly greater than required)', () => {
    expect(check([{ time_remaining_seconds: 1800 }])).toBe(false);
  });

  it('is not earned with little time remaining', () => {
    expect(check([{ time_remaining_seconds: 100 }])).toBe(false);
  });
});

describe('five_down badge (Halfway Hero)', () => {
  const check = findBadge('five_down').check;

  it('is earned once 5 distinct set labels have been attempted', () => {
    const attempts = ['A', 'B', 'C', 'D', 'E'].map((set_label) => ({ set_label }));
    expect(check(attempts)).toBe(true);
  });

  it('counts distinct sets, not total attempts', () => {
    const attempts = ['A', 'A', 'A', 'A', 'A'].map((set_label) => ({ set_label }));
    expect(check(attempts)).toBe(false);
  });

  it('is not earned with only 4 distinct sets', () => {
    const attempts = ['A', 'B', 'C', 'D'].map((set_label) => ({ set_label }));
    expect(check(attempts)).toBe(false);
  });
});

describe('champion badge (IMO Champion)', () => {
  const check = findBadge('champion').check;

  it('is earned once all 10 distinct set labels have been attempted', () => {
    const attempts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((set_label) => ({ set_label }));
    expect(check(attempts)).toBe(true);
  });

  it('is not earned with only 9 distinct sets', () => {
    const attempts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((set_label) => ({ set_label }));
    expect(check(attempts)).toBe(false);
  });
});

describe('achiever badge (Achiever Ace)', () => {
  const check = findBadge('achiever').check;

  it('is earned when Section D is answered perfectly on some attempt', () => {
    const attempts = [{ section_breakdown: { D: { correct: 4, total: 4 } } }];
    expect(check(attempts)).toBe(true);
  });

  it('is not earned when Section D has mistakes', () => {
    const attempts = [{ section_breakdown: { D: { correct: 3, total: 4 } } }];
    expect(check(attempts)).toBe(false);
  });

  it('does not throw when section_breakdown or D is missing', () => {
    expect(() => check([{}])).not.toThrow();
    expect(check([{}])).toBe(false);
    expect(check([{ section_breakdown: {} }])).toBe(false);
  });
});

describe('consistent badge (On a Roll)', () => {
  const check = findBadge('consistent').check;

  it('is earned after three attempts scoring 80% or more', () => {
    const attempts = [
      { marks: 8, max_marks: 10 },
      { marks: 9, max_marks: 10 },
      { marks: 4, max_marks: 5 },
    ];
    expect(check(attempts)).toBe(true);
  });

  it('is not earned with only two qualifying attempts', () => {
    const attempts = [
      { marks: 8, max_marks: 10 },
      { marks: 9, max_marks: 10 },
      { marks: 2, max_marks: 10 },
    ];
    expect(check(attempts)).toBe(false);
  });

  it('treats exactly 80% as qualifying', () => {
    const attempts = [
      { marks: 8, max_marks: 10 },
      { marks: 8, max_marks: 10 },
      { marks: 8, max_marks: 10 },
    ];
    expect(check(attempts)).toBe(true);
  });
});
