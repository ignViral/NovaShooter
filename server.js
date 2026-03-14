const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'users.json');

// ─── Ensure data directory exists ──────────────────────────────
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// ─── Simple JSON DB helpers ───────────────────────────────────
function loadDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// ─── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html and static files

app.use(session({
  secret: 'alien-shooter-secret-' + crypto.randomBytes(8).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ─── Auth Routes ──────────────────────────────────────────────

// Sign up
app.post('/api/auth/signup', (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) return res.status(400).json({ error: 'Username and PIN are required.' });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: 'Username must be 2-20 characters.' });
  if (pin.length < 4 || pin.length > 8) return res.status(400).json({ error: 'PIN must be 4-8 digits.' });
  if (!/^\d+$/.test(pin)) return res.status(400).json({ error: 'PIN must be digits only.' });

  const db = loadDB();
  const key = username.toLowerCase();
  if (db[key]) return res.status(409).json({ error: 'Username already taken.' });

  db[key] = {
    username: username,
    pinHash: hashPin(pin),
    points: 0,
    highScore: 0,
    checkpoints: [],  // array of wave numbers: [5, 10, 15, ...]
    createdAt: Date.now(),
    prestige: 0,
    prestigeAbilities: []
  };
  saveDB(db);

  req.session.user = key;
  res.json({ ok: true, user: sanitizeUser(db[key]) });
});

// Log in
app.post('/api/auth/login', (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) return res.status(400).json({ error: 'Username and PIN are required.' });

  const db = loadDB();
  const key = username.toLowerCase();
  const user = db[key];
  if (!user) return res.status(401).json({ error: 'User not found.' });
  if (user.pinHash !== hashPin(pin)) return res.status(401).json({ error: 'Incorrect PIN.' });

  req.session.user = key;
  res.json({ ok: true, user: sanitizeUser(user) });
});

// Log out
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// ─── User Data Routes ─────────────────────────────────────────

// Get current user
app.get('/api/user', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });
  res.json({ user: sanitizeUser(user) });
});

// Add points after game over
app.post('/api/user/addpoints', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const { score } = req.body;
  if (typeof score !== 'number' || score < 0) return res.status(400).json({ error: 'Invalid score.' });

  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });

  user.points += score;
  if (score > user.highScore) user.highScore = score;
  saveDB(db);

  res.json({ ok: true, user: sanitizeUser(user) });
});

// Save a checkpoint
app.post('/api/user/checkpoint', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const { wave } = req.body;
  if (typeof wave !== 'number' || wave < 10 || wave % 10 !== 0) {
    return res.status(400).json({ error: 'Invalid checkpoint wave.' });
  }

  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });

  if (!user.checkpoints.includes(wave)) {
    user.checkpoints.push(wave);
    user.checkpoints.sort((a, b) => a - b);
    saveDB(db);
  }

  res.json({ ok: true, user: sanitizeUser(user) });
});

// Purchase an upgrade
app.post('/api/user/upgrade', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const { upgradeId, cost } = req.body;
  if (!upgradeId || typeof cost !== 'number' || cost <= 0)
    return res.status(400).json({ error: 'Invalid upgrade request.' });

  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });

  if (!user.upgrades) user.upgrades = {};
  if (user.points < cost) return res.status(400).json({ error: 'Not enough points.' });

  user.points -= cost;
  user.upgrades[upgradeId] = (user.upgrades[upgradeId] || 0) + 1;
  saveDB(db);

  res.json({ ok: true, user: sanitizeUser(user) });
});

// ─── Prestige Routes ──────────────────────────────────────
const UPGRADE_MAXES = { bulletSpeed: 10, fireRate: 10, moveSpeed: 6, damage: 3, shield: 4, startLives: 2, extraBullet: 1 };
const ABILITY_DEFS = { novaBlast: { prestige: 1, cost: 500 }, timeWarp: { prestige: 3, cost: 1500 }, orbitalStrike: { prestige: 5, cost: 3000 } };

app.post('/api/user/prestige', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });
  const currentPrestige = user.prestige || 0;
  if (currentPrestige >= 10) return res.status(400).json({ error: 'Already at max prestige.' });

  const cost = 10000 * (currentPrestige + 1);
  if (user.points < cost) return res.status(400).json({ error: 'Not enough points.' });

  const upgrades = user.upgrades || {};
  for (const [id, max] of Object.entries(UPGRADE_MAXES)) {
    if ((upgrades[id] || 0) < max) return res.status(400).json({ error: 'All upgrades must be maxed.' });
  }

  user.prestige = currentPrestige + 1;
  user.points = 0;
  user.upgrades = {};
  saveDB(db);
  res.json({ ok: true, user: sanitizeUser(user) });
});

app.post('/api/user/buyability', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const { abilityId } = req.body;
  const abilityDef = ABILITY_DEFS[abilityId];
  if (!abilityDef) return res.status(400).json({ error: 'Invalid ability.' });

  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });

  if ((user.prestige || 0) < abilityDef.prestige) return res.status(400).json({ error: 'Prestige level too low.' });
  if (!user.prestigeAbilities) user.prestigeAbilities = [];
  if (user.prestigeAbilities.includes(abilityId)) return res.status(400).json({ error: 'Already owned.' });
  if (user.points < abilityDef.cost) return res.status(400).json({ error: 'Not enough points.' });

  user.points -= abilityDef.cost;
  user.prestigeAbilities.push(abilityId);
  saveDB(db);
  res.json({ ok: true, user: sanitizeUser(user) });
});

app.post('/api/user/resetcheckpoints', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const db = loadDB();
  const user = db[req.session.user];
  if (!user) return res.status(401).json({ error: 'User not found.' });

  user.checkpoints = [];
  saveDB(db);
  res.json({ ok: true, user: sanitizeUser(user) });
});

app.get('/api/prestige/leaderboard', (req, res) => {
  const db = loadDB();
  const leaderboard = Object.values(db)
    .map(u => ({ username: u.username, prestige: u.prestige || 0 }))
    .filter(u => u.prestige > 0)
    .sort((a, b) => b.prestige - a.prestige)
    .slice(0, 10);
  res.json({ leaderboard });
});

// ─── Admin Routes ─────────────────────────────────────────────
app.post('/api/admin/modifyuser', (req, res) => {
  if (!req.session.user || (req.session.user !== 'test'))
    return res.status(403).json({ error: 'Forbidden.' });

  const { targetUsername, action, amount } = req.body;
  const db = loadDB();
  const key = targetUsername.toLowerCase();
  const user = db[key];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  switch(action) {
    case 'addPoints':
      user.points += (amount || 0);
      break;
    case 'removePoints':
      user.points = Math.max(0, user.points - (amount || 0));
      break;
    case 'resetUpgrades':
      user.upgrades = {};
      break;
    case 'resetAccount':
      user.points = 0;
      user.highScore = 0;
      user.checkpoints = [];
      user.upgrades = {};
      user.prestige = 0;
      user.prestigeAbilities = [];
      break;
  }
  saveDB(db);
  res.json({ ok: true, targetUser: sanitizeUser(user) });
});

// ─── Helpers ──────────────────────────────────────────────────
function sanitizeUser(u) {
  return {
    username: u.username,
    points: u.points,
    highScore: u.highScore,
    checkpoints: u.checkpoints || [],
    upgrades: u.upgrades || {},
    prestige: u.prestige || 0,
    prestigeAbilities: u.prestigeAbilities || []
  };
}

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Alien Shooter server running at http://localhost:${PORT}`);
});

