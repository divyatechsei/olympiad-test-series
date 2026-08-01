// Central place to register grades and subjects as content gets added.
// This does NOT control access — that's what the unlock tables are for
// (see lib/unlocks.js). This just tells the admin panel and student
// dashboard what options exist to pick from / manage.

export const GRADES = [2, 3, 4, 5, 6, 7, 8];

export const SUBJECTS = [
  { code: 'IMO', name: 'Mathematics (IMO)' },
  { code: 'NSO', name: 'Science (NSO)' },
];

// Fixed quick-pick list for admin buttons (Questions/Unlocks tabs) — just
// a UI convenience, NOT the source of truth for what's a valid set.
// Bump this (or swap the picker for a number input) once you're
// routinely adding sets past 10.
export const SET_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Source of truth for what counts as a valid set label anywhere in the
// app (admin API validation, student quiz route, import script): any
// positive non-zero integer, as a string, no leading zero. No fixed
// upper bound, so new sets never require a code change here.
export function isValidSetLabel(label) {
  return typeof label === 'string' && /^[1-9][0-9]*$/.test(label);
}

export function subjectName(code) {
  return SUBJECTS.find((s) => s.code === code)?.name || code;
}
