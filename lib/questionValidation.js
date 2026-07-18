import { GRADES, SUBJECTS, SET_LABELS } from './catalog';

export const SECTIONS = ['A', 'B', 'C', 'D'];
export const ANSWERS = ['A', 'B', 'C', 'D'];

export function validateQuestionBody(body) {
  if (!GRADES.includes(Number(body.grade))) return 'Invalid grade.';
  if (!SUBJECTS.some((s) => s.code === body.subject)) return 'Invalid subject.';
  if (!SET_LABELS.includes(body.setLabel)) return 'Invalid set label.';
  if (!Number.isInteger(body.qNum) || body.qNum < 1) return 'Question number must be a positive whole number.';
  if (!SECTIONS.includes(body.section)) return 'Section must be A, B, C, or D.';
  if (!Number.isInteger(body.marks) || body.marks < 1 || body.marks > 10) return 'Marks must be a whole number from 1 to 10.';
  if (!body.text?.trim()) return 'Question text is required.';
  if (!Array.isArray(body.opts) || body.opts.length !== 4 || body.opts.some((o) => !String(o).trim())) {
    return 'All 4 answer options must be filled in.';
  }
  if (!ANSWERS.includes(body.ans)) return 'Correct answer must be A, B, C, or D.';
  if (!Array.isArray(body.steps) || body.steps.length === 0 || body.steps.every((s) => !String(s).trim())) {
    return 'At least one solution step is required.';
  }
  if (body.imgParams) {
    if (typeof body.imgParams !== 'object') return 'Diagram parameters must be valid JSON.';
    if (!body.imgParams.type) return 'Diagram parameters must include a "type" field.';
  }
  return null;
}
