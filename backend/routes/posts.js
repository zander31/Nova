const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function enrichPost(post, userId) {
  const user = db.prepare('SELECT id, username, display_name, avatar, verified, verified_type FROM users WHERE id = ?').get(post.user_id);
  const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
  const reposted = userId ? !!db.prepare('SELECT 1 FROM reposts WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
  const bookmarked = userId ? !!db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;

  let repost_of = null;
  if (post.is_repost && post.repost_of_id) {
    const originalPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.repost_of_id);
    if (originalPost) {
      repost_of = enrichPost(originalPost, userId);
    }
  }

  let reply_to = null;
  if (post.is_reply && post.reply_to_id) {
    const parent = db.prepare('SELECT p.*, u.username, u.display_name FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?').get(post.reply_to_id);
    if (parent) reply_to = { id: parent.id, username: parent.username, display_name: parent.display_name };
  }

  return {
    ...post,
    media: JSON.parse(post.media || '[]'),
    team_tags: JSON.parse(post.team_tags || '[]'),
    user,
    liked,
    reposted,
    bookmarked,
    repost_of,
    reply_to
  };
}

// Get home feed
router.get('/feed', optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { cursor, limit = 20, sport, league } = req.query;

    let query = `
      SELECT p.* FROM posts p
      WHERE p.is_reply = 0
    `;
    const params = [];

    if (userId) {
      query = `
        SELECT p.* FROM posts p
        WHERE p.is_reply = 0
        AND (p.user_id = ? OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))
      `;
      params.push(userId, userId);
    }

    if (sport) {
      query += ' AND p.sport_tag = ?';
      params.push(sport);
    }

    if (league) {
      query += ' AND p.league_tag = ?';
      params.push(league);
    }

    if (cursor) {
      query += ' AND p.created_at < ?';
      params.push(cursor);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const posts = db.prepare(query).all(...params);
    const enriched = posts.map(p => enrichPost(p, userId));

    res.json({ posts: enriched, cursor: posts.length === parseInt(limit) ? posts[posts.length - 1].created_at : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get explore/trending posts
router.get('/explore', optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { sport, league, cursor, limit = 20 } = req.query;

    let query = `SELECT p.* FROM posts p WHERE p.is_reply = 0`;
    const params = [];

    if (sport) { query += ' AND p.sport_tag = ?'; params.push(sport); }
    if (league) { query += ' AND p.league_tag = ?'; params.push(league); }
    if (cursor) { query += ' AND p.created_at < ?'; params.push(cursor); }

    query += ' ORDER BY (p.likes_count + p.reposts_count * 2 + p.replies_count) DESC, p.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const posts = db.prepare(query).all(...params);
    const enriched = posts.map(p => enrichPost(p, userId));

    res.json({ posts: enriched, cursor: posts.length === parseInt(limit) ? posts[posts.length - 1].created_at : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post
router.post('/', authMiddleware, (req, res) => {
  try {
    const { content, sport_tag, league_tag, team_tags, game_id, reply_to_id, poll } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content required' });
    }

    if (content.length > 280) {
      return res.status(400).json({ error: 'Post too long (max 280 characters)' });
    }

    const id = uuidv4();
    const is_reply = !!reply_to_id;

    db.prepare(`
      INSERT INTO posts (id, user_id, content, sport_tag, league_tag, team_tags, game_id, is_reply, reply_to_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      content.trim(),
      sport_tag || '',
      league_tag || '',
      JSON.stringify(team_tags || []),
      game_id || '',
      is_reply ? 1 : 0,
      reply_to_id || ''
    );

    // Update reply count on parent
    if (reply_to_id) {
      db.prepare('UPDATE posts SET replies_count = replies_count + 1 WHERE id = ?').run(reply_to_id);
    }

    // Update user post count
    db.prepare('UPDATE users SET posts_count = posts_count + 1 WHERE id = ?').run(req.user.id);

    // Handle poll
    if (poll) {
      db.prepare(`
        INSERT INTO polls (id, post_id, question, options, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, poll.question, JSON.stringify(poll.options), poll.expires_at);
    }

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    res.status(201).json(enrichPost(post, req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post + replies
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Increment views
    db.prepare('UPDATE posts SET views_count = views_count + 1 WHERE id = ?').run(req.params.id);

    const replies = db.prepare('SELECT * FROM posts WHERE is_reply = 1 AND reply_to_id = ? ORDER BY created_at ASC LIMIT 50').all(req.params.id);

    const poll = db.prepare('SELECT * FROM polls WHERE post_id = ?').get(req.params.id);

    res.json({
      post: enrichPost(post, userId),
      replies: replies.map(r => enrichPost(r, userId)),
      poll: poll ? { ...poll, options: JSON.parse(poll.options), votes: JSON.parse(poll.votes) } : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like / unlike post
router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, id);

    if (existing) {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, id);
      db.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)').run(userId, id);
      db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(id);

      // Create notification
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(id);
      if (post && post.user_id !== userId) {
        db.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), post.user_id, userId, 'like', id);
      }

      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Repost / unrepost
router.post('/:id/repost', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = db.prepare('SELECT 1 FROM reposts WHERE user_id = ? AND post_id = ?').get(userId, id);

    if (existing) {
      db.prepare('DELETE FROM reposts WHERE user_id = ? AND post_id = ?').run(userId, id);
      db.prepare('UPDATE posts SET reposts_count = MAX(0, reposts_count - 1) WHERE id = ?').run(id);
      // Remove the repost post
      db.prepare('DELETE FROM posts WHERE is_repost = 1 AND repost_of_id = ? AND user_id = ?').run(id, userId);
      res.json({ reposted: false });
    } else {
      db.prepare('INSERT OR IGNORE INTO reposts (user_id, post_id) VALUES (?, ?)').run(userId, id);
      db.prepare('UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = ?').run(id);

      // Create repost entry in posts
      const originalPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
      if (originalPost) {
        const repostId = uuidv4();
        db.prepare(`
          INSERT INTO posts (id, user_id, content, sport_tag, league_tag, is_repost, repost_of_id)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `).run(repostId, userId, '', originalPost.sport_tag, originalPost.league_tag, id);
      }

      res.json({ reposted: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bookmark
router.post('/:id/bookmark', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').get(userId, id);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').run(userId, id);
      res.json({ bookmarked: false });
    } else {
      db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)').run(userId, id);
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Vote on poll
router.post('/:id/poll/vote', authMiddleware, (req, res) => {
  try {
    const { option_index } = req.body;
    const poll = db.prepare('SELECT * FROM polls WHERE post_id = ?').get(req.params.id);

    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const votes = JSON.parse(poll.votes);
    votes[req.user.id] = option_index;

    db.prepare('UPDATE polls SET votes = ? WHERE id = ?').run(JSON.stringify(votes), poll.id);

    res.json({ success: true, votes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE users SET posts_count = MAX(0, posts_count - 1) WHERE id = ?').run(req.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
