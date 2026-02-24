import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image, BarChart2, Smile, MapPin, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './Sidebar';
import api from '../api/client';

const MAX_LENGTH = 280;

const SPORT_OPTIONS = [
  { value: '', label: 'General' },
  { value: 'Football', label: '🏈 Football' },
  { value: 'Basketball', label: '🏀 Basketball' },
  { value: 'Baseball', label: '⚾ Baseball' },
  { value: 'Hockey', label: '🏒 Hockey' },
  { value: 'Soccer', label: '⚽ Soccer' },
  { value: 'Tennis', label: '🎾 Tennis' },
  { value: 'Golf', label: '⛳ Golf' },
  { value: 'Racing', label: '🏎️ Racing' },
  { value: 'MMA', label: '🥊 MMA' },
];

export default function PostComposer({ onPost, replyToId, gameId, placeholder, sport: defaultSport, league: defaultLeague }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [sport, setSport] = useState(defaultSport || '');
  const [league, setLeague] = useState(defaultLeague || '');
  const [loading, setLoading] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const textareaRef = useRef(null);

  if (!user) {
    return (
      <div className="border-b border-x-border p-4 flex items-center gap-4">
        <div className="text-4xl">🏆</div>
        <div>
          <div className="text-x-text font-bold">Join the conversation</div>
          <div className="text-x-text-secondary text-sm">Sign in to post, like, and more</div>
        </div>
        <div className="ml-auto flex gap-2">
          <Link to="/login" className="px-4 py-2 border border-x-border rounded-full text-x-text font-bold text-sm hover:bg-x-bg-hover transition-colors">Sign in</Link>
          <Link to="/register" className="px-4 py-2 bg-x-blue text-white rounded-full font-bold text-sm hover:bg-x-blue-hover transition-colors">Sign up</Link>
        </div>
      </div>
    );
  }

  const remaining = MAX_LENGTH - content.length;
  const canPost = content.trim().length > 0 && remaining >= 0 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost) return;
    setLoading(true);

    try {
      const payload = {
        content: content.trim(),
        sport_tag: sport,
        league_tag: league,
        reply_to_id: replyToId || undefined,
        game_id: gameId || undefined,
      };

      if (showPollCreator && pollOptions.some(o => o.trim())) {
        const validOptions = pollOptions.filter(o => o.trim());
        if (validOptions.length >= 2) {
          const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          payload.poll = { question: content.trim(), options: validOptions, expires_at: expiresAt };
        }
      }

      const { data } = await api.post('/posts', payload);
      setContent('');
      setSport(defaultSport || '');
      setLeague(defaultLeague || '');
      setShowPollCreator(false);
      setPollOptions(['', '']);
      onPost?.(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const circleColor = remaining < 0 ? '#F4212E' : remaining < 20 ? '#FFD700' : '#1D9BF0';
  const circumference = 2 * Math.PI * 10;
  const progress = Math.max(0, Math.min(1, (MAX_LENGTH - Math.max(0, remaining)) / MAX_LENGTH));

  return (
    <form onSubmit={handleSubmit} className="border-b border-x-border p-4">
      <div className="flex gap-3">
        <Link to={`/${user.username}`}>
          <UserAvatar user={user} size={10} />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Sport badge selected */}
          {sport && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-x-blue/10 text-x-blue rounded-full px-2 py-0.5 flex items-center gap-1">
                {SPORT_OPTIONS.find(s => s.value === sport)?.label}
                <button type="button" onClick={() => { setSport(''); setLeague(''); }} className="ml-1 hover:text-white">
                  <X size={10} />
                </button>
              </span>
              {league && (
                <span className="text-xs bg-x-blue/10 text-x-blue rounded-full px-2 py-0.5 flex items-center gap-1">
                  {league}
                  <button type="button" onClick={() => setLeague('')} className="ml-1 hover:text-white">
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={placeholder || (sport ? `What's happening in ${sport}?` : "What's happening in sports?!")}
            className="w-full bg-transparent text-x-text text-xl placeholder-x-text-secondary resize-none focus:outline-none min-h-[60px] leading-relaxed"
            rows={3}
            maxLength={MAX_LENGTH + 10}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />

          {/* Poll Creator */}
          {showPollCreator && (
            <div className="mt-3 border border-x-border rounded-2xl p-3 space-y-2">
              <div className="text-x-text-secondary text-sm font-medium">Poll options</div>
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  type="text"
                  value={opt}
                  onChange={e => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Choice ${i + 1}`}
                  className="w-full bg-transparent border border-x-border rounded-full px-4 py-2 text-sm text-x-text placeholder-x-text-secondary focus:outline-none focus:border-x-blue"
                />
              ))}
              {pollOptions.length < 4 && (
                <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} className="text-x-blue text-sm hover:underline">
                  + Add choice
                </button>
              )}
            </div>
          )}

          {/* Sport Picker Dropdown */}
          {showSportPicker && (
            <div className="mt-2 border border-x-border rounded-2xl overflow-hidden bg-x-bg shadow-xl z-10">
              <div className="p-2 font-medium text-x-text-secondary text-sm px-3">Select sport</div>
              {SPORT_OPTIONS.filter(s => s.value).map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { setSport(option.value); setShowSportPicker(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-x-bg-hover transition-colors ${sport === option.value ? 'text-x-blue font-bold' : 'text-x-text'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-x-border">
            <div className="flex items-center gap-1 text-x-blue">
              <button
                type="button"
                onClick={() => setShowSportPicker(!showSportPicker)}
                className="p-2 rounded-full hover:bg-blue-500/10 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                🏆 Sport
              </button>
              <button
                type="button"
                onClick={() => setShowPollCreator(!showPollCreator)}
                className={`p-2 rounded-full hover:bg-blue-500/10 transition-colors ${showPollCreator ? 'bg-blue-500/10' : ''}`}
              >
                <BarChart2 size={20} />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
                <Smile size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#2F3336" strokeWidth="2" />
                    <circle
                      cx="12" cy="12" r="10"
                      fill="none"
                      stroke={circleColor}
                      strokeWidth="2"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - progress)}
                      className="transition-all duration-150"
                    />
                  </svg>
                  {remaining <= 20 && (
                    <span className="absolute text-[9px] font-bold" style={{ color: circleColor }}>
                      {remaining < 0 ? remaining : remaining <= 20 ? remaining : ''}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!canPost}
                className="px-4 py-1.5 bg-x-blue text-white rounded-full font-bold text-sm hover:bg-x-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : replyToId ? 'Reply' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
