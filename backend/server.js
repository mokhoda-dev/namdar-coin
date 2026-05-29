/**
 * سکه نامدار — Backend Server
 * Node.js + Express  |  JWT Auth  |  JSON file storage  |  Telegram Bot
 *
 * راه‌اندازی:
 *   1. cp .env.example .env    ← رمزها را پر کنید
 *   2. npm install
 *   3. node server.js
 *
 * آدرس پیش‌فرض:  http://localhost:3000
 */

'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');

// ── env ──────────────────────────────────────────────────────────────────────
// در فایل .env قرار می‌دهید؛ اگر فایل وجود نداشت مقدار پیش‌فرض استفاده می‌شود
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT           = process.env.PORT            || 3000;
const JWT_SECRET     = process.env.JWT_SECRET       || 'namdar-secret-change-me';
const ADMIN_USER     = process.env.ADMIN_USERNAME   || 'admin';
const ADMIN_PASS     = process.env.ADMIN_PASSWORD   || 'change-me';
const TG_TOKEN       = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHANNEL     = process.env.TELEGRAM_CHANNEL  || '@seeknamdar';
const FRONTEND_DIR   = path.join(__dirname, '..');   // Sekke Namdar.html is one level up

// ── data files ───────────────────────────────────────────────────────────────
const DATA_DIR        = path.join(__dirname, 'data');
const PRICES_FILE     = path.join(DATA_DIR, 'prices.json');
const HOURS_FILE      = path.join(DATA_DIR, 'hours.json');
const HISTORY_FILE    = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── helpers ───────────────────────────────────────────────────────────────────
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ── default seed data ─────────────────────────────────────────────────────────
const DEFAULT_PRICES = [
  { id: 'emami',     name: 'سکه امامی',           buy: 181000000, sell: 184000000, dir: 'up'   },
  { id: 'bahar',     name: 'سکه بهار آزادی',      buy: 174000000, sell: 179000000, dir: 'up'   },
  { id: 'half',      name: 'نیم سکه',             buy:  92000000, sell:  95000000, dir: 'flat' },
  { id: 'quarter',   name: 'ربع سکه',             buy:  50500000, sell:  53000000, dir: 'up'   },
  { id: 'gram',      name: 'سکه یک گرمی',         buy:  24000000, sell:  29000000, dir: 'flat' },
  { id: 'emami86',   name: 'سکه امامی (قبل ۸۶)', buy: 174000000, sell: 179000000, dir: 'down' },
  { id: 'half86',    name: 'نیم سکه (قبل ۸۶)',   buy:  87000000, sell:  91000000, dir: 'flat' },
  { id: 'quarter86', name: 'ربع سکه (قبل ۸۶)',   buy:  43000000, sell:  46500000, dir: 'flat' },
];

const DEFAULT_HOURS = [
  { id: 'sat',   day: 'شنبه',         open: '09:30', close: '17:30', closed: false },
  { id: 'sun',   day: 'یک‌شنبه',      open: '09:30', close: '17:30', closed: false },
  { id: 'mon',   day: 'دوشنبه',       open: '09:30', close: '17:30', closed: false },
  { id: 'tue',   day: 'سه‌شنبه',      open: '09:30', close: '17:30', closed: false },
  { id: 'wed',   day: 'چهارشنبه',     open: '09:30', close: '17:30', closed: false },
  { id: 'thu',   day: 'پنج‌شنبه',     open: '09:30', close: '14:00', closed: false },
  { id: 'fri',   day: 'جمعه',         open: '10:00', close: '15:00', closed: true  },
];

// Seed files if they don't exist yet
if (!fs.existsSync(PRICES_FILE)) writeJSON(PRICES_FILE, { prices: DEFAULT_PRICES, updatedAt: '' });
if (!fs.existsSync(HOURS_FILE))  writeJSON(HOURS_FILE,  DEFAULT_HOURS);
if (!fs.existsSync(HISTORY_FILE)) writeJSON(HISTORY_FILE, []);

// ── app ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// CORS — در production دامنه خودتان را بنویسید
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'token expired or invalid' });
  }
}

// ── telegram helper ───────────────────────────────────────────────────────────
async function sendToTelegram(text) {
  if (!TG_TOKEN) return { ok: false, description: 'TELEGRAM_BOT_TOKEN not set' };
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  const body = JSON.stringify({
    chat_id: TG_CHANNEL,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
  try {
    const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    return await res.json();
  } catch (e) {
    return { ok: false, description: String(e) };
  }
}

function buildTelegramText(prices, stamp) {
  const lines = prices.map(p => {
    const buy  = p.buy.toLocaleString('fa-IR');
    const sell = p.sell.toLocaleString('fa-IR');
    return `${p.name}  |  خرید: ${buy}  /  فروش: ${sell}`;
  }).join('\n');

  return `📢 قیمت‌های جدید — ${stamp}

${lines}

خرید و فروش سکه‌های بانکی 💰
به علت نوسانات بازار قیمت‌ها لحظه‌ای می‌باشد ⏳
استعلام فرمایید ✨🙏🏻

سکه نامدار — مجتمع تجاری اداری اطلس مال
طبقه اول تجاری G4 · واحد ۴۰۵۶ 🏢

📞 02126370017
📱 09128912903

🔗 <a href="https://t.me/seeknamdar">@seeknamdar</a>
📸 <a href="https://www.instagram.com/namdarcoin?igsh=MXA5ZHkzeTQ0djFrbg==">instagram</a>
🌐 <a href="https://namdarcoin.ir">namdarcoin.ir</a>`;
}

// ── routes ─────────────────────────────────────────────────────────────────────

// ① GET /api/prices  — عمومی
app.get('/api/prices', (req, res) => {
  const data = readJSON(PRICES_FILE, { prices: DEFAULT_PRICES, updatedAt: '' });
  res.json(data);
});

// ② GET /api/hours  — عمومی
app.get('/api/hours', (req, res) => {
  const hours = readJSON(HOURS_FILE, DEFAULT_HOURS);
  res.json(hours);
});

// ③ POST /api/login  — عمومی
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'نام کاربری یا رمز عبور نادرست است' });
});

// ④ POST /api/prices  — فقط ادمین
app.post('/api/prices', requireAuth, async (req, res) => {
  const { prices, autoPost } = req.body || {};
  if (!Array.isArray(prices)) return res.status(400).json({ error: 'prices must be an array' });

  const now    = new Date();
  const stamp  = now.toLocaleDateString('fa-IR') + ' · ' + now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  // Save current prices as history entry
  const history = readJSON(HISTORY_FILE, []);
  history.unshift({ stamp, prices: readJSON(PRICES_FILE, {}).prices || [] });
  if (history.length > 100) history.splice(100); // keep last 100
  writeJSON(HISTORY_FILE, history);

  // Save new prices
  writeJSON(PRICES_FILE, { prices, updatedAt: stamp });

  let telegram = null;
  if (autoPost) {
    telegram = await sendToTelegram(buildTelegramText(prices, stamp));
  }

  res.json({ ok: true, updatedAt: stamp, telegram });
});

// ⑤ POST /api/hours  — فقط ادمین
app.post('/api/hours', requireAuth, (req, res) => {
  const hours = req.body;
  if (!Array.isArray(hours)) return res.status(400).json({ error: 'hours must be an array' });
  writeJSON(HOURS_FILE, hours);
  res.json({ ok: true });
});

// ⑥ POST /api/telegram/test  — فقط ادمین
app.post('/api/telegram/test', requireAuth, async (req, res) => {
  const result = await sendToTelegram(`✅ تست اتصال سکه نامدار — ${new Date().toLocaleString('fa-IR')}`);
  res.json(result);
});

// ⑦ GET /api/history  — فقط ادمین
app.get('/api/history', requireAuth, (req, res) => {
  res.json(readJSON(HISTORY_FILE, []));
});

// ── serve frontend static files ───────────────────────────────────────────────
app.use(express.static(FRONTEND_DIR));

// Fallback: anything not matched → serve index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ── start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │   سکه نامدار — Server is running ✓      │');
  console.log(`  │   http://localhost:${PORT}                  │`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
  if (!TG_TOKEN) {
    console.log('  ⚠️  TELEGRAM_BOT_TOKEN not set — Telegram posts disabled');
    console.log('     Set it in backend/.env to enable auto-posting\n');
  }
});
