// Central place to register grades and subjects as content gets added.
// This does NOT control access — that's what the unlock tables are for
// (see lib/unlocks.js). This just tells the admin panel and student
// dashboard what options exist to pick from / manage.

export const GRADES = [2, 3, 4, 5, 6, 7, 8];

export const SUBJECTS = [
  { code: 'IMO', name: 'Mathematics (IMO)' },
  { code: 'NSO', name: 'Science (NSO)' },
];

export const SET_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function isValidSetLabel(label) {
  return typeof label === 'string' &&/^[1-9]$|^10$/.test(label); 
}

export function subjectName(code) {
  return SUBJECTS.find((s) => s.code === code)?.name || code;
}

//Total question count per grade/subject - used by the admin panel and
//student dashboard to show "X of N questions" and set completeness
//checks. Update this when a grade's paper format changes (e.g, the
// 35Q/40m -> 50Q/60m expansion).
export const questionCount = {
2 : {IMO : 35},
3 : {IMO : 35},
4 : {IMO : 35},
5 : {IMO : 50},
6 : {IMO : 50, NSO : 50},
7 : {IMO : 50, NSO : 50},
8 : {IMO : 50, NSO : 50},
};

export function getQuestionCount(grade, subject) {
  return questionCount[grade]?.[subject] ?? 35;
}

