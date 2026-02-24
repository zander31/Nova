const db = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('Seeding database...');

async function seed() {
  // Clear existing data
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM bookmarks;
    DELETE FROM reposts;
    DELETE FROM likes;
    DELETE FROM follows;
    DELETE FROM polls;
    DELETE FROM posts;
    DELETE FROM games;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create users
  const users = [
    { id: uuidv4(), username: 'espn', display_name: 'ESPN', bio: 'Serving sports fans. Anytime. Anywhere.', avatar: '#FF6B35', verified: 1, verified_type: 'media', followers: 47200000 },
    { id: uuidv4(), username: 'nfl', display_name: 'NFL', bio: 'Official Twitter of the NFL', avatar: '#013369', verified: 1, verified_type: 'organization', followers: 24100000 },
    { id: uuidv4(), username: 'nba', display_name: 'NBA', bio: 'Official Twitter of the NBA', avatar: '#C9082A', verified: 1, verified_type: 'organization', followers: 35800000 },
    { id: uuidv4(), username: 'lebronjames', display_name: 'LeBron James', bio: 'Just a kid from Akron. Nothing is given, everything is earned. 🏆🏆🏆🏆', avatar: '#552583', verified: 1, verified_type: 'athlete', followers: 52300000 },
    { id: uuidv4(), username: 'patrickmahomes', display_name: 'Patrick Mahomes', bio: 'QB15 | Kansas City Chiefs | Super Bowl Champion 🏆', avatar: '#E31837', verified: 1, verified_type: 'athlete', followers: 4200000 },
    { id: uuidv4(), username: 'stephencurry30', display_name: 'Stephen Curry', bio: 'Chef Curry | Golden State Warriors | 4x NBA Champion', avatar: '#006BB6', verified: 1, verified_type: 'athlete', followers: 19800000 },
    { id: uuidv4(), username: 'cfnews', display_name: 'Champions Football', bio: 'Latest news from the world of football ⚽', avatar: '#3D195B', verified: 1, verified_type: 'media', followers: 8900000 },
    { id: uuidv4(), username: 'sportsanalyst', display_name: 'Mike Thompson', bio: 'Sports analyst | Former NFL scout | Hot takes daily 🔥', avatar: '#2D7DD2', verified: 0, verified_type: '', followers: 145000 },
    { id: uuidv4(), username: 'celticsally', display_name: 'Celtics Sally', bio: 'Die-hard Celtics fan 🍀 | Boston born and raised', avatar: '#007A33', verified: 0, verified_type: '', followers: 8200 },
    { id: uuidv4(), username: 'chiefskc', display_name: 'Chiefs Kingdom', bio: 'Kansas City Chiefs fan page 🔴🏈 | Run by fans for fans', avatar: '#E31837', verified: 0, verified_type: '', followers: 52000 },
    { id: uuidv4(), username: 'demo_user', display_name: 'Demo User', bio: 'Sports fan | Just here to talk sports 🏆', avatar: '#6C757D', verified: 0, verified_type: '', followers: 42 },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, display_name, email, password_hash, bio, avatar, verified, verified_type, followers_count, following_count, posts_count, favorite_sports)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach(u => {
    insertUser.run(u.id, u.username, u.display_name, `${u.username}@example.com`, passwordHash, u.bio, u.avatar, u.verified, u.verified_type, u.followers, Math.floor(Math.random() * 500), 0, '["Football","Basketball","Soccer"]');
  });

  const [espn, nfl, nba, lebron, mahomes, curry, cfnews, analyst, celticsfan, chiefsfan, demo] = users;

  // Create follows
  const insertFollow = db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)');
  const followPairs = [
    [demo.id, espn.id], [demo.id, nfl.id], [demo.id, nba.id], [demo.id, lebron.id],
    [demo.id, mahomes.id], [demo.id, curry.id], [demo.id, analyst.id],
    [celticsfan.id, lebron.id], [celticsfan.id, nba.id], [celticsfan.id, curry.id],
    [chiefsfan.id, mahomes.id], [chiefsfan.id, nfl.id], [analyst.id, espn.id],
    [lebron.id, mahomes.id], [curry.id, lebron.id], [mahomes.id, nfl.id],
  ];
  followPairs.forEach(([a, b]) => {
    insertFollow.run(a, b);
    db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(a);
    db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(b);
  });

  // Create games
  const now = new Date();
  const games = [
    {
      id: uuidv4(),
      sport: 'Basketball', league: 'NBA',
      home_team: 'Boston Celtics', away_team: 'Los Angeles Lakers',
      home_score: 108, away_score: 102,
      status: 'live', period: 'Q4', time_remaining: '2:34',
      start_time: new Date(now - 2 * 3600000).toISOString(),
      venue: 'TD Garden, Boston', broadcast: 'ESPN'
    },
    {
      id: uuidv4(),
      sport: 'Football', league: 'NFL',
      home_team: 'Kansas City Chiefs', away_team: 'San Francisco 49ers',
      home_score: 21, away_score: 17,
      status: 'live', period: 'Q3', time_remaining: '8:45',
      start_time: new Date(now - 1.5 * 3600000).toISOString(),
      venue: 'Arrowhead Stadium, KC', broadcast: 'CBS'
    },
    {
      id: uuidv4(),
      sport: 'Soccer', league: 'Premier League',
      home_team: 'Manchester City', away_team: 'Arsenal',
      home_score: 2, away_score: 1,
      status: 'live', period: '2nd Half', time_remaining: "67'",
      start_time: new Date(now - 1 * 3600000).toISOString(),
      venue: 'Etihad Stadium, Manchester', broadcast: 'NBC Sports'
    },
    {
      id: uuidv4(),
      sport: 'Hockey', league: 'NHL',
      home_team: 'New York Rangers', away_team: 'Toronto Maple Leafs',
      home_score: 3, away_score: 2,
      status: 'live', period: '3rd Period', time_remaining: '4:12',
      start_time: new Date(now - 1.8 * 3600000).toISOString(),
      venue: 'Madison Square Garden, NY', broadcast: 'ESPN+'
    },
    {
      id: uuidv4(),
      sport: 'Baseball', league: 'MLB',
      home_team: 'New York Yankees', away_team: 'Houston Astros',
      home_score: 5, away_score: 3,
      status: 'final', period: 'Final', time_remaining: '',
      start_time: new Date(now - 4 * 3600000).toISOString(),
      venue: 'Yankee Stadium, NY', broadcast: 'FS1'
    },
    {
      id: uuidv4(),
      sport: 'Basketball', league: 'NBA',
      home_team: 'Golden State Warriors', away_team: 'Phoenix Suns',
      home_score: 0, away_score: 0,
      status: 'scheduled', period: '', time_remaining: '',
      start_time: new Date(now.getTime() + 3 * 3600000).toISOString(),
      venue: 'Chase Center, San Francisco', broadcast: 'TNT'
    },
    {
      id: uuidv4(),
      sport: 'Soccer', league: 'UEFA Champions League',
      home_team: 'Real Madrid', away_team: 'Bayern Munich',
      home_score: 0, away_score: 0,
      status: 'scheduled', period: '', time_remaining: '',
      start_time: new Date(now.getTime() + 5 * 3600000).toISOString(),
      venue: 'Santiago Bernabéu, Madrid', broadcast: 'Paramount+'
    },
  ];

  const insertGame = db.prepare(`
    INSERT INTO games (id, sport, league, home_team, away_team, home_score, away_score, status, period, time_remaining, start_time, venue, broadcast)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  games.forEach(g => insertGame.run(g.id, g.sport, g.league, g.home_team, g.away_team, g.home_score, g.away_score, g.status, g.period, g.time_remaining, g.start_time, g.venue, g.broadcast));

  const [celticsGame, chiefsGame, mancityGame, rangersGame, yankeesGame] = games;

  // Create posts
  const insertPost = db.prepare(`
    INSERT INTO posts (id, user_id, content, sport_tag, league_tag, team_tags, game_id, is_reply, reply_to_id, likes_count, reposts_count, replies_count, views_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  function ago(minutes) {
    return new Date(Date.now() - minutes * 60 * 1000).toISOString();
  }

  const postData = [
    // ESPN posts
    { id: uuidv4(), user_id: espn.id, content: '🚨 HALFTIME SCORE 🚨\n\nBoston Celtics 58, Los Angeles Lakers 51\n\nJayson Tatum leads all scorers with 24 points. LeBron has 18 pts, 7 reb, 6 ast.\n\nQ3 tips off in 15 minutes on ESPN! 🏀', sport_tag: 'Basketball', league_tag: 'NBA', game_id: celticsGame.id, likes: 48200, reposts: 12300, replies: 2100, views: 890000, created_at: ago(95) },
    { id: uuidv4(), user_id: espn.id, content: 'Patrick Mahomes just threw his 300th career touchdown pass! 🏈🎯\n\nOnly 6 other QBs have ever reached 300 TDs. He\'s just 28 years old.\n\nGenerational talent. #NFL #Chiefs', sport_tag: 'Football', league_tag: 'NFL', game_id: chiefsGame.id, likes: 62100, reposts: 18400, replies: 5300, views: 1200000, created_at: ago(45) },
    { id: uuidv4(), user_id: nfl.id, content: '⚡ TOUCHDOWN KANSAS CITY ⚡\n\nMahomes finds Kelce in the end zone from 35 yards out!\n\nChiefs lead 21-17 | 3rd Quarter | 8:45 remaining\n\n📺 Watch on CBS #NFL #Chiefs #49ers', sport_tag: 'Football', league_tag: 'NFL', game_id: chiefsGame.id, likes: 34500, reposts: 8900, replies: 3200, views: 750000, created_at: ago(30) },

    // Player posts
    { id: uuidv4(), user_id: lebron.id, content: 'Blessed to still be doing what I love at this level. Nothing is given, EVERYTHING is earned 💪🏾\n\nAkron, we coming home this summer. I love you 👑', sport_tag: 'Basketball', league_tag: 'NBA', likes: 245000, reposts: 38000, replies: 12000, views: 4800000, created_at: ago(180) },
    { id: uuidv4(), user_id: mahomes.id, content: 'Focused. Locked in. Let\'s get this W tonight 🏈🔴\n\n#ChiefsKingdom', sport_tag: 'Football', league_tag: 'NFL', game_id: chiefsGame.id, likes: 89000, reposts: 14000, replies: 6700, views: 1900000, created_at: ago(200) },
    { id: uuidv4(), user_id: curry.id, content: 'Splash Bros back at it 💦💦\n\nWarriors vs Suns tonight at Chase Center. Come make some noise! 🔊\n\nTip-off at 7:30 PM PT on TNT #DubNation', sport_tag: 'Basketball', league_tag: 'NBA', likes: 76000, reposts: 11000, replies: 4200, views: 2100000, created_at: ago(120) },

    // Fan/analyst posts
    { id: uuidv4(), user_id: analyst.id, content: 'HOT TAKE: The Chiefs dynasty is officially over after this season.\n\nMahomes is still elite but the supporting cast has declined significantly. Kelce is 34. The window is closing.\n\nChiefs fans, fight me. 🔥 #NFL #Chiefs', sport_tag: 'Football', league_tag: 'NFL', likes: 8200, reposts: 2100, replies: 5600, views: 180000, created_at: ago(75) },
    { id: uuidv4(), user_id: celticsfan.id, content: 'JAYSON TATUM IS GOING TO WIN MVP THIS YEAR MARK MY WORDS 🍀\n\n24 points in the first half vs the Lakers. This man is DIFFERENT 🔥\n\n#Celtics #NBA #MVP', sport_tag: 'Basketball', league_tag: 'NBA', game_id: celticsGame.id, likes: 3400, reposts: 890, replies: 1200, views: 67000, created_at: ago(85) },
    { id: uuidv4(), user_id: chiefsfan.id, content: 'Chiefs Kingdom, the vibes are IMMACULATE tonight 🔴\n\nArrowhead is DEAFENING. Cannot hear myself think. This is why we have the greatest fans in football.\n\n#ChiefsKingdom #NFL 🏈', sport_tag: 'Football', league_tag: 'NFL', game_id: chiefsGame.id, likes: 4500, reposts: 1200, replies: 340, views: 89000, created_at: ago(55) },

    // Soccer posts
    { id: uuidv4(), user_id: cfnews.id, content: 'GOAL! Manchester City 2-1 Arsenal ⚽\n\nErling Haaland with his 25th Premier League goal of the season! He\'s on track to break the all-time record!\n\n67\' | Etihad Stadium\n\n#MCIARS #PremierLeague #Haaland', sport_tag: 'Soccer', league_tag: 'Premier League', game_id: mancityGame.id, likes: 28700, reposts: 6800, replies: 3100, views: 580000, created_at: ago(25) },
    { id: uuidv4(), user_id: cfnews.id, content: 'Real Madrid vs Bayern Munich is confirmed for the UCL Quarterfinals! 🏆\n\nThe two most successful clubs in Champions League history. This is going to be EPIC.\n\nWho advances? 🤔\n\n#UCL #ChampionsLeague #RealMadrid #Bayern', sport_tag: 'Soccer', league_tag: 'UEFA Champions League', likes: 45600, reposts: 9800, replies: 8900, views: 920000, created_at: ago(300) },

    // More varied posts
    { id: uuidv4(), user_id: espn.id, content: 'The New York Rangers are NOW the hottest team in hockey 🔥\n\nWon 8 of their last 10. Henrik Lundqvist Jr. is channeling his father.\n\n📺 Live: NYR vs TOR on ESPN+ #NHL #Rangers', sport_tag: 'Hockey', league_tag: 'NHL', game_id: rangersGame.id, likes: 12300, reposts: 3200, replies: 890, views: 245000, created_at: ago(60) },
    { id: uuidv4(), user_id: nba.id, content: '🚨 TRADE DEADLINE ALERT 🚨\n\nSources: Multiple teams are in discussions for a blockbuster deal that could reshape the Western Conference.\n\nDetails developing... 👀\n\n#NBA #TradeDeadline', sport_tag: 'Basketball', league_tag: 'NBA', likes: 89000, reposts: 34000, replies: 18000, views: 2100000, created_at: ago(150) },
    { id: uuidv4(), user_id: analyst.id, content: 'Ranking the top 5 athletes of this generation:\n\n1. LeBron James 🏀\n2. Tom Brady 🏈\n3. Lionel Messi ⚽\n4. Serena Williams 🎾\n5. Patrick Mahomes 🏈\n\nDebate me in the comments 👇 #Sports #GOAT', sport_tag: '', league_tag: '', likes: 15600, reposts: 4500, replies: 7800, views: 380000, created_at: ago(400) },
    { id: uuidv4(), user_id: demo.id, content: 'Just watched the most insane finish to a game I\'ve ever seen. Chiefs-49ers never disappoints 🏈🔥\n\n#NFL #Chiefs #49ers', sport_tag: 'Football', league_tag: 'NFL', game_id: chiefsGame.id, likes: 12, reposts: 2, replies: 3, views: 450, created_at: ago(20) },
  ];

  postData.forEach(p => {
    insertPost.run(
      p.id, p.user_id, p.content, p.sport_tag || '', p.league_tag || '',
      JSON.stringify([]), p.game_id || '', 0, '',
      p.likes || 0, p.reposts || 0, p.replies || 0, p.views || 0,
      p.created_at
    );
  });

  // Update user post counts
  users.forEach(u => {
    const count = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(u.id);
    db.prepare('UPDATE users SET posts_count = ? WHERE id = ?').run(count.c, u.id);
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created: ${users.length} users, ${games.length} games, ${postData.length} posts`);
  console.log('\nDemo login: username=demo_user, password=password123');
}

seed().catch(console.error);
