'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { Card } from '../../components/ui';
import { GRADES, SUBJECTS, SET_LABELS } from '../../lib/catalog';

const NAVY = '#1a2b4c';

function Toggle({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
      style={on ? { backgroundColor: '#dcfce7', color: '#16a34a' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}
    >
      {on ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

export function UnlocksTab() {
  const [state, setState] = useState(null);
  const [expandedGrade, setExpandedGrade] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/unlocks');
    const data = await res.json();
    setState(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(level, grade, subject, setLabel, currentlyOn) {
    setBusy(true);
    const res = await fetch('/api/admin/unlocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, grade, subject, setLabel, unlocked: !currentlyOn }),
    });
    const data = await res.json();
    setState(data);
    setBusy(false);
  }

  if (!state) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} /></div>;

  const isGradeOn = (g) => state.grades.includes(g);
  const isSubjectOn = (g, s) => state.subjects.includes(`${g}:${s}`);
  const isSetOn = (g, s, t) => state.sets.includes(`${g}:${s}:${t}`);

  return (
    <div>
      <p className="text-xs text-slate-400 mb-4">
        Nothing is visible to students until you unlock it here. Unlocking a grade doesn't automatically
        unlock its subjects, and unlocking a subject doesn't automatically unlock its test sets — each
        level is independent, so you can prepare content ahead of time without students seeing it early.
      </p>
      <div className="space-y-2">
        {GRADES.map((grade) => {
          const gradeOn = isGradeOn(grade);
          const isExpanded = expandedGrade === grade;
          return (
            <Card key={grade} className="overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedGrade(isExpanded ? null : grade)}>
                <p className="font-semibold text-sm" style={{ color: NAVY }}>Grade {grade}</p>
                <Toggle on={gradeOn} label={gradeOn ? 'Unlocked' : 'Locked'} onClick={(e) => { e.stopPropagation(); toggle('grade', grade, null, null, gradeOn); }} />
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-2 space-y-2">
                  {SUBJECTS.map((subj) => {
                    const subjOn = isSubjectOn(grade, subj.code);
                    const subjExpanded = expandedSubject === `${grade}:${subj.code}`;
                    return (
                      <div key={subj.code} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSubject(subjExpanded ? null : `${grade}:${subj.code}`)}>
                          <p className="text-sm text-slate-700">{subj.name}</p>
                          <Toggle on={subjOn} label={subjOn ? 'Unlocked' : 'Locked'} onClick={(e) => { e.stopPropagation(); toggle('subject', grade, subj.code, null, subjOn); }} />
                        </div>

                        {subjExpanded && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {SET_LABELS.map((label) => {
                              const setOn = isSetOn(grade, subj.code, label);
                              return (
                                <button
                                  key={label}
                                  disabled={busy}
                                  onClick={() => toggle('set', grade, subj.code, label, setOn)}
                                  className="w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center"
                                  style={setOn ? { backgroundColor: '#16a34a', color: 'white' } : { backgroundColor: '#e2e8f0', color: '#94a3b8' }}
                                  title={`Set ${label}: ${setOn ? 'unlocked' : 'locked'}`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
