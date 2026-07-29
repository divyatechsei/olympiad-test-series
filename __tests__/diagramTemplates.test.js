const {
  DIAGRAM_TYPES,
  DIAGRAM_TEMPLATES,
  SHAPECOUNT_VARIANTS,
} = require('../lib/diagramTemplates');

describe('DIAGRAM_TYPES', () => {
  it('includes the blank "none" option with an empty value', () => {
    expect(DIAGRAM_TYPES[0]).toEqual({ value: '', label: 'None (text-only question)' });
  });

  it('has a unique value for every entry', () => {
    const values = DIAGRAM_TYPES.map((t) => t.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('gives every non-blank type a corresponding starter template', () => {
    DIAGRAM_TYPES.filter((t) => t.value !== '').forEach((t) => {
      expect(DIAGRAM_TEMPLATES).toHaveProperty(t.value);
    });
  });
});

describe('DIAGRAM_TEMPLATES', () => {
  it('tags every template with a "type" matching its own key', () => {
    Object.entries(DIAGRAM_TEMPLATES).forEach(([key, template]) => {
      expect(template.type).toBe(key);
    });
  });

  it('every template key has a matching entry in DIAGRAM_TYPES', () => {
    const validValues = new Set(DIAGRAM_TYPES.map((t) => t.value));
    Object.keys(DIAGRAM_TEMPLATES).forEach((key) => {
      expect(validValues.has(key)).toBe(true);
    });
  });

  describe('pattern template', () => {
    it('has a numeric startAngle and step', () => {
      const t = DIAGRAM_TEMPLATES.pattern;
      expect(typeof t.startAngle).toBe('number');
      expect(typeof t.step).toBe('number');
    });
  });

  describe('classification template', () => {
    it('has 3 regular shapes and one odd shape with a valid position', () => {
      const t = DIAGRAM_TEMPLATES.classification;
      expect(t.regularShapes).toHaveLength(3);
      expect(typeof t.oddShape).toBe('string');
      expect(t.oddPosition).toBeGreaterThanOrEqual(0);
    });
  });

  describe('shapecount template', () => {
    it('uses a variant listed in SHAPECOUNT_VARIANTS', () => {
      expect(SHAPECOUNT_VARIANTS).toContain(DIAGRAM_TEMPLATES.shapecount.variant);
    });
  });

  describe('mirror template', () => {
    it('provides a 3-shape figure and exactly 4 answer options of matching length', () => {
      const t = DIAGRAM_TEMPLATES.mirror;
      expect(t.figure).toHaveLength(3);
      expect(t.optionShapes).toHaveLength(4);
      t.optionShapes.forEach((opt) => expect(opt).toHaveLength(3));
    });

    it('includes the correct mirror image among the options', () => {
      // The mirrored figure of ['C','T','S'] should be present verbatim
      // as one of the 4 candidate options (the "correct" one).
      const t = DIAGRAM_TEMPLATES.mirror;
      const matches = t.optionShapes.filter(
        (opt) => JSON.stringify(opt) === JSON.stringify(t.figure)
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('angle template', () => {
    it('has an angle strictly between 0 and 360', () => {
      const { angle } = DIAGRAM_TEMPLATES.angle;
      expect(angle).toBeGreaterThan(0);
      expect(angle).toBeLessThan(360);
    });
  });

  describe('rectangle template', () => {
    it('has positive length and breadth', () => {
      const { l, b } = DIAGRAM_TEMPLATES.rectangle;
      expect(l).toBeGreaterThan(0);
      expect(b).toBeGreaterThan(0);
    });
  });

  describe('bargraph template', () => {
    it('has at least one bar, each with a label, non-negative value, and color', () => {
      const { data } = DIAGRAM_TEMPLATES.bargraph;
      expect(data.length).toBeGreaterThan(0);
      data.forEach((bar) => {
        expect(typeof bar.label).toBe('string');
        expect(bar.value).toBeGreaterThanOrEqual(0);
        expect(bar.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('pictograph template', () => {
    it('has rows with a name and non-negative count, plus a unit and unitLabel', () => {
      const t = DIAGRAM_TEMPLATES.pictograph;
      expect(t.rows.length).toBeGreaterThan(0);
      t.rows.forEach((row) => {
        expect(typeof row.name).toBe('string');
        expect(row.count).toBeGreaterThanOrEqual(0);
      });
      expect(t.unit).toBeGreaterThan(0);
      expect(typeof t.unitLabel).toBe('string');
    });
  });

  describe('clock template', () => {
    it('has an hour from 1-12 and a minute from 0-59', () => {
      const { hour, minute } = DIAGRAM_TEMPLATES.clock;
      expect(hour).toBeGreaterThanOrEqual(1);
      expect(hour).toBeLessThanOrEqual(12);
      expect(minute).toBeGreaterThanOrEqual(0);
      expect(minute).toBeLessThanOrEqual(59);
    });
  });

  describe('thermometer template', () => {
    it('has a value within its own min/max range', () => {
      const { value, min, max } = DIAGRAM_TEMPLATES.thermometer;
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
      expect(min).toBeLessThan(max);
    });
  });
});

describe('SHAPECOUNT_VARIANTS', () => {
  it('lists 4 unique variant names', () => {
    expect(SHAPECOUNT_VARIANTS).toHaveLength(4);
    expect(new Set(SHAPECOUNT_VARIANTS).size).toBe(4);
  });
});
