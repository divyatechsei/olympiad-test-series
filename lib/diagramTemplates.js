// Starter templates shown to the admin when they pick a diagram type
// in the question editor. Editing the JSON updates the live preview
// (rendered with the same DiagramCanvas component students see).
//
// Shape codes reference:
//   classification: S=Square, P=Pentagon, H=Hexagon, Eq=Equilateral Triangle, R=Rectangle
//   mirror:         C=Circle, T=Triangle, Ti=Inverted Triangle, S=Square, D=Diamond

export const DIAGRAM_TYPES = [
  { value: '', label: 'None (text-only question)' },
  { value: 'pattern', label: 'Pattern rotation (Section A)' },
  { value: 'classification', label: 'Odd-one-out shapes (Section A)' },
  { value: 'shapecount', label: 'Shape counting (Section A)' },
  { value: 'mirror', label: 'Mirror image (Section A)' },
  { value: 'angle', label: 'Angle diagram (Section B)' },
  { value: 'rectangle', label: 'Rectangle area (Section B)' },
  { value: 'bargraph', label: 'Bar graph (Section B)' },
  { value: 'pictograph', label: 'Pictograph (Section C)' },
  { value: 'clock', label: 'Clock face (any section)' },
  { value: 'thermometer', label: 'Thermometer (any section)' },
];

export const DIAGRAM_TEMPLATES = {
  pattern: { type: 'pattern', startAngle: 0, step: 90 },
  classification: { type: 'classification', regularShapes: ['S', 'P', 'H'], oddShape: 'R', oddPosition: 3 },
  shapecount: { type: 'shapecount', variant: 'square_diagonals' },
  mirror: {
    type: 'mirror',
    figure: ['C', 'T', 'S'],
    optionShapes: [['S', 'T', 'C'], ['C', 'T', 'S'], ['S', 'Ti', 'C'], ['T', 'S', 'C']],
  },
  angle: { type: 'angle', angle: 120 },
  rectangle: { type: 'rectangle', l: 12, b: 7 },
  bargraph: {
    type: 'bargraph',
    data: [
      { label: 'Mango', value: 40, color: '#e67e22' },
      { label: 'Apple', value: 25, color: '#c0392b' },
      { label: 'Banana', value: 35, color: '#f1c40f' },
      { label: 'Orange', value: 20, color: '#d35400' },
    ],
  },
  pictograph: {
    type: 'pictograph',
    rows: [
      { name: 'Diya', count: 6 }, { name: 'Karan', count: 4 },
      { name: 'Sania', count: 8 }, { name: 'Vikram', count: 5 },
    ],
    unit: 2,
    unitLabel: 'books',
  },
  clock: { type: 'clock', hour: 3, minute: 0 },
  thermometer: { type: 'thermometer', value: 30, min: 0, max: 50 },
};

export const SHAPECOUNT_VARIANTS = ['square_diagonals', 'grid_squares_2x2', 'medial_triangle', 'rectangle_diagonals'];
