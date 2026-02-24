import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function GameChip({ game }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';

  const sportEmojis = {
    'Football': '🏈',
    'Basketball': '🏀',
    'Baseball': '⚾',
    'Hockey': '🏒',
    'Soccer': '⚽',
  };
  const emoji = sportEmojis[game.sport] || '🏆';

  return (
    <Link
      to={`/games/${game.id}`}
      className="flex items-center gap-2 px-4 shrink-0 hover:bg-white/5 transition-colors cursor-pointer"
    >
      <span className="text-sm">{emoji}</span>
      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        <span className={`font-semibold ${isLive ? 'text-x-text' : 'text-x-text-secondary'}`}>
          {game.away_team.split(' ').pop()}
        </span>
        {!isScheduled && (
          <span className={`font-bold ${isLive ? 'text-white' : 'text-x-text-secondary'}`}>
            {game.away_score}
          </span>
        )}
        <span className="text-x-text-secondary">–</span>
        {!isScheduled && (
          <span className={`font-bold ${isLive ? 'text-white' : 'text-x-text-secondary'}`}>
            {game.home_score}
          </span>
        )}
        <span className={`font-semibold ${isLive ? 'text-x-text' : 'text-x-text-secondary'}`}>
          {game.home_team.split(' ').pop()}
        </span>
        {isLive && (
          <span className="flex items-center gap-0.5 text-sports-live font-bold">
            <span className="w-1.5 h-1.5 bg-sports-live rounded-full live-badge inline-block"></span>
            {game.period} {game.time_remaining}
          </span>
        )}
        {isFinal && <span className="text-x-text-secondary">Final</span>}
        {isScheduled && (
          <span className="text-x-blue">
            {new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function ScoresTicker() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    api.get('/sports/games').then(({ data }) => {
      setGames(data);
    }).catch(() => {});

    // Refresh live scores every 30 seconds
    const interval = setInterval(() => {
      api.get('/sports/games?status=live').then(({ data }) => {
        setGames(prev => {
          const liveIds = new Set(data.map(g => g.id));
          return prev.map(g => liveIds.has(g.id) ? data.find(lg => lg.id === g.id) : g);
        });
      }).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (games.length === 0) return null;

  const liveGames = games.filter(g => g.status === 'live');
  const otherGames = games.filter(g => g.status !== 'live');
  const displayGames = [...liveGames, ...otherGames];

  return (
    <div className="sticky top-0 z-50 bg-x-bg border-b border-x-border overflow-hidden h-12 flex items-center">
      <div className="flex items-center h-full overflow-hidden flex-1">
        <div className="flex items-center text-xs text-x-text-secondary font-bold px-3 shrink-0 border-r border-x-border h-full">
          <span>⚡ LIVE</span>
        </div>
        <div className="flex items-center overflow-x-auto scrollbar-hide flex-1 gap-0 divide-x divide-x-border">
          {displayGames.map((game) => (
            <GameChip key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}
