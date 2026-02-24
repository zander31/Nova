import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import PostComposer from '../components/PostComposer';
import Post from '../components/Post';
import api from '../api/client';

const sportEmojis = {
  Football: '🏈', Basketball: '🏀', Baseball: '⚾',
  Hockey: '🏒', Soccer: '⚽', Tennis: '🎾'
};

export default function GameThreadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get(`/sports/games/${id}`);
      setGame(data.game);
      setPosts(data.posts);
      setLastUpdate(new Date());
    } catch {
      navigate('/sports');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
    // Auto-refresh live games every 30 seconds
    const interval = setInterval(() => {
      if (game?.status === 'live') fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, game?.status]);

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  if (loading) {
    return <div className="p-8 text-center text-x-text-secondary">Loading game...</div>;
  }

  if (!game) return null;

  const emoji = sportEmojis[game.sport] || '🏆';
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const homeWinning = game.home_score > game.away_score;
  const awayWinning = game.away_score > game.home_score;

  return (
    <div>
      {/* Back button */}
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-4 border-b border-x-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-x-bg-hover rounded-full transition-colors">
          <ArrowLeft size={20} className="text-x-text" />
        </button>
        <div>
          <h1 className="text-x-text font-bold">{game.league} Game Thread</h1>
          <div className="text-x-text-secondary text-xs">{game.venue}</div>
        </div>
        <button onClick={fetchData} className="ml-auto text-x-text-secondary hover:text-x-blue p-2 rounded-full hover:bg-x-bg-hover transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Score Card */}
      <div className="p-4 border-b border-x-border">
        <div className="bg-x-bg-secondary rounded-2xl p-5">
          {/* Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{emoji}</span>
              <span className="text-x-text-secondary text-sm font-medium">{game.league}</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 text-sports-live font-bold">
                <span className="w-2.5 h-2.5 bg-sports-live rounded-full live-badge"></span>
                <span className="text-sm">LIVE · {game.period}</span>
                <span className="text-sm font-bold">{game.time_remaining}</span>
              </div>
            )}
            {isFinal && <span className="text-x-text-secondary font-bold text-sm">FINAL</span>}
            {game.status === 'scheduled' && (
              <span className="text-x-blue font-medium text-sm">
                {new Date(game.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Teams Scoreboard */}
          <div className="flex items-center justify-between gap-4">
            {/* Away Team */}
            <div className={`flex-1 text-center ${awayWinning && !game.status === 'scheduled' ? '' : ''}`}>
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-2xl font-bold text-white mb-2">
                {game.away_team.charAt(0)}
              </div>
              <div className={`font-bold ${awayWinning ? 'text-x-text' : 'text-x-text-secondary'} text-sm`}>
                {game.away_team}
              </div>
              <div className="text-x-text-secondary text-xs">Away</div>
            </div>

            {/* Score */}
            <div className="text-center">
              {game.status !== 'scheduled' ? (
                <div className="flex items-center gap-3">
                  <span className={`text-5xl font-black ${awayWinning ? 'text-x-text' : 'text-x-text-secondary'}`}>
                    {game.away_score}
                  </span>
                  <span className="text-x-text-secondary text-2xl">–</span>
                  <span className={`text-5xl font-black ${homeWinning ? 'text-x-text' : 'text-x-text-secondary'}`}>
                    {game.home_score}
                  </span>
                </div>
              ) : (
                <div className="text-x-text-secondary text-2xl font-bold">VS</div>
              )}
            </div>

            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-2xl font-bold text-white mb-2">
                {game.home_team.charAt(0)}
              </div>
              <div className={`font-bold ${homeWinning ? 'text-x-text' : 'text-x-text-secondary'} text-sm`}>
                {game.home_team}
              </div>
              <div className="text-x-text-secondary text-xs">Home</div>
            </div>
          </div>

          {/* Broadcast info */}
          <div className="mt-4 pt-4 border-t border-x-border flex items-center justify-center gap-6 text-xs text-x-text-secondary">
            <span>📺 {game.broadcast}</span>
            <span>📍 {game.venue}</span>
          </div>
        </div>
      </div>

      {/* Last update info */}
      {isLive && (
        <div className="px-4 py-2 bg-x-blue/5 text-x-blue text-xs text-center">
          ⚡ Live — refreshes automatically · Last updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}

      {/* Composer */}
      <PostComposer
        onPost={handleNewPost}
        gameId={id}
        sport={game.sport}
        league={game.league}
        placeholder={`React to the ${game.away_team} vs ${game.home_team} game...`}
      />

      {/* Posts */}
      <div>
        <div className="px-4 py-3 border-b border-x-border">
          <h2 className="text-x-text font-bold">Game Thread · {posts.length} posts</h2>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">{emoji}</div>
            <div className="text-x-text font-bold text-xl">Start the conversation!</div>
            <div className="text-x-text-secondary text-sm mt-1">Be the first to post about this game</div>
          </div>
        ) : (
          posts.map(post => <Post key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
