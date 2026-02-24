const express = require('express');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

function safeUser(user) {
  if (!user) return null;
  const { password_hash, email, ...safe } = user;
  return safe;
}

// Get user profile
router.get('/:username', optionalAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isFollowing = req.user ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, user.id) : false;
    const isFollowedBy = req.user ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(user.id, req.user.id) : false;

    res.json({ ...safeUser(user), favorite_sports: JSON.parse(user.favorite_sports || '[]'), is_following: isFollowing, follows_you: isFollowedBy });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user posts
router.get('/:username/posts', optionalAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { cursor, limit = 20, type = 'posts' } = req.query;
    const userId = req.user?.id;

    let query;
    const params = [user.id];

    if (type === 'replies') {
      query = 'SELECT * FROM posts WHERE user_id = ? AND is_reply = 1';
    } else if (type === 'media') {
      query = "SELECT * FROM posts WHERE user_id = ? AND media != '[]' AND media != ''";
    } else if (type === 'likes') {
      query = 'SELECT p.* FROM posts p JOIN likes l ON p.id = l.post_id WHERE l.user_id = ?';
    } else {
      query = 'SELECT * FROM posts WHERE user_id = ? AND is_reply = 0';
    }

    if (cursor) {
      query += ' AND created_at < ?';
      params.push(cursor);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const posts = db.prepare(query).all(...params);

    const enrichPost = (post) => {
      const author = db.prepare('SELECT id, username, display_name, avatar, verified, verified_type FROM users WHERE id = ?').get(post.user_id);
      const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
      const reposted = userId ? !!db.prepare('SELECT 1 FROM reposts WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
      const bookmarked = userId ? !!db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
      return { ...post, media: JSON.parse(post.media || '[]'), team_tags: JSON.parse(post.team_tags || '[]'), user: author, liked, reposted, bookmarked };
    };

    res.json({ posts: posts.map(enrichPost), cursor: posts.length === parseInt(limit) ? posts[posts.length - 1].created_at : null });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow / unfollow
router.post('/:username/follow', authMiddleware, (req, res) => {
  try {
    const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, target.id);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, target.id);
      db.prepare('UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE id = ?').run(target.id);
      db.prepare('UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?').run(req.user.id);
      res.json({ following: false });
    } else {
      db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, target.id);
      db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(target.id);
      db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(req.user.id);

      // Notification
      db.prepare('INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?, ?, ?, ?)').run(uuidv4(), target.id, req.user.id, 'follow');
      res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get followers
router.get('/:username/followers', optionalAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    const followers = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.bio, u.verified, u.verified_type, u.followers_count
      FROM users u
      JOIN follows f ON u.id = f.follower_id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT 50
    `).all(user.id);

    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following
router.get('/:username/following', optionalAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.bio, u.verified, u.verified_type, u.followers_count
      FROM users u
      JOIN follows f ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT 50
    `).all(user.id);

    res.json(following);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/me/profile', authMiddleware, (req, res) => {
  try {
    const { display_name, bio, location, website, favorite_team, favorite_sports } = req.body;

    db.prepare(`
      UPDATE users SET
        display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        location = COALESCE(?, location),
        website = COALESCE(?, website),
        favorite_team = COALESCE(?, favorite_team),
        favorite_sports = COALESCE(?, favorite_sports)
      WHERE id = ?
    `).run(
      display_name,
      bio,
      location,
      website,
      favorite_team,
      favorite_sports ? JSON.stringify(favorite_sports) : null,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const { password_hash, ...safe } = updated;
    res.json({ ...safe, favorite_sports: JSON.parse(safe.favorite_sports || '[]') });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search/query', optionalAuth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = db.prepare(`
      SELECT id, username, display_name, avatar, bio, verified, verified_type, followers_count
      FROM users
      WHERE username LIKE ? OR display_name LIKE ?
      ORDER BY followers_count DESC
      LIMIT 20
    `).all(`%${q}%`, `%${q}%`);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications
router.get('/me/notifications', authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT n.*, u.username, u.display_name, u.avatar, u.verified
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(req.user.id);

    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread notification count
router.get('/me/notifications/count', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(req.user.id);
    res.json({ count: result.count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bookmarks
router.get('/me/bookmarks', authMiddleware, (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT p.* FROM posts p
      JOIN bookmarks b ON p.id = b.post_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      LIMIT 50
    `).all(req.user.id);

    const userId = req.user.id;
    const enriched = posts.map(post => {
      const author = db.prepare('SELECT id, username, display_name, avatar, verified, verified_type FROM users WHERE id = ?').get(post.user_id);
      return { ...post, media: JSON.parse(post.media || '[]'), team_tags: JSON.parse(post.team_tags || '[]'), user: author, liked: true, bookmarked: true };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get suggested users to follow
router.get('/suggestions/who-to-follow', optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    let query;
    const params = [];

    if (userId) {
      query = `
        SELECT id, username, display_name, avatar, bio, verified, verified_type, followers_count
        FROM users
        WHERE id != ? AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
        ORDER BY followers_count DESC, RANDOM()
        LIMIT 5
      `;
      params.push(userId, userId);
    } else {
      query = 'SELECT id, username, display_name, avatar, bio, verified, verified_type, followers_count FROM users ORDER BY followers_count DESC LIMIT 5';
    }

    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
