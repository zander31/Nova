import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Sports from './pages/Sports';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import GameThreadPage from './pages/GameThreadPage';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-x-bg"><div className="text-x-text-secondary">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-x-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl">🏆</div>
          <div className="text-x-text font-bold text-xl">SportsX</div>
          <div className="text-x-text-secondary text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/search" element={<Search />} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
        <Route path="/games/:id" element={<GameThreadPage />} />
        <Route path="/:username" element={<Profile />} />
        <Route path="/:username/post/:postId" element={<PostDetail />} />
        <Route path="/post/:postId" element={<PostDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
