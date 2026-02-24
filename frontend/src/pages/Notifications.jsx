import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Repeat2, UserPlus, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '../components/Sidebar';
import api from '../api/client';

const iconMap = {
  like: <Heart size={18} className="text-x-red" fill="currentColor" />,
  repost: <Repeat2 size={18} className="text-x-green" />,
  follow: <UserPlus size={18} className="text-x-blue" />,
  reply: <MessageCircle size={18} className="text-x-blue" />,
};

const textMap = {
  like: 'liked your post',
  repost: 'reposted your post',
  follow: 'followed you',
  reply: 'replied to your post',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/users/me/notifications')
      .then(({ data }) => setNotifications(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'mentions'
    ? notifications.filter(n => n.type === 'reply')
    : notifications;

  return (
    <div>
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 border-b border-x-border">
        <div className="px-4 py-3">
          <h1 className="text-x-text font-bold text-xl">Notifications</h1>
        </div>
        <div className="flex">
          {['all', 'mentions'].map(t => (
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
      </div>

      {loading ? (
        <div className="p-8 text-center text-x-text-secondary">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <div className="text-x-text font-bold text-2xl">Nothing to see here yet</div>
          <div className="text-x-text-secondary text-sm mt-2 max-w-xs">
            When someone likes, reposts, or follows you, you'll see it here
          </div>
        </div>
      ) : (
        <div className="divide-y divide-x-border">
          {filtered.map(notif => (
            <div key={notif.id} className="flex items-start gap-4 px-4 py-4 hover:bg-x-bg-hover transition-colors">
              <div className="w-10 flex justify-center mt-1 shrink-0">
                {iconMap[notif.type] || <span>🔔</span>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/${notif.username}`} className="inline-block mb-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: '#1D9BF0' }}>
                    {notif.display_name?.charAt(0)}
                  </div>
                </Link>
                <div className="text-x-text text-sm">
                  <Link to={`/${notif.username}`} className="font-bold hover:underline">{notif.display_name}</Link>
                  {' '}{textMap[notif.type] || 'interacted with you'}
                </div>
                <div className="text-x-text-secondary text-xs mt-0.5">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
