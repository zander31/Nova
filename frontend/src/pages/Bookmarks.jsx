import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import Post from '../components/Post';
import api from '../api/client';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/bookmarks')
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 px-4 py-3 border-b border-x-border">
        <h1 className="text-x-text font-bold text-xl">Bookmarks</h1>
      </div>

      {loading ? (
        <div className="p-8 text-center text-x-text-secondary">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center px-8">
          <div className="p-6 rounded-full border-2 border-x-border mb-4">
            <Bookmark size={40} className="text-x-text" />
          </div>
          <div className="text-x-text font-bold text-2xl">Save posts for later</div>
          <div className="text-x-text-secondary text-sm mt-2 max-w-xs">
            Bookmark posts to easily find them again in the future.
          </div>
        </div>
      ) : (
        <div>
          <div className="px-4 py-2 text-x-text-secondary text-sm border-b border-x-border">
            {posts.length} bookmarked posts
          </div>
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
