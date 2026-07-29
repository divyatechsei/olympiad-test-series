'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button, Card } from '../../components/ui';

const NAVY = '#1a2b4c';
const GOLD = '#d4af37';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      username, password, role: mode, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(mode === 'admin' ? 'Incorrect admin username or password.' : "Incorrect username or password. Ask your admin if you're not sure.");
      return;
    }
    router.push(mode === 'admin' ? '/admin' : '/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #f7f5f0 0%, #eef1f8 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/techsei-logo.png" alt="Techsei" className="h-24 w-auto mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>Olympiad Prep</h1>
          <p className="text-slate-500 mt-1 text-sm">by Techsei · Olympiad practice tests</p>
        </div>

        <Card className="p-8">
          <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setMode('student'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'student' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              style={mode === 'student' ? { color: NAVY } : {}}
            >
              <User className="w-4 h-4 inline mr-1.5 -mt-0.5" />Student
            </button>
            <button
              onClick={() => { setMode('admin'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'admin' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              style={mode === 'admin' ? { color: NAVY } : {}}
            >
              <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                placeholder={mode === 'admin' ? 'admin' : 'e.g. priya23'}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !username || !password}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'admin' ? 'Sign in as Admin' : 'Start Learning'}
            </Button>
          </form>
        </Card>
        {mode === 'student' ? (
          <p className="text-center text-xs text-slate-400 mt-6">
            New here? <Link href="/register" className="font-semibold" style={{ color: NAVY }}>Create your own account</Link>
          </p>
        ) : (
          <p className="text-center text-xs text-slate-400 mt-6">Ask your teacher or admin if you don't have login details yet.</p>
        )}
      </div>
    </div>
  );
}
