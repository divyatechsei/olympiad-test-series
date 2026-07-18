// Central place to register grades and subjects as content gets added.
// This does NOT control access — that's what the unlock tables are for
// (see lib/unlocks.js). This just tells the admin panel and student
// dashboard what options exist to pick from / manage.

export const GRADES = [2, 3, 4, 5, 6, 7, 8];

export const SUBJECTS = [
  { code: 'IMO', name: 'Mathematics (IMO)' },
  { code: 'NSO', name: 'Science (NSO)' },
];

export const SET_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function subjectName(code) {
  return SUBJECTS.find((s) => s.code === code)?.name || code;
}
