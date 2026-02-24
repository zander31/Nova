import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SPORTS = ['Football', 'Basketball', 'Baseball', 'Hockey', 'Soccer', 'Tennis', 'Golf', 'Racing', 'MMA'];
const SPORT_EMOJIS = { Football: '🏈', Basketball: '🏀', Baseball: '⚾', Hockey: '🏒', Soccer: '⚽', Tennis: '🎾', Golf: '⛳', Racing: '🏎️', MMA: '🥊' };

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '', display_name: '', email: '', password: '',
    favorite_team: '', favorite_sports: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleSport = (sport) => {
    setForm(prev => ({
      ...prev,
      favorite_sports: prev.favorite_sports.includes(sport)
        ? prev.favorite_sports.filter(s => s !== sport)
        : [...prev.favorite_sports, sport]
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.username || !form.display_name || !form.email || !form.password) {
        setError('All fields are required');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-x-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-x-text font-black text-3xl">Join SportsX</h1>
          <p className="text-x-text-secondary mt-2">The home of sports conversation</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-x-blue' : 'bg-x-border'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-x-blue' : 'bg-x-border'}`} />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <h2 className="text-x-text font-bold text-xl mb-4">Create your account</h2>

            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Display name</label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                placeholder="Your name"
                maxLength={50}
                required
                className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue"
              />
            </div>

            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-x-text-secondary">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                  placeholder="username"
                  maxLength={20}
                  required
                  className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 pl-8 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                required
                className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue"
              />
            </div>

            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 characters"
                minLength={6}
                required
                className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-white text-black rounded-full font-bold text-base hover:bg-gray-200 transition-colors mt-2">
              Next →
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-x-text font-bold text-xl mb-4">What sports do you follow?</h2>

            <div className="flex flex-wrap gap-2">
              {SPORTS.map(sport => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm transition-colors border
                    ${form.favorite_sports.includes(sport)
                      ? 'bg-white text-black border-white'
                      : 'border-x-border text-x-text hover:bg-x-bg-hover'
                    }`}
                >
                  {SPORT_EMOJIS[sport]} {sport}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-x-text-secondary text-sm mb-1.5">Favorite team (optional)</label>
              <input
                type="text"
                value={form.favorite_team}
                onChange={e => setForm(p => ({ ...p, favorite_team: e.target.value }))}
                placeholder="e.g. Kansas City Chiefs"
                className="w-full bg-transparent border border-x-border rounded-lg px-4 py-3 text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-x-border text-x-text rounded-full font-bold text-base hover:bg-x-bg-hover transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-x-blue text-white rounded-full font-bold text-base hover:bg-x-blue-hover transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <span className="text-x-text-secondary text-sm">Already have an account? </span>
          <Link to="/login" className="text-x-blue font-bold text-sm hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
