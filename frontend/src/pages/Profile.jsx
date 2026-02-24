import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, Edit3 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../components/Sidebar';
import Post from '../components/Post';
import api from '../api/client';

const TABS = ['Posts', 'Replies', 'Media', 'Likes'];

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [following, setFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}`)
      .then(({ data }) => {
        setProfile(data);
        setFollowing(data.is_following);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate('/'); });
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    const typeMap = { Posts: 'posts', Replies: 'replies', Media: 'media', Likes: 'likes' };
    api.get(`/users/${username}/posts?type=${typeMap[activeTab]}&limit=20`)
      .then(({ data }) => { setPosts(data.posts || []); })
      .finally(() => setPostsLoading(false));
  }, [profile, activeTab, username]);

  const handleFollow = async () => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/users/${username}/follow`);
      setFollowing(data.following);
      setProfile(prev => ({
        ...prev,
        followers_count: data.following ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1)
      }));
    } catch {}
  };

  const isOwnProfile = currentUser?.username === username;

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="h-48 skeleton" />
        <div className="px-4">
          <div className="w-24 h-24 rounded-full skeleton -mt-12 mb-3" />
          <div className="skeleton h-5 w-40 mb-2 rounded" />
          <div className="skeleton h-4 w-24 mb-4 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const sportEmojis = { Football: '🏈', Basketball: '🏀', Baseball: '⚾', Hockey: '🏒', Soccer: '⚽' };

  return (
    <div>
      {/* Sticky Header */}
      <div className="sticky top-[48px] bg-x-bg/95 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-x-bg-hover rounded-full transition-colors">
          <ArrowLeft size={20} className="text-x-text" />
        </button>
        <div>
          <div className="text-x-text font-bold text-xl">{profile.display_name}</div>
          <div className="text-x-text-secondary text-sm">{profile.posts_count} posts</div>
        </div>
      </div>

      {/* Banner */}
      <div className="h-48 bg-gradient-to-br from-x-blue/30 via-x-bg-secondary to-x-bg-secondary relative">
        {profile.banner && <img src={profile.banner} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <UserAvatar user={profile} size={24} className="border-4 border-x-bg rounded-full" />
          <div className="flex gap-2 mt-14">
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-1.5 border border-x-border rounded-full text-x-text font-bold text-sm hover:bg-x-bg-hover transition-colors"
              >
                <Edit3 size={16} /> Edit profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-5 py-1.5 rounded-full font-bold text-sm transition-colors
                  ${following
                    ? 'border border-x-border text-x-text hover:border-red-500 hover:text-red-500'
                    : 'bg-white text-black hover:bg-gray-200'
                  }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Name + Handle */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-x-text font-bold text-xl">{profile.display_name}</h1>
            {profile.verified === 1 && (
              <span className={`text-base ${profile.verified_type === 'athlete' ? 'text-x-blue' : profile.verified_type === 'organization' ? 'text-sports-gold' : 'text-x-blue'}`}>✓</span>
            )}
          </div>
          <div className="text-x-text-secondary">@{profile.username}</div>
          {profile.follows_you && !isOwnProfile && (
            <span className="text-xs bg-x-bg-secondary text-x-text-secondary rounded-sm px-1 py-0.5 mt-1 inline-block">Follows you</span>
          )}
        </div>

        {/* Bio */}
        {profile.bio && <p className="text-x-text mb-3 whitespace-pre-wrap">{profile.bio}</p>}

        {/* Sports tags */}
        {profile.favorite_sports?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.favorite_sports.map(sport => (
              <span key={sport} className="text-xs bg-x-blue/10 text-x-blue rounded-full px-3 py-1 font-medium">
                {sportEmojis[sport] || '🏆'} {sport}
              </span>
            ))}
            {profile.favorite_team && (
              <span className="text-xs bg-sports-gold/10 text-sports-gold rounded-full px-3 py-1 font-medium">
                ⭐ {profile.favorite_team}
              </span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-x-text-secondary text-sm mb-3">
          {profile.location && (
            <span className="flex items-center gap-1"><MapPin size={16} />{profile.location}</span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-x-blue hover:underline">
              <LinkIcon size={16} />{profile.website}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={16} />Joined {format(new Date(profile.joined_at || profile.created_at), 'MMMM yyyy')}
          </span>
        </div>

        {/* Followers / Following */}
        <div className="flex gap-4 text-sm">
          <button className="hover:underline">
            <span className="text-x-text font-bold">{profile.following_count?.toLocaleString()}</span>
            <span className="text-x-text-secondary ml-1">Following</span>
          </button>
          <button className="hover:underline">
            <span className="text-x-text font-bold">{profile.followers_count?.toLocaleString()}</span>
            <span className="text-x-text-secondary ml-1">Followers</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[48px] bg-x-bg border-b border-x-border flex z-10">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-bold hover:bg-x-bg-hover transition-colors relative
              ${activeTab === tab ? 'text-x-text' : 'text-x-text-secondary'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-x-blue rounded-full" />}
          </button>
        ))}
      </div>

      {/* Posts */}
      {postsLoading ? (
        <div className="p-8 text-center text-x-text-secondary">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <div className="text-x-text font-bold text-xl">No posts yet</div>
          <div className="text-x-text-secondary text-sm mt-1">
            {isOwnProfile ? "Share your first sports take!" : `${profile.display_name} hasn't posted yet`}
          </div>
        </div>
      ) : (
        posts.map(post => (
          <Post key={post.id} post={post} onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />
        ))
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setProfile(prev => ({ ...prev, ...updated }));
            updateUser(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
    favorite_team: profile.favorite_team || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/me/profile', form);
      onSave(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-x-bg border border-x-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-x-border">
          <button onClick={onClose} className="text-x-text-secondary hover:text-x-text">✕</button>
          <h2 className="text-x-text font-bold text-xl">Edit profile</h2>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-1.5 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {[
            { key: 'display_name', label: 'Display name', maxLength: 50 },
            { key: 'bio', label: 'Bio', maxLength: 160, textarea: true },
            { key: 'location', label: 'Location', maxLength: 30 },
            { key: 'website', label: 'Website', maxLength: 100 },
            { key: 'favorite_team', label: 'Favorite team', maxLength: 50 },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-x-text-secondary text-sm mb-1">{field.label}</label>
              {field.textarea ? (
                <textarea
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  maxLength={field.maxLength}
                  rows={3}
                  className="w-full bg-transparent border border-x-border rounded-lg px-3 py-2 text-x-text focus:outline-none focus:border-x-blue resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  maxLength={field.maxLength}
                  className="w-full bg-transparent border border-x-border rounded-lg px-3 py-2 text-x-text focus:outline-none focus:border-x-blue"
                />
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}
