import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LiveScoreCard from '../components/LiveScoreCard';
import Post from '../components/Post';
import PostComposer from '../components/PostComposer';
import api from '../api/client';

const SPORT_TABS = [
  { id: 'all', label: 'All Sports', emoji: '🏆' },
  { id: 'Football', label: 'NFL/Football', emoji: '🏈' },
  { id: 'Basketball', label: 'NBA/Basketball', emoji: '🏀' },
  { id: 'Soccer', label: 'Soccer', emoji: '⚽' },
  { id: 'Baseball', label: 'MLB/Baseball', emoji: '⚾' },
  { id: 'Hockey', label: 'NHL/Hockey', emoji: '🏒' },
  { id: 'Racing', label: 'F1/Racing', emoji: '🏎️' },
  { id: 'Tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'Golf', label: 'PGA/Golf', emoji: '⛳' },
  { id: 'MMA', label: 'UFC/MMA', emoji: '🥊' },
];

export default function Sports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSport, setActiveSport] = useState(searchParams.get('sport') || 'all');
  const [games, setGames] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('scores'); // 'scores' | 'feed' | 'trending'

  useEffect(() => {
    const sportFilter = activeSport === 'all' ? '' : activeSport;
    setLoading(true);

    Promise.all([
      api.get(`/sports/games${sportFilter ? `?sport=${sportFilter}` : ''}`),
      api.get(`/posts/explore?${sportFilter ? `sport=${sportFilter}&` : ''}limit=20`),
      api.get(`/sports/trending${sportFilter ? `?sport=${sportFilter}` : ''}`),
    ]).then(([gamesRes, postsRes, trendingRes]) => {
      setGames(gamesRes.data);
      setPosts(postsRes.data.posts || []);
      setTrending(trendingRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [activeSport]);

  const handleSelectSport = (sport) => {
    setActiveSport(sport);
    if (sport === 'all') searchParams.delete('sport');
    else searchParams.set('sport', sport);
    setSearchParams(searchParams);
  };

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const liveGames = games.filter(g => g.status === 'live');
  const scheduledGames = games.filter(g => g.status === 'scheduled');
  const finalGames = games.filter(g => g.status === 'final');

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 border-b border-x-border">
        <div className="px-4 py-3">
          <h1 className="text-x-text font-bold text-xl">Sports</h1>
        </div>

        {/* Sport Tabs */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {SPORT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSelectSport(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeSport === tab.id ? 'bg-white text-black' : 'text-x-text-secondary hover:bg-x-bg-hover border border-x-border'}`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Sub-tabs */}
        <div className="flex border-t border-x-border">
          {['scores', 'feed', 'trending'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-3 text-sm font-bold capitalize hover:bg-x-bg-hover transition-colors relative
                ${view === v ? 'text-x-text' : 'text-x-text-secondary'}`}
            >
              {v}
              {view === v && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-x-blue rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === 'scores' && (
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-x-text-secondary text-center py-8">Loading scores...</div>
          ) : (
            <>
              {liveGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-sports-live rounded-full live-badge"></span>
                    <h2 className="text-x-text font-bold text-sm uppercase tracking-wide text-sports-live">Live Now</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {liveGames.map(game => <LiveScoreCard key={game.id} game={game} />)}
                  </div>
                </div>
              )}

              {scheduledGames.length > 0 && (
                <div>
                  <h2 className="text-x-text font-bold text-sm uppercase tracking-wide text-x-text-secondary mb-3">Upcoming</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {scheduledGames.map(game => <LiveScoreCard key={game.id} game={game} />)}
                  </div>
                </div>
              )}

              {finalGames.length > 0 && (
                <div>
                  <h2 className="text-x-text font-bold text-sm uppercase tracking-wide text-x-text-secondary mb-3">Final Scores</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {finalGames.map(game => <LiveScoreCard key={game.id} game={game} />)}
                  </div>
                </div>
              )}

              {games.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📅</div>
                  <div className="text-x-text font-bold">No games found</div>
                  <div className="text-x-text-secondary text-sm">Check back later</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'feed' && (
        <div>
          <PostComposer
            onPost={handleNewPost}
            sport={activeSport !== 'all' ? activeSport : undefined}
            placeholder={activeSport !== 'all' ? `What's happening in ${activeSport}?` : "What's happening in sports?!"}
          />
          {loading ? (
            <div className="text-x-text-secondary text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-x-text font-bold">No posts yet</div>
              <div className="text-x-text-secondary text-sm">Be the first to post!</div>
            </div>
          ) : (
            posts.map(post => <Post key={post.id} post={post} />)
          )}
        </div>
      )}

      {view === 'trending' && (
        <div className="p-4">
          <h2 className="text-x-text font-bold text-lg mb-4">Trending in {activeSport === 'all' ? 'Sports' : activeSport}</h2>
          {trending.length === 0 ? (
            <div className="text-x-text-secondary text-center py-8">No trending topics found</div>
          ) : (
            <div className="space-y-1">
              {trending.map((item, i) => (
                <div key={item.tag} className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-x-bg-hover transition-colors cursor-pointer">
                  <div className="text-x-text-secondary text-2xl font-bold w-8 text-center">{i + 1}</div>
                  <div>
                    <div className="text-x-text font-bold text-base">{item.tag}</div>
                    <div className="text-x-text-secondary text-sm">{item.count?.toLocaleString()} posts · {item.sport || 'Sports'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
