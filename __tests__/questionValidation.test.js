const { validateQuestionBody, SECTIONS, ANSWERS } = require('../lib/questionValidation');

function validBody(overrides = {}) {
  return {
    grade: 5,
    subject: 'IMO',
    setLabel: '1',
    qNum: 1,
    section: 'A',
    marks: 1,
    text: 'What is 2 + 2?',
    opts: ['2', '3', '4', '5'],
    ans: 'C',
    steps: ['Add 2 and 2 to get 4.'],
    imgParams: null,
    ...overrides,
  };
}

describe('questionValidation constants', () => {
  it('SECTIONS is A-D', () => {
    expect(SECTIONS).toEqual(['A', 'B', 'C', 'D']);
  });

  it('ANSWERS is A-D', () => {
    expect(ANSWERS).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('validateQuestionBody - happy path', () => {
  it('accepts a fully valid question and returns null', () => {
    expect(validateQuestionBody(validBody())).toBeNull();
  });

  it('accepts a valid question without imgParams', () => {
    const body = validBody();
    delete body.imgParams;
    expect(validateQuestionBody(body)).toBeNull();
  });

  it('accepts every valid grade', () => {
    [2, 3, 4, 5, 6, 7, 8].forEach((grade) => {
      expect(validateQuestionBody(validBody({ grade }))).toBeNull();
    });
  });

  it('accepts a grade passed as a numeric string (coerced with Number())', () => {
    expect(validateQuestionBody(validBody({ grade: '5' }))).toBeNull();
  });

  it('accepts every valid set label, including numbers past the old 1-10 cap', () => {
    ['1', '2', '9', '10', '11', '25', '347'].forEach((setLabel) => {
      expect(validateQuestionBody(validBody({ setLabel }))).toBeNull();
    });
  });

  it('accepts every valid section/marks/answer combination', () => {
    ['A', 'B', 'C', 'D'].forEach((section) => {
      ['A', 'B', 'C', 'D'].forEach((ans) => {
        expect(validateQuestionBody(validBody({ section, ans }))).toBeNull();
      });
    });
  });

  it('accepts marks at the boundaries (1 and 10)', () => {
    expect(validateQuestionBody(validBody({ marks: 1 }))).toBeNull();
    expect(validateQuestionBody(validBody({ marks: 10 }))).toBeNull();
  });
});

describe('validateQuestionBody - grade', () => {
  it('rejects a grade outside the supported list', () => {
    expect(validateQuestionBody(validBody({ grade: 1 }))).toBe('Invalid grade.');
    expect(validateQuestionBody(validBody({ grade: 9 }))).toBe('Invalid grade.');
  });

  it('rejects a non-numeric grade', () => {
    expect(validateQuestionBody(validBody({ grade: 'five' }))).toBe('Invalid grade.');
  });

  it('rejects a missing grade', () => {
    const body = validBody();
    delete body.grade;
    expect(validateQuestionBody(body)).toBe('Invalid grade.');
  });
});

describe('validateQuestionBody - subject', () => {
  it('rejects an unknown subject code', () => {
    expect(validateQuestionBody(validBody({ subject: 'ENG' }))).toBe('Invalid subject.');
  });

  it('rejects a missing subject', () => {
    const body = validBody();
    delete body.subject;
    expect(validateQuestionBody(body)).toBe('Invalid subject.');
  });
});

describe('validateQuestionBody - setLabel', () => {
  it('rejects zero', () => {
    expect(validateQuestionBody(validBody({ setLabel: '0' }))).toBe('Invalid set label.');
  });

  it('rejects a leading zero', () => {
    expect(validateQuestionBody(validBody({ setLabel: '01' }))).toBe('Invalid set label.');
  });

  it('rejects a negative number', () => {
    expect(validateQuestionBody(validBody({ setLabel: '-1' }))).toBe('Invalid set label.');
  });

  it('rejects a non-numeric set label', () => {
    expect(validateQuestionBody(validBody({ setLabel: 'A' }))).toBe('Invalid set label.');
  });

  it('rejects an empty set label', () => {
    expect(validateQuestionBody(validBody({ setLabel: '' }))).toBe('Invalid set label.');
  });
});

describe('validateQuestionBody - qNum', () => {
  it('rejects a zero or negative question number', () => {
    expect(validateQuestionBody(validBody({ qNum: 0 }))).toBe('Question number must be a positive whole number.');
    expect(validateQuestionBody(validBody({ qNum: -3 }))).toBe('Question number must be a positive whole number.');
  });

  it('rejects a non-integer question number', () => {
    expect(validateQuestionBody(validBody({ qNum: 1.5 }))).toBe('Question number must be a positive whole number.');
  });

  it('rejects a question number passed as a string (no coercion, unlike grade)', () => {
    expect(validateQuestionBody(validBody({ qNum: '3' }))).toBe('Question number must be a positive whole number.');
  });
});

describe('validateQuestionBody - section', () => {
  it('rejects a section outside A-D', () => {
    expect(validateQuestionBody(validBody({ section: 'E' }))).toBe('Section must be A, B, C, or D.');
  });
});

describe('validateQuestionBody - marks', () => {
  it('rejects marks below 1', () => {
    expect(validateQuestionBody(validBody({ marks: 0 }))).toBe('Marks must be a whole number from 1 to 10.');
  });

  it('rejects marks above 10', () => {
    expect(validateQuestionBody(validBody({ marks: 11 }))).toBe('Marks must be a whole number from 1 to 10.');
  });

  it('rejects fractional marks', () => {
    expect(validateQuestionBody(validBody({ marks: 2.5 }))).toBe('Marks must be a whole number from 1 to 10.');
  });
});

describe('validateQuestionBody - text', () => {
  it('rejects empty question text', () => {
    expect(validateQuestionBody(validBody({ text: '' }))).toBe('Question text is required.');
  });

  it('rejects whitespace-only question text', () => {
    expect(validateQuestionBody(validBody({ text: '   ' }))).toBe('Question text is required.');
  });

  it('rejects a missing text field', () => {
    const body = validBody();
    delete body.text;
    expect(validateQuestionBody(body)).toBe('Question text is required.');
  });
});

describe('validateQuestionBody - opts', () => {
  it('rejects fewer than 4 options', () => {
    expect(validateQuestionBody(validBody({ opts: ['1', '2', '3'] }))).toBe('All 4 answer options must be filled in.');
  });

  it('rejects more than 4 options', () => {
    expect(validateQuestionBody(validBody({ opts: ['1', '2', '3', '4', '5'] }))).toBe('All 4 answer options must be filled in.');
  });

  it('rejects when any option is blank', () => {
    expect(validateQuestionBody(validBody({ opts: ['1', '', '3', '4'] }))).toBe('All 4 answer options must be filled in.');
  });

  it('rejects when opts is not an array', () => {
    expect(validateQuestionBody(validBody({ opts: 'not-an-array' }))).toBe('All 4 answer options must be filled in.');
  });

  it('accepts numeric option values (coerced to string before trim)', () => {
    expect(validateQuestionBody(validBody({ opts: [1, 2, 3, 4] }))).toBeNull();
  });
});

describe('validateQuestionBody - ans', () => {
  it('rejects an answer outside A-D', () => {
    expect(validateQuestionBody(validBody({ ans: 'E' }))).toBe('Correct answer must be A, B, C, or D.');
  });

  it('rejects a missing answer', () => {
    const body = validBody();
    delete body.ans;
    expect(validateQuestionBody(body)).toBe('Correct answer must be A, B, C, or D.');
  });
});

describe('validateQuestionBody - steps', () => {
  it('rejects an empty steps array', () => {
    expect(validateQuestionBody(validBody({ steps: [] }))).toBe('At least one solution step is required.');
  });

  it('rejects steps that are all blank', () => {
    expect(validateQuestionBody(validBody({ steps: ['', '   '] }))).toBe('At least one solution step is required.');
  });

  it('accepts steps where at least one entry is non-blank', () => {
    expect(validateQuestionBody(validBody({ steps: ['', 'Do the math.'] }))).toBeNull();
  });

  it('rejects when steps is not an array', () => {
    expect(validateQuestionBody(validBody({ steps: 'one big string' }))).toBe('At least one solution step is required.');
  });
});

describe('validateQuestionBody - imgParams', () => {
  it('rejects imgParams that is not an object', () => {
    expect(validateQuestionBody(validBody({ imgParams: 'not-json' }))).toBe('Diagram parameters must be valid JSON.');
  });

  it('rejects an imgParams object missing a "type" field', () => {
    expect(validateQuestionBody(validBody({ imgParams: { angle: 90 } }))).toBe('Diagram parameters must include a "type" field.');
  });

  it('accepts a well-formed imgParams object', () => {
    expect(validateQuestionBody(validBody({ imgParams: { type: 'angle', angle: 120 } }))).toBeNull();
  });

  it('ignores imgParams entirely when falsy (null/undefined/empty string)', () => {
    expect(validateQuestionBody(validBody({ imgParams: null }))).toBeNull();
    expect(validateQuestionBody(validBody({ imgParams: undefined }))).toBeNull();
    expect(validateQuestionBody(validBody({ imgParams: '' }))).toBeNull();
  });
});

describe('validateQuestionBody - ordering of checks', () => {
  it('reports the first failing check when multiple fields are invalid', () => {
    // grade AND subject are both invalid here; grade is checked first.
    expect(validateQuestionBody(validBody({ grade: 99, subject: 'ENG' }))).toBe('Invalid grade.');
  });
});
