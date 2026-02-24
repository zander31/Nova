import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, MoreHorizontal, Trash2, BarChart2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './Sidebar';
import api from '../api/client';

function VerifiedBadge({ type }) {
  if (!type) return null;
  const colors = { athlete: '#1D9BF0', organization: '#FFD700', media: '#1D9BF0' };
  return <span style={{ color: colors[type] || '#1D9BF0' }} className="text-sm">✓</span>;
}

function SportTag({ sport, league }) {
  if (!sport && !league) return null;
  const sportEmojis = { Football: '🏈', Basketball: '🏀', Baseball: '⚾', Hockey: '🏒', Soccer: '⚽', Tennis: '🎾', Golf: '⛳', Racing: '🏎️', MMA: '🥊' };
  const emoji = sportEmojis[sport] || '🏆';
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-x-blue/10 text-x-blue rounded-full px-2 py-0.5 ml-1">
      {emoji} {league || sport}
    </span>
  );
}

function formatCount(n) {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function Post({ post: initialPost, compact = false, onDelete }) {
  const [post, setPost] = useState(initialPost);
  const [showActions, setShowActions] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!post) return null;

  // Repost display
  if (post.is_repost && post.repost_of) {
    return (
      <div className="post-card border-b border-x-border">
        <div className="flex items-center gap-2 px-4 pt-2 text-x-text-secondary text-xs">
          <Repeat2 size={14} />
          <Link to={`/${post.user?.username}`} className="hover:underline font-medium">
            {post.user?.display_name} reposted
          </Link>
        </div>
        <Post post={post.repost_of} compact={compact} onDelete={onDelete} />
      </div>
    );
  }

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      setPost(prev => ({ ...prev, liked: data.liked, likes_count: data.liked ? prev.likes_count + 1 : Math.max(0, prev.likes_count - 1) }));
    } catch {}
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/posts/${post.id}/repost`);
      setPost(prev => ({ ...prev, reposted: data.reposted, reposts_count: data.reposted ? prev.reposts_count + 1 : Math.max(0, prev.reposts_count - 1) }));
    } catch {}
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/posts/${post.id}/bookmark`);
      setPost(prev => ({ ...prev, bookmarked: data.bookmarked }));
    } catch {}
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
    } catch {}
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`).then(() => {});
  };

  const postUrl = `/${post.user?.username}/post/${post.id}`;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article
      className="post-card border-b border-x-border px-4 py-3 cursor-pointer"
      onClick={() => navigate(postUrl)}
    >
      {/* Reply indicator */}
      {post.is_reply && post.reply_to && (
        <div className="text-x-text-secondary text-xs mb-1">
          Replying to <Link to={`/${post.reply_to.username}`} className="text-x-blue hover:underline" onClick={e => e.stopPropagation()}>@{post.reply_to.username}</Link>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/${post.user?.username}`} onClick={e => e.stopPropagation()} className="shrink-0">
          <UserAvatar user={post.user} size={10} />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0 min-w-0">
              <Link
                to={`/${post.user?.username}`}
                onClick={e => e.stopPropagation()}
                className="font-bold text-x-text hover:underline truncate"
              >
                {post.user?.display_name}
              </Link>
              {post.user?.verified === 1 && <VerifiedBadge type={post.user.verified_type} />}
              <Link
                to={`/${post.user?.username}`}
                onClick={e => e.stopPropagation()}
                className="text-x-text-secondary text-sm truncate"
              >
                @{post.user?.username}
              </Link>
              <span className="text-x-text-secondary text-sm">·</span>
              <Link
                to={postUrl}
                onClick={e => e.stopPropagation()}
                className="text-x-text-secondary text-sm hover:underline shrink-0"
              >
                {timeAgo}
              </Link>
              {post.sport_tag && <SportTag sport={post.sport_tag} league={post.league_tag} />}
            </div>

            <div className="relative shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setShowActions(!showActions); }}
                className="text-x-text-secondary hover:text-x-blue p-1 rounded-full hover:bg-blue-500/10 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
              {showActions && (
                <div className="absolute right-0 top-8 bg-x-bg border border-x-border rounded-2xl shadow-xl z-10 min-w-[180px] overflow-hidden">
                  {user?.id === post.user_id && (
                    <button onClick={handleDelete} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-x-bg-hover text-sm font-bold">
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button onClick={handleShare} className="flex items-center gap-3 w-full px-4 py-3 text-x-text hover:bg-x-bg-hover text-sm">
                    <Share size={16} /> Copy link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-x-text text-[15px] leading-normal mt-1 whitespace-pre-wrap break-words">
            {post.content}
          </div>

          {/* Game tag */}
          {post.game_id && (
            <Link
              to={`/games/${post.game_id}`}
              onClick={e => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-2 border border-x-border rounded-xl px-3 py-2 text-xs text-x-text-secondary hover:bg-x-bg-hover transition-colors"
            >
              <span>🎮</span>
              <span>Game Thread</span>
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 max-w-[425px]" onClick={e => e.stopPropagation()}>
            {/* Reply */}
            <button
              onClick={() => navigate(postUrl)}
              className="group flex items-center gap-1.5 text-x-text-secondary hover:text-x-blue transition-colors"
            >
              <span className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <MessageCircle size={18} />
              </span>
              {post.replies_count > 0 && <span className="text-sm">{formatCount(post.replies_count)}</span>}
            </button>

            {/* Repost */}
            <button
              onClick={handleRepost}
              className={`group flex items-center gap-1.5 transition-colors ${post.reposted ? 'text-x-green' : 'text-x-text-secondary hover:text-x-green'}`}
            >
              <span className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 size={18} />
              </span>
              {post.reposts_count > 0 && <span className="text-sm">{formatCount(post.reposts_count)}</span>}
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={`group flex items-center gap-1.5 transition-colors ${post.liked ? 'text-x-red' : 'text-x-text-secondary hover:text-x-red'}`}
            >
              <span className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart size={18} fill={post.liked ? 'currentColor' : 'none'} />
              </span>
              {post.likes_count > 0 && <span className="text-sm">{formatCount(post.likes_count)}</span>}
            </button>

            {/* Views */}
            {post.views_count > 0 && (
              <div className="flex items-center gap-1.5 text-x-text-secondary">
                <span className="p-1.5"><BarChart2 size={18} /></span>
                <span className="text-sm">{formatCount(post.views_count)}</span>
              </div>
            )}

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={`group flex items-center gap-1.5 transition-colors ${post.bookmarked ? 'text-x-blue' : 'text-x-text-secondary hover:text-x-blue'}`}
            >
              <span className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <Bookmark size={18} fill={post.bookmarked ? 'currentColor' : 'none'} />
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="group flex items-center gap-1.5 text-x-text-secondary hover:text-x-blue transition-colors"
            >
              <span className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <Share size={18} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
