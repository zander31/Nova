import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './Sidebar';
import api from '../api/client';

function TrendingItem({ item, index }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/search?q=${encodeURIComponent(item.tag)}`)}
      className="w-full px-4 py-3 hover:bg-x-bg-hover transition-colors text-left"
    >
      <div className="text-x-text-secondary text-xs">{index + 1} · {item.sport || 'Sports'} · Trending</div>
      <div className="text-x-text font-bold">{item.tag}</div>
      <div className="text-x-text-secondary text-xs">{item.count?.toLocaleString()} posts</div>
    </button>
  );
}

function WhoToFollow({ user, onFollow }) {
  const [following, setFollowing] = useState(false);
  const { user: currentUser } = useAuth();

  const handleFollow = async (e) => {
    e.preventDefault();
    if (!currentUser) { window.location.href = '/login'; return; }
    try {
      const { data } = await api.post(`/users/${user.username}/follow`);
      setFollowing(data.following);
      onFollow?.(user.id, data.following);
    } catch {}
  };

  return (
    <Link to={`/${user.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-x-bg-hover transition-colors">
      <UserAvatar user={user} size={10} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-x-text font-bold text-sm truncate">{user.display_name}</span>
          {user.verified === 1 && <span className="text-x-blue text-xs">✓</span>}
        </div>
        <div className="text-x-text-secondary text-sm truncate">@{user.username}</div>
      </div>
      <button
        onClick={handleFollow}
        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors shrink-0
          ${following
            ? 'border border-x-border text-x-text hover:border-red-500 hover:text-red-500'
            : 'bg-white text-black hover:bg-gray-200'
          }`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </Link>
  );
}

export default function RightPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sports/trending').then(({ data }) => setTrending(data)).catch(() => {});
    api.get('/users/suggestions/who-to-follow').then(({ data }) => setSuggestions(data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="right-panel py-3 pr-2">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-x-text-secondary">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search SportsX"
          className="w-full bg-x-bg-secondary text-x-text placeholder-x-text-secondary rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-x-blue focus:bg-x-bg"
        />
      </form>

      {/* Trending Sports */}
      {trending.length > 0 && (
        <div className="bg-x-bg-secondary rounded-2xl mb-4 overflow-hidden">
          <h2 className="text-x-text font-bold text-xl px-4 py-3">Trending in Sports</h2>
          {trending.slice(0, 6).map((item, i) => (
            <TrendingItem key={item.tag} item={item} index={i} />
          ))}
          <Link to="/sports" className="block px-4 py-3 text-x-blue hover:bg-x-bg-hover transition-colors text-sm">
            Show more
          </Link>
        </div>
      )}

      {/* Who to Follow */}
      {suggestions.length > 0 && (
        <div className="bg-x-bg-secondary rounded-2xl mb-4 overflow-hidden">
          <h2 className="text-x-text font-bold text-xl px-4 py-3">Who to follow</h2>
          {suggestions.map(user => (
            <WhoToFollow key={user.id} user={user} />
          ))}
          <Link to="/search?tab=people" className="block px-4 py-3 text-x-blue hover:bg-x-bg-hover transition-colors text-sm">
            Show more
          </Link>
        </div>
      )}

      {/* Sports Quick Links */}
      <div className="bg-x-bg-secondary rounded-2xl overflow-hidden mb-4">
        <h2 className="text-x-text font-bold text-xl px-4 py-3">Popular Leagues</h2>
        {[
          { emoji: '🏈', name: 'NFL', tag: 'NFL' },
          { emoji: '🏀', name: 'NBA', tag: 'NBA' },
          { emoji: '⚽', name: 'Champions League', tag: 'UCL' },
          { emoji: '⚾', name: 'MLB', tag: 'MLB' },
          { emoji: '🏒', name: 'NHL', tag: 'NHL' },
        ].map(league => (
          <Link
            key={league.tag}
            to={`/search?q=${league.tag}&sport=${league.name}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-x-bg-hover transition-colors"
          >
            <span className="text-lg">{league.emoji}</span>
            <span className="text-x-text text-sm font-medium">#{league.tag}</span>
          </Link>
        ))}
      </div>

      {/* Footer links */}
      <div className="px-4 text-x-text-secondary text-xs flex flex-wrap gap-x-3 gap-y-1">
        <a href="#" className="hover:underline">Terms of Service</a>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Cookie Policy</a>
        <a href="#" className="hover:underline">Accessibility</a>
        <span>© 2024 SportsX</span>
      </div>
    </div>
  );
}
