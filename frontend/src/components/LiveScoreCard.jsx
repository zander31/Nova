import { Link } from 'react-router-dom';

const sportEmojis = {
  Football: '🏈',
  Basketball: '🏀',
  Baseball: '⚾',
  Hockey: '🏒',
  Soccer: '⚽',
  Tennis: '🎾',
  Golf: '⛳',
  Racing: '🏎️',
  MMA: '🥊',
};

export default function LiveScoreCard({ game, className = '' }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const emoji = sportEmojis[game.sport] || '🏆';

  const homeWinning = game.home_score > game.away_score;
  const awayWinning = game.away_score > game.home_score;

  return (
    <Link
      to={`/games/${game.id}`}
      className={`block bg-x-bg-secondary hover:bg-x-bg-hover border border-x-border rounded-2xl p-4 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-x-text-secondary text-xs font-medium">{game.league}</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 text-sports-live text-xs font-bold">
            <span className="w-2 h-2 bg-sports-live rounded-full live-badge"></span>
            LIVE · {game.period} {game.time_remaining}
          </div>
        )}
        {isFinal && <span className="text-x-text-secondary text-xs font-bold">FINAL</span>}
        {isScheduled && (
          <span className="text-x-blue text-xs font-medium">
            {new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Teams + Scores */}
      <div className="space-y-2">
        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
              style={{ background: 'linear-gradient(135deg, #333, #555)' }}>
              {game.away_team.charAt(0)}
            </div>
            <span className={`text-sm font-medium ${awayWinning && !isScheduled ? 'text-x-text font-bold' : 'text-x-text-secondary'}`}>
              {game.away_team}
            </span>
          </div>
          {!isScheduled && (
            <span className={`text-xl font-bold ${awayWinning ? 'text-x-text' : 'text-x-text-secondary'}`}>
              {game.away_score}
            </span>
          )}
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #444, #666)' }}>
              {game.home_team.charAt(0)}
            </div>
            <span className={`text-sm font-medium ${homeWinning && !isScheduled ? 'text-x-text font-bold' : 'text-x-text-secondary'}`}>
              {game.home_team}
            </span>
          </div>
          {!isScheduled && (
            <span className={`text-xl font-bold ${homeWinning ? 'text-x-text' : 'text-x-text-secondary'}`}>
              {game.home_score}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-x-border flex items-center justify-between">
        <span className="text-x-text-secondary text-xs">{game.venue?.split(',')[0]}</span>
        <span className="text-x-text-secondary text-xs">📺 {game.broadcast}</span>
      </div>
    </Link>
  );
}
