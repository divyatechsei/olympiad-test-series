'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Lock, Unlock, Globe } from 'lucide-react';
import { Card } from '../../components/ui';
import { GRADES, SUBJECTS, SET_LABELS } from '../../lib/catalog';

const NAVY = '#1a2b4c';

function Toggle({ on, onClick, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:cursor-not-allowed"
      style={on ? { backgroundColor: '#dcfce7', color: '#16a34a' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}
    >
      {on ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

export function StudentUnlocksTab() {
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  const [state, setState] = useState(null); // { global, personalSets }
  const [loadingState, setLoadingState] = useState(false);
  const [expandedGrade, setExpandedGrade] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setStudentsLoading(true);
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data.students || []);
      setStudentsLoading(false);
    })();
  }, []);

  const loadState = useCallback(async (studentId) => {
    if (!studentId) { setState(null); return; }
    setLoadingState(true);
    const res = await fetch(`/api/admin/student-unlocks?studentId=${studentId}`);
    const data = await res.json();
    setState(data);
    setLoadingState(false);
  }, []);

  useEffect(() => { loadState(selectedId); }, [selectedId, loadState]);

  async function toggle(grade, subject, setLabel, currentlyOn) {
    setBusy(true);
    const res = await fetch('/api/admin/student-unlocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedId, grade, subject, setLabel, unlocked: !currentlyOn }),
    });
    const data = await res.json();
    setState((prev) => ({ ...prev, personalSets: data.personalSets }));
    setBusy(false);
  }

  const isGloballyOn = (g, s, t) =>
    !!state && state.global.grades.includes(g) && state.global.subjects.includes(`${g}:${s}`) && state.global.sets.includes(`${g}:${s}:${t}`);

  const isPersonallyOn = (g, s, t) =>
    !!state && state.personalSets.some((p) => p.grade === g && p.subject === s && p.setLabel === t);

  return (
    <div>
      <p className="text-xs text-slate-400 mb-4">
        Grant one student early access to a specific test — useful for makeup tests, advanced learners, or
        previewing content before it's released to everyone. This is independent of the global Unlocks tab:
        a set unlocked here is visible to this student only, even while it's still locked for the rest of the class.
      </p>

      <Card className="p-4 mb-4">
        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Student</label>
        {studentsLoading ? (
          <p className="text-sm text-slate-400">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-400">No students yet — add one in the Students tab first.</p>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
          >
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (@{s.username})</option>
            ))}
          </select>
        )}
      </Card>

      {!selectedId ? null : loadingState || !state ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} /></div>
      ) : (
        <div className="space-y-2">
          {GRADES.map((grade) => {
            const isExpanded = expandedGrade === grade;
            return (
              <Card key={grade} className="overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedGrade(isExpanded ? null : grade)}>
                  <p className="font-semibold text-sm" style={{ color: NAVY }}>Grade {grade}</p>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-2 space-y-2">
                    {SUBJECTS.map((subj) => {
                      const subjExpanded = expandedSubject === `${grade}:${subj.code}`;
                      return (
                        <div key={subj.code} className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSubject(subjExpanded ? null : `${grade}:${subj.code}`)}>
                            <p className="text-sm text-slate-700">{subj.name}</p>
                          </div>

                          {subjExpanded && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {SET_LABELS.map((label) => {
                                const globalOn = isGloballyOn(grade, subj.code, label);
                                const personalOn = isPersonallyOn(grade, subj.code, label);
                                if (globalOn) {
                                  return (
                                    <div
                                      key={label}
                                      title={`Set ${label}: unlocked for everyone`}
                                      className="w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center"
                                      style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}
                                    >
                                      <Globe className="w-4 h-4" />
                                    </div>
                                  );
                                }
                                return (
                                  <button
                                    key={label}
                                    disabled={busy}
                                    onClick={() => toggle(grade, subj.code, label, personalOn)}
                                    className="w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center"
                                    style={personalOn ? { backgroundColor: '#16a34a', color: 'white' } : { backgroundColor: '#e2e8f0', color: '#94a3b8' }}
                                    title={`Set ${label}: ${personalOn ? 'unlocked for this student' : 'locked'}`}
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
      )}
    </div>
  );
}
