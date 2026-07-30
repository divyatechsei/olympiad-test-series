'use client';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Card } from '../../components/ui';

const NAVY = '#1a2b4c';

export function StudentsDataTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data.students || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.username, s.phone, s.school].some((field) => (field || '').toLowerCase().includes(q))
    );
  }, [students, query]);

  return (
    <Card className="p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-sm" style={{ color: NAVY }}>All student data</h2>
          <p className="text-xs text-slate-400">{students.length} student{students.length === 1 ? '' : 's'} total</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, username, phone, school…"
            className="pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} /></div>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-400">No students yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">No students match "{query}".</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Username</th>
              <th className="pb-2 pr-4">Phone</th>
              <th className="pb-2 pr-4">School</th>
              <th className="pb-2 pr-4">Account type</th>
              <th className="pb-2 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.username} className="border-b border-slate-100">
                <td className="py-2.5 pr-4 font-medium text-slate-700">{s.name}</td>
                <td className="py-2.5 pr-4 text-slate-500">@{s.username}</td>
                <td className="py-2.5 pr-4 text-slate-500">{s.phone || '—'}</td>
                <td className="py-2.5 pr-4 text-slate-500">{s.school || '—'}</td>
                <td className="py-2.5 pr-4">
                  {s.self_registered ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                      Self-registered
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      Added by admin
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-slate-500">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
