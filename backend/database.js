const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'sports.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    banner TEXT DEFAULT '',
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    favorite_team TEXT DEFAULT '',
    favorite_sports TEXT DEFAULT '[]',
    verified INTEGER DEFAULT 0,
    verified_type TEXT DEFAULT '',
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    media TEXT DEFAULT '[]',
    sport_tag TEXT DEFAULT '',
    league_tag TEXT DEFAULT '',
    team_tags TEXT DEFAULT '[]',
    game_id TEXT DEFAULT '',
    is_reply INTEGER DEFAULT 0,
    reply_to_id TEXT DEFAULT '',
    is_repost INTEGER DEFAULT 0,
    repost_of_id TEXT DEFAULT '',
    likes_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS reposts (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    sport TEXT NOT NULL,
    league TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled',
    period TEXT DEFAULT '',
    time_remaining TEXT DEFAULT '',
    start_time TEXT NOT NULL,
    venue TEXT DEFAULT '',
    broadcast TEXT DEFAULT '',
    thread_post_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    post_id TEXT DEFAULT '',
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    votes TEXT DEFAULT '{}',
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
