import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'pm') {
      setEmail('admin@projectai.local');
      setPassword('Demo@123');
    } else {
      setEmail('developer@projectai.local');
      setPassword('Demo@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)' }}>
      <div className="w-full max-w-md animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--color-primary)' }}>
            <span className="text-2xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ProjectAI</h1>
          <p className="text-slate-400 mt-1">AI-Powered Project Management</p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div>
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary w-full justify-center py-2.5" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Don&apos;t have an account? <Link to="/register" className="font-medium" style={{ color: 'var(--color-primary)' }}>Register</Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs text-slate-400 font-medium mb-3 text-center">DEMO ACCOUNTS</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => fillDemo('pm')} className="btn btn-sm justify-center text-white border border-white/20 hover:bg-white/10 transition-colors">
              🔑 Project Manager
            </button>
            <button onClick={() => fillDemo('dev')} className="btn btn-sm justify-center text-white border border-white/20 hover:bg-white/10 transition-colors">
              🔑 Developer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
