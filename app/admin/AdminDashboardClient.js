'use client';
import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Users, BarChart3, Plus, Trash2, FileQuestion, Lock, UserCog } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { QuestionsTab } from './QuestionsTab';
import { ResultsTab } from './ResultsTab';
import { UnlocksTab } from './UnlocksTab';
import { StudentUnlocksTab } from './StudentUnlocksTab';

const NAVY = '#1a2b4c';
const GOLD = '#d4af37';

function RosterTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/students');
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  async function handleAdd(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setFormError(data.error || 'Something went wrong.'); return; }
    setName(''); setUsername(''); setPassword('');
    loadStudents();
  }

  async function handleRemove(uname) {
    if (!confirm(`Remove ${uname}? This cannot be undone.`)) return;
    await fetch(`/api/admin/students/${uname}`, { method: 'DELETE' });
    loadStudents();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Add a student</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2" />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (e.g. priya23)" className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" type="text" className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2" />
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <Button type="submit" className="w-full" disabled={submitting}><Plus className="w-4 h-4" />Add Student</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Student roster</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-400">No students yet. Add your first one to the left.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((s) => (
              <div key={s.username} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">@{s.username}</p>
                </div>
                <button onClick={() => handleRemove(s.username)} className="text-slate-400 hover:text-red-600 p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminDashboardClient({ adminName }) {
  const [tab, setTab] = useState('roster');

  const TABS = [
    { id: 'roster', label: 'Students', icon: Users },
    { id: 'unlocks', label: 'Unlocks', icon: Lock },
    { id: 'student-unlocks', label: 'Student Access', icon: UserCog },
    { id: 'questions', label: 'Questions', icon: FileQuestion },
    { id: 'results', label: 'Results', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/techsei-icon.png" alt="Techsei" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-bold text-sm" style={{ color: NAVY }}>Admin Panel</h1>
              <p className="text-xs text-slate-400">Olympiad Prep</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })} className="text-slate-600"><LogOut className="w-4 h-4" />Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-lg p-1 w-fit flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 ${tab === id ? 'text-white' : 'text-slate-500'}`} style={tab === id ? { backgroundColor: NAVY } : {}}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {tab === 'roster' && <RosterTab />}
        {tab === 'unlocks' && <UnlocksTab />}
        {tab === 'student-unlocks' && <StudentUnlocksTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'results' && <ResultsTab />}
      </main>
    </div>
  );
}
