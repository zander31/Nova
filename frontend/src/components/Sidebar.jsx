import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Search, Bell, Bookmark, User, LogOut, LogIn,
  Trophy, Zap, MoreHorizontal
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/sports', icon: Trophy, label: 'Sports' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/notifications', icon: Bell, label: 'Notifications', authRequired: true },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks', authRequired: true },
];

export default function Sidebar({ mobile }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`flex flex-col h-full py-2 ${mobile ? 'items-center px-2' : 'px-4'}`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 p-3 rounded-full hover:bg-x-bg-hover transition-colors mb-2">
        <span className="text-2xl">🏆</span>
        {!mobile && <span className="text-x-text font-bold text-xl">SportsX</span>}
      </Link>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, icon: Icon, label, authRequired }) => {
          if (authRequired && !user) return null;
          const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-4 p-3 rounded-full transition-colors hover:bg-x-bg-hover
                ${isActive ? 'font-bold text-x-text' : 'text-x-text'}`}
            >
              <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
              {!mobile && <span className="text-xl">{label}</span>}
            </Link>
          );
        })}

        {user && (
          <Link
            to={`/${user.username}`}
            className={`flex items-center gap-4 p-3 rounded-full transition-colors hover:bg-x-bg-hover
              ${pathname === `/${user.username}` ? 'font-bold text-x-text' : 'text-x-text'}`}
          >
            <User size={26} strokeWidth={pathname === `/${user.username}` ? 2.5 : 2} />
            {!mobile && <span className="text-xl">Profile</span>}
          </Link>
        )}
      </nav>

      {/* Post Button */}
      {user && (
        <div className="my-4">
          {mobile ? (
            <Link to="/" className="flex items-center justify-center w-12 h-12 bg-x-blue rounded-full text-white hover:bg-x-blue-hover transition-colors">
              <Zap size={20} fill="white" />
            </Link>
          ) : (
            <Link
              to="/"
              className="flex items-center justify-center w-full py-3 bg-x-blue text-white rounded-full font-bold text-lg hover:bg-x-blue-hover transition-colors"
            >
              Post
            </Link>
          )}
        </div>
      )}

      {/* User info / Login */}
      {user ? (
        <div className={`flex items-center gap-3 p-3 rounded-full hover:bg-x-bg-hover cursor-pointer transition-colors ${mobile ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size={10} />
            {!mobile && (
              <div className="min-w-0">
                <div className="text-x-text font-bold text-sm truncate">{user.display_name}</div>
                <div className="text-x-text-secondary text-sm truncate">@{user.username}</div>
              </div>
            )}
          </div>
          {!mobile && (
            <button onClick={handleLogout} className="text-x-text-secondary hover:text-x-text ml-auto">
              <LogOut size={18} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-auto">
          {!mobile && (
            <>
              <Link to="/register" className="w-full py-2 border border-x-border text-x-text rounded-full font-bold text-sm text-center hover:bg-x-bg-hover transition-colors">
                Create account
              </Link>
              <Link to="/login" className="w-full py-2 bg-x-blue text-white rounded-full font-bold text-sm text-center hover:bg-x-blue-hover transition-colors">
                Sign in
              </Link>
            </>
          )}
          {mobile && (
            <Link to="/login" className="flex items-center justify-center w-10 h-10 text-x-text-secondary hover:text-x-text">
              <LogIn size={22} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function UserAvatar({ user, size = 10, className = '' }) {
  if (!user) return null;

  const isColor = user.avatar && user.avatar.startsWith('#');
  const initials = user.display_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?';

  if (isColor) {
    return (
      <div
        className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        style={{ backgroundColor: user.avatar, width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.6}px` }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={user.avatar}
      alt={user.display_name}
      className={`w-${size} h-${size} rounded-full object-cover shrink-0 ${className}`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}
