import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-x-bg flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-x-blue/20 via-x-bg to-x-bg">
        <div className="text-center">
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-white text-5xl font-black leading-tight mb-4">SportsX</h1>
          <p className="text-x-text-secondary text-xl max-w-xs leading-relaxed">
            The home of sports conversation. Live scores, hot takes, and game threads.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {['🏈 NFL', '🏀 NBA', '⚽ Soccer', '⚾ MLB', '🏒 NHL', '🎾 Tennis'].map(s => (
              <span key={s} className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-x-text">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-4xl mb-8 lg:hidden">🏆</div>
          <h2 className="text-x-text font-black text-3xl mb-8">Sign in to SportsX</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Username or email</label>
              <input
                type="text"
                value={form.login}
                onChange={e => setForm(p => ({ ...p, login: e.target.value }))}
                placeholder="demo_user"
                required
                className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black rounded-full font-bold text-base hover:bg-gray-200 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 bg-x-bg-secondary rounded-xl border border-x-border">
            <div className="text-x-text-secondary text-xs mb-1">Demo credentials:</div>
            <div className="text-x-text text-sm font-mono">demo_user / password123</div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-x-text-secondary text-sm">Don't have an account? </span>
            <Link to="/register" className="text-x-blue font-bold text-sm hover:underline">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
