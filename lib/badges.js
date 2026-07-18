export const TIME_LIMIT_SECONDS = 60 * 60;

// Badge checks operate on an array of attempt rows as returned by
// Supabase (snake_case columns): { set_label, marks, max_marks,
// time_remaining_seconds, section_breakdown, ... }
export const BADGE_DEFS = [
  { id: 'first_step', name: 'First Step', desc: 'Completed your first test', icon: 'Star', check: (a) => a.length >= 1 },
  { id: 'perfect', name: 'Perfect Score', desc: 'Scored 100% on a test', icon: 'Crown', check: (a) => a.some((r) => r.marks === r.max_marks) },
  { id: 'speedster', name: 'Speedster', desc: 'Finished with over half the time remaining', icon: 'Zap', check: (a) => a.some((r) => r.time_remaining_seconds > TIME_LIMIT_SECONDS / 2) },
  { id: 'five_down', name: 'Halfway Hero', desc: 'Completed 5 tests', icon: 'Medal', check: (a) => new Set(a.map((r) => r.set_label)).size >= 5 },
  { id: 'champion', name: 'IMO Champion', desc: 'Completed all 10 test sets', icon: 'Trophy', check: (a) => new Set(a.map((r) => r.set_label)).size >= 10 },
  { id: 'achiever', name: 'Achiever Ace', desc: 'Got every Section D question correct in one test', icon: 'Sparkles', check: (a) => a.some((r) => r.section_breakdown?.D && r.section_breakdown.D.correct === r.section_breakdown.D.total) },
  { id: 'consistent', name: 'On a Roll', desc: 'Scored 80%+ on three different tests', icon: 'Flame', check: (a) => a.filter((r) => r.marks / r.max_marks >= 0.8).length >= 3 },
];
