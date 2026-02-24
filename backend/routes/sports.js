const express = require('express');
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get live/recent games
router.get('/games', optionalAuth, (req, res) => {
  try {
    const { sport, league, status } = req.query;
    let query = 'SELECT * FROM games WHERE 1=1';
    const params = [];

    if (sport) { query += ' AND sport = ?'; params.push(sport); }
    if (league) { query += ' AND league = ?'; params.push(league); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY start_time DESC LIMIT 50';

    const games = db.prepare(query).all(...params);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single game + thread posts
router.get('/games/:id', optionalAuth, (req, res) => {
  try {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const userId = req.user?.id;
    const threadPosts = db.prepare(`
      SELECT p.*, u.username, u.display_name, u.avatar, u.verified, u.verified_type
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.game_id = ? AND p.is_reply = 0
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(req.params.id);

    const enriched = threadPosts.map(post => {
      const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
      return {
        ...post,
        media: JSON.parse(post.media || '[]'),
        team_tags: JSON.parse(post.team_tags || '[]'),
        user: { id: post.user_id, username: post.username, display_name: post.display_name, avatar: post.avatar, verified: post.verified, verified_type: post.verified_type },
        liked
      };
    });

    res.json({ game, posts: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get trending sports topics
router.get('/trending', (req, res) => {
  try {
    const { sport } = req.query;

    // Aggregate hashtags from recent posts
    let query = `
      SELECT sport_tag, league_tag, team_tags, content, created_at
      FROM posts
      WHERE created_at > datetime('now', '-24 hours')
    `;
    const params = [];

    if (sport) { query += ' AND sport_tag = ?'; params.push(sport); }

    const posts = db.prepare(query).all(...params);

    // Count hashtags
    const hashtagCounts = {};
    const hashtagSports = {};

    posts.forEach(post => {
      const matches = (post.content || '').match(/#[\w]+/g) || [];
      matches.forEach(tag => {
        const t = tag.toLowerCase();
        hashtagCounts[t] = (hashtagCounts[t] || 0) + 1;
        hashtagSports[t] = post.sport_tag || '';
      });

      // Add sport/league/team as trending
      if (post.sport_tag) {
        const key = `#${post.sport_tag.toLowerCase()}`;
        hashtagCounts[key] = (hashtagCounts[key] || 0) + 1;
        hashtagSports[key] = post.sport_tag;
      }
      if (post.league_tag) {
        const key = `#${post.league_tag.toLowerCase()}`;
        hashtagCounts[key] = (hashtagCounts[key] || 0) + 1;
        hashtagSports[key] = post.sport_tag;
      }
    });

    const trending = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count, sport: hashtagSports[tag] || '' }));

    // Add static trending if not enough
    const staticTrending = [
      { tag: '#NFL', count: 45820, sport: 'Football' },
      { tag: '#NBA', count: 38100, sport: 'Basketball' },
      { tag: '#SuperBowl', count: 102300, sport: 'Football' },
      { tag: '#NBAPlayoffs', count: 28700, sport: 'Basketball' },
      { tag: '#MLB', count: 15200, sport: 'Baseball' },
      { tag: '#NHL', count: 12400, sport: 'Hockey' },
      { tag: '#UCL', count: 88500, sport: 'Soccer' },
      { tag: '#PremierLeague', count: 67200, sport: 'Soccer' },
      { tag: '#MLS', count: 9800, sport: 'Soccer' },
      { tag: '#TennisMasters', count: 7600, sport: 'Tennis' },
    ];

    const combined = [...trending];
    staticTrending.forEach(st => {
      if (!combined.find(t => t.tag.toLowerCase() === st.tag.toLowerCase())) {
        combined.push(st);
      }
    });

    res.json(combined.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search posts
router.get('/search', optionalAuth, (req, res) => {
  try {
    const { q, sport, league, type = 'posts' } = req.query;
    const userId = req.user?.id;

    if (!q) return res.json({ posts: [], users: [] });

    const posts = db.prepare(`
      SELECT p.* FROM posts p
      WHERE (p.content LIKE ? OR p.sport_tag LIKE ? OR p.league_tag LIKE ?)
      ${sport ? 'AND p.sport_tag = ?' : ''}
      ${league ? 'AND p.league_tag = ?' : ''}
      ORDER BY p.created_at DESC
      LIMIT 30
    `).all(...[`%${q}%`, `%${q}%`, `%${q}%`, ...(sport ? [sport] : []), ...(league ? [league] : [])]);

    const enrichPost = (post) => {
      const author = db.prepare('SELECT id, username, display_name, avatar, verified, verified_type FROM users WHERE id = ?').get(post.user_id);
      const liked = userId ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, post.id) : false;
      return { ...post, media: JSON.parse(post.media || '[]'), team_tags: JSON.parse(post.team_tags || '[]'), user: author, liked };
    };

    res.json({ posts: posts.map(enrichPost) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leagues list
router.get('/leagues', (req, res) => {
  res.json([
    { id: 'nfl', name: 'NFL', sport: 'Football', logo: '🏈' },
    { id: 'nba', name: 'NBA', sport: 'Basketball', logo: '🏀' },
    { id: 'mlb', name: 'MLB', sport: 'Baseball', logo: '⚾' },
    { id: 'nhl', name: 'NHL', sport: 'Hockey', logo: '🏒' },
    { id: 'mls', name: 'MLS', sport: 'Soccer', logo: '⚽' },
    { id: 'epl', name: 'Premier League', sport: 'Soccer', logo: '⚽' },
    { id: 'ucl', name: 'Champions League', sport: 'Soccer', logo: '⚽' },
    { id: 'ncaaf', name: 'College Football', sport: 'Football', logo: '🏈' },
    { id: 'ncaab', name: 'College Basketball', sport: 'Basketball', logo: '🏀' },
    { id: 'atp', name: 'ATP Tennis', sport: 'Tennis', logo: '🎾' },
    { id: 'pga', name: 'PGA Tour', sport: 'Golf', logo: '⛳' },
    { id: 'f1', name: 'Formula 1', sport: 'Racing', logo: '🏎️' },
    { id: 'ufc', name: 'UFC', sport: 'MMA', logo: '🥊' },
  ]);
});

module.exports = router;
