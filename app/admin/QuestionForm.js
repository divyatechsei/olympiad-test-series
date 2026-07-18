'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card, DiagramCanvas } from '../../components/ui';
import { DIAGRAM_TYPES, DIAGRAM_TEMPLATES } from '../../lib/diagramTemplates';

const NAVY = '#1a2b4c';
const SECTIONS = [
  { value: 'A', label: 'A · Logical Reasoning' },
  { value: 'B', label: 'B · Mathematical Reasoning' },
  { value: 'C', label: 'C · Everyday Mathematics' },
  { value: 'D', label: 'D · Achievers Section' },
];
const DEFAULT_MARKS_BY_SECTION = { A: 1, B: 1, C: 1, D: 2 };

function blankForm(grade, subject, setLabel, nextQNum) {
  return {
    grade,
    subject,
    setLabel,
    qNum: nextQNum,
    section: 'A',
    marks: 1,
    text: '',
    opts: ['', '', '', ''],
    ans: 'A',
    steps: [''],
    diagramType: '',
    diagramJson: '',
  };
}

export function QuestionForm({ grade, subject, setLabel, nextQNum, existing, onSaved, onCancel }) {
  const [form, setForm] = useState(() => {
    if (existing) {
      return {
        grade: existing.grade,
        subject: existing.subject,
        setLabel: existing.set_label,
        qNum: existing.q_num,
        section: existing.section,
        marks: existing.marks,
        text: existing.text,
        opts: [...existing.opts],
        ans: existing.ans,
        steps: existing.steps.length ? [...existing.steps] : [''],
        diagramType: existing.img_params?.type || '',
        diagramJson: existing.img_params ? JSON.stringify(existing.img_params, null, 2) : '',
      };
    }
    return blankForm(grade, subject, setLabel, nextQNum);
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [diagramPreview, setDiagramPreview] = useState(null);
  const [diagramJsonError, setDiagramJsonError] = useState('');

  useEffect(() => {
    if (!form.diagramType) { setDiagramPreview(null); setDiagramJsonError(''); return; }
    try {
      const parsed = JSON.parse(form.diagramJson);
      setDiagramPreview(parsed);
      setDiagramJsonError('');
    } catch {
      setDiagramPreview(null);
      setDiagramJsonError('Invalid JSON — preview paused until this is fixed.');
    }
  }, [form.diagramJson, form.diagramType]);

  function handleDiagramTypeChange(type) {
    if (!type) {
      setForm((f) => ({ ...f, diagramType: '', diagramJson: '' }));
      return;
    }
    setForm((f) => ({ ...f, diagramType: type, diagramJson: JSON.stringify(DIAGRAM_TEMPLATES[type], null, 2) }));
  }

  function updateOpt(i, value) {
    setForm((f) => ({ ...f, opts: f.opts.map((o, idx) => (idx === i ? value : o)) }));
  }
  function updateStep(i, value) {
    setForm((f) => ({ ...f, steps: f.steps.map((s, idx) => (idx === i ? value : s)) }));
  }
  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, ''] }));
  }
  function removeStep(i) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    let imgParams = null;
    if (form.diagramType) {
      try {
        imgParams = JSON.parse(form.diagramJson);
      } catch {
        setError('The diagram JSON is not valid — fix it before saving.');
        return;
      }
    }

    setSaving(true);
    const payload = {
      grade: form.grade,
      subject: form.subject,
      setLabel: form.setLabel,
      qNum: Number(form.qNum),
      section: form.section,
      marks: Number(form.marks),
      text: form.text,
      opts: form.opts,
      ans: form.ans,
      steps: form.steps.filter((s) => s.trim()),
      imgParams,
    };

    const url = existing ? `/api/admin/questions/${existing.id}` : '/api/admin/questions';
    const method = existing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
    onSaved(data.question);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question number</label>
          <input
            type="number" min="1" value={form.qNum}
            onChange={(e) => setForm((f) => ({ ...f, qNum: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section</label>
          <select
            value={form.section}
            onChange={(e) => {
              const newSection = e.target.value;
              setForm((f) => ({
                ...f,
                section: newSection,
                // Only auto-suggest marks for a brand-new question, or if the
                // admin hasn't touched marks away from the previous section's
                // default — never silently override a deliberate value.
                marks: existing ? f.marks : DEFAULT_MARKS_BY_SECTION[newSection],
              }));
            }}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 bg-white"
          >
            {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Marks</label>
          <input
            type="number" min="1" max="10" value={form.marks}
            onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question text</label>
        <textarea
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
          placeholder="e.g. What is the HCF of 48 and 60?"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Answer options — select the correct one</label>
        <div className="space-y-2">
          {form.opts.map((opt, i) => {
            const letter = 'ABCD'[i];
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ans: letter }))}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                  style={form.ans === letter ? { backgroundColor: '#16a34a', borderColor: '#16a34a', color: 'white' } : { borderColor: '#cbd5e1', color: '#64748b' }}
                  title="Mark as correct answer"
                >
                  {letter}
                </button>
                <input
                  value={opt}
                  onChange={(e) => updateOpt(i, e.target.value)}
                  placeholder={`Option ${letter}`}
                  className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Click the letter circle to mark that option as correct. Currently: <strong style={{ color: NAVY }}>{form.ans}</strong></p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Solution steps (shown in the review screen)</label>
        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-4 flex-shrink-0">{i + 1}.</span>
              <input
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder="e.g. HCF(48, 60) = 12."
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2"
              />
              {form.steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)} className="text-slate-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: NAVY }}>
          <Plus className="w-3.5 h-3.5" />Add step
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Diagram (optional)</label>
        <select
          value={form.diagramType}
          onChange={(e) => handleDiagramTypeChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 bg-white mb-3"
        >
          {DIAGRAM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {form.diagramType && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <textarea
                value={form.diagramJson}
                onChange={(e) => setForm((f) => ({ ...f, diagramJson: e.target.value }))}
                rows={10}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2"
              />
              {diagramJsonError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{diagramJsonError}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-center">
              {diagramPreview ? <DiagramCanvas params={diagramPreview} /> : <p className="text-xs text-slate-400">Preview will appear here</p>}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (existing ? 'Save Changes' : 'Add Question')}
        </Button>
      </div>
    </form>
  );
}
