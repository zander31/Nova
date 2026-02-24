import { useState, useEffect, useCallback, useRef } from 'react';
import PostComposer from '../components/PostComposer';
import Post from '../components/Post';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const SPORTS_FILTERS = [
  { label: 'For You', value: null },
  { label: '🏈 NFL', value: { sport: 'Football', league: 'NFL' } },
  { label: '🏀 NBA', value: { sport: 'Basketball', league: 'NBA' } },
  { label: '⚽ Soccer', value: { sport: 'Soccer' } },
  { label: '⚾ MLB', value: { sport: 'Baseball', league: 'MLB' } },
  { label: '🏒 NHL', value: { sport: 'Hockey', league: 'NHL' } },
  { label: '🏎️ F1', value: { sport: 'Racing', league: 'F1' } },
];

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [tab, setTab] = useState('for-you'); // 'for-you' | 'following'
  const loaderRef = useRef(null);

  const fetchPosts = useCallback(async (reset = false) => {
    if (!reset && !cursor && posts.length > 0) return;
    if (!reset) setLoadingMore(true);
    else setLoading(true);

    const filter = SPORTS_FILTERS[activeFilter].value;
    const params = new URLSearchParams({ limit: 20 });
    if (filter?.sport) params.set('sport', filter.sport);
    if (filter?.league) params.set('league', filter.league);
    if (!reset && cursor) params.set('cursor', cursor);

    const endpoint = tab === 'following' && user ? '/posts/feed' : '/posts/explore';

    try {
      const { data } = await api.get(`${endpoint}?${params}`);
      setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
      setCursor(data.cursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter, cursor, posts.length, tab, user]);

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    fetchPosts(true);
  }, [activeFilter, tab]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && cursor && !loadingMore) fetchPosts(false); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [cursor, loadingMore, fetchPosts]);

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 border-b border-x-border">
        <div className="flex">
          <button
            onClick={() => setTab('for-you')}
            className={`flex-1 py-4 text-sm font-bold hover:bg-x-bg-hover transition-colors relative
              ${tab === 'for-you' ? 'text-x-text' : 'text-x-text-secondary'}`}
          >
            For you
            {tab === 'for-you' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-x-blue rounded-full" />}
          </button>
          {user && (
            <button
              onClick={() => setTab('following')}
              className={`flex-1 py-4 text-sm font-bold hover:bg-x-bg-hover transition-colors relative
                ${tab === 'following' ? 'text-x-text' : 'text-x-text-secondary'}`}
            >
              Following
              {tab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-x-blue rounded-full" />}
            </button>
          )}
        </div>

        {/* Sports Filter Pills */}
        <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {SPORTS_FILTERS.map((filter, i) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeFilter === i ? 'bg-white text-black' : 'text-x-text-secondary hover:bg-x-bg-hover border border-x-border'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <PostComposer
        onPost={handleNewPost}
        sport={SPORTS_FILTERS[activeFilter].value?.sport}
        league={SPORTS_FILTERS[activeFilter].value?.league}
      />

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-0">
          {[...Array(5)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="text-5xl mb-4">🏆</div>
          <div className="text-x-text font-bold text-xl mb-2">No posts yet</div>
          <div className="text-x-text-secondary">Be the first to post about sports!</div>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <Post key={post.id} post={post} onDelete={handleDeletePost} />
          ))}
          <div ref={loaderRef} className="h-20 flex items-center justify-center">
            {loadingMore && <div className="text-x-text-secondary text-sm">Loading more...</div>}
            {!cursor && !loadingMore && <div className="text-x-text-secondary text-sm py-4">You're all caught up! 🏆</div>}
          </div>
        </>
      )}
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="border-b border-x-border px-4 py-3 flex gap-3">
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex gap-8 mt-2">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-4 w-10 rounded" />)}
        </div>
      </div>
    </div>
  );
}
