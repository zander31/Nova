import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { UserAvatar } from '../components/Sidebar';
import Post from '../components/Post';
import api from '../api/client';

const SPORT_FILTERS = ['All', 'Football', 'Basketball', 'Soccer', 'Baseball', 'Hockey', 'Tennis'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tab, setTab] = useState(searchParams.get('tab') || 'posts');
  const [sportFilter, setSportFilter] = useState('All');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState([]);

  useEffect(() => {
    api.get('/sports/trending').then(({ data }) => setTrendingTopics(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q, tab, sportFilter);
    }
  }, [searchParams]);

  const doSearch = async (q, currentTab, sport) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const sportParam = sport !== 'All' ? `&sport=${sport}` : '';
      const [postsRes, usersRes] = await Promise.all([
        api.get(`/sports/search?q=${encodeURIComponent(q)}${sportParam}`),
        api.get(`/users/search/query?q=${encodeURIComponent(q)}`),
      ]);
      setPosts(postsRes.data.posts || []);
      setUsers(usersRes.data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchParams.set('q', query);
    setSearchParams(searchParams);
    doSearch(query, tab, sportFilter);
  };

  const handleTagClick = (tag) => {
    const q = tag.replace('#', '');
    setQuery(q);
    searchParams.set('q', q);
    setSearchParams(searchParams);
    doSearch(q, tab, sportFilter);
  };

  const hasQuery = query.trim().length > 0 && (posts.length > 0 || users.length > 0);

  return (
    <div>
      {/* Sticky Search Header */}
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 px-4 py-3 border-b border-x-border">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-x-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts, people, sports..."
            className="w-full bg-x-bg-secondary text-x-text placeholder-x-text-secondary rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-x-blue"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-x-text-secondary hover:text-x-text">
              <X size={16} />
            </button>
          )}
        </form>

        {/* Sport filters */}
        {query && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
            {SPORT_FILTERS.map(sport => (
              <button
                key={sport}
                onClick={() => { setSportFilter(sport); doSearch(query, tab, sport); }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${sportFilter === sport ? 'bg-white text-black' : 'border border-x-border text-x-text-secondary hover:bg-x-bg-hover'}`}
              >
                {sport}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs when query */}
      {query && (
        <div className="flex border-b border-x-border sticky top-[120px] bg-x-bg z-10">
          {['posts', 'people'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-bold capitalize hover:bg-x-bg-hover transition-colors relative
                ${tab === t ? 'text-x-text' : 'text-x-text-secondary'}`}
            >
              {t}
              {tab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-x-blue rounded-full" />}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="p-8 text-center text-x-text-secondary">Searching...</div>
      ) : query ? (
        <>
          {tab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-x-text font-bold text-xl">No results for "{query}"</div>
                  <div className="text-x-text-secondary text-sm mt-1">Try searching for something else</div>
                </div>
              ) : (
                posts.map(post => <Post key={post.id} post={post} />)
              )}
            </div>
          )}

          {tab === 'people' && (
            <div className="divide-y divide-x-border">
              {users.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="text-4xl mb-3">👤</div>
                  <div className="text-x-text font-bold text-xl">No people found</div>
                  <div className="text-x-text-secondary text-sm mt-1">Try a different search</div>
                </div>
              ) : (
                users.map(user => (
                  <Link key={user.id} to={`/${user.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-x-bg-hover transition-colors">
                    <UserAvatar user={user} size={12} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-x-text font-bold">{user.display_name}</span>
                        {user.verified === 1 && <span className="text-x-blue text-sm">✓</span>}
                      </div>
                      <div className="text-x-text-secondary text-sm">@{user.username}</div>
                      {user.bio && <div className="text-x-text text-sm mt-1 truncate">{user.bio}</div>}
                    </div>
                    <div className="text-x-text-secondary text-xs">{user.followers_count?.toLocaleString()} followers</div>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        /* Explore page when no query */
        <div className="p-4">
          <h2 className="text-x-text font-bold text-xl mb-4">Trending in Sports</h2>
          <div className="space-y-0 divide-y divide-x-border">
            {trendingTopics.map((item, i) => (
              <button
                key={item.tag}
                onClick={() => handleTagClick(item.tag)}
                className="w-full text-left flex items-center gap-4 py-4 hover:bg-x-bg-hover px-2 rounded-xl transition-colors"
              >
                <div className="text-x-text-secondary font-bold text-lg w-8">{i + 1}</div>
                <div>
                  <div className="text-x-text font-bold">{item.tag}</div>
                  <div className="text-x-text-secondary text-sm">{item.sport || 'Sports'} · {item.count?.toLocaleString()} posts</div>
                </div>
              </button>
            ))}
          </div>

          {/* Suggested sport feeds */}
          <h2 className="text-x-text font-bold text-xl mt-8 mb-4">Browse by Sport</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { sport: 'Football', color: 'from-orange-900/50 to-orange-800/30', emoji: '🏈', tag: 'NFL', league: 'NFL' },
              { sport: 'Basketball', color: 'from-orange-800/50 to-orange-700/30', emoji: '🏀', tag: 'NBA', league: 'NBA' },
              { sport: 'Soccer', color: 'from-green-900/50 to-green-800/30', emoji: '⚽', tag: 'Soccer' },
              { sport: 'Baseball', color: 'from-blue-900/50 to-blue-800/30', emoji: '⚾', tag: 'MLB', league: 'MLB' },
              { sport: 'Hockey', color: 'from-cyan-900/50 to-cyan-800/30', emoji: '🏒', tag: 'NHL', league: 'NHL' },
              { sport: 'MMA', color: 'from-red-900/50 to-red-800/30', emoji: '🥊', tag: 'UFC' },
            ].map(item => (
              <Link
                key={item.sport}
                to={`/sports?sport=${item.sport}`}
                className={`bg-gradient-to-br ${item.color} rounded-2xl p-4 hover:opacity-90 transition-opacity`}
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="text-x-text font-bold">{item.sport}</div>
                <div className="text-x-text-secondary text-sm">#{item.tag}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
