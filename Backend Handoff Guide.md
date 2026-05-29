# سکه نامدار — راهنمای کامل راه‌اندازی سایت

این سند تمام مراحل تبدیل پروتوتایپ HTML به یک سایت زنده با بک‌اند را شرح می‌دهد.

---

## ۱) معماری کلی

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  مرورگر مشتری           │  GET    │  بک‌اند (Cloudflare       │
│  namdarcoin.ir          │ ──────► │  Worker یا Node)          │
│  - صفحه قیمت            │         │  - GET  /api/prices       │
│  - صفحه شعبه            │         │  - POST /api/login        │
└─────────────────────────┘         │  - POST /api/prices       │
                                    │  - POST /api/hours        │
┌─────────────────────────┐  POST   │  - POST /api/telegram     │
│  مرورگر مدیر            │ ──────► │                           │
│  admin.namdarcoin.ir    │         │  ذخیره: KV / SQLite       │
└─────────────────────────┘         └──────────┬───────────────┘
                                               │ sendMessage
                                               ▼
                                    ┌──────────────────────────┐
                                    │  Telegram Bot API        │
                                    │  → کانال @seeknamdar     │
                                    └──────────────────────────┘
```

---

## ۲) چیزی که الان دارید (فرانت‌اند)

فایل‌های آماده در این پروژه:

| فایل | نقش |
|---|---|
| `Sekke Namdar.html` | نقطه ورود — همه چیز را بارگذاری می‌کند |
| `app.jsx` | کل لاجیک صفحات (Home، Branch، Login، Admin) |
| `tweaks-panel.jsx` | پنل تنظیمات نمایش (فقط برای دموی طراحی) |
| `assets/logo.jpg` | لوگوی سکه نامدار |

**برای دانلود کل فرانت‌اند** از منوی پروژه فایل ZIP بگیرید.

---

## ۳) ابتدا — توکن بات لورفته را Revoke کنید

⚠️ **این مرحله را قبل از هر چیز انجام دهید.**

1. در تلگرام به **@BotFather** پیام بزنید
2. `/mybots` → `Namdarcoinpricebot` → **API Token** → **Revoke current token**
3. توکن جدید را در جایی امن نگه دارید — نه در پیام، نه در گیت

---

## ۴) ساخت بک‌اند با Cloudflare Workers (پیشنهادی)

### چرا Cloudflare؟
- رایگان تا ۱۰۰هزار درخواست در روز
- بدون سرور (Serverless) — نگه‌داری ندارد
- ذخیره داده با Workers KV یا D1 SQLite
- سرعت بالا برای کاربران ایرانی (از طریق CDN)

### مرحله‌ها

#### الف) ساخت حساب
1. به [cloudflare.com](https://cloudflare.com) بروید و حساب بسازید
2. دامنه `namdarcoin.ir` را به Cloudflare اضافه کنید (Nameserverها را تغییر دهید)

#### ب) نصب ابزار
```bash
npm install -g wrangler
wrangler login
```

#### پ) ساخت پروژه
```bash
wrangler init namdar-api
cd namdar-api
```

#### ت) ساخت KV namespace
```bash
wrangler kv:namespace create NAMDAR_DATA
```
خروجی یک `id` می‌دهد. آن را در `wrangler.toml` بنویسید:
```toml
name = "namdar-api"
main = "src/index.js"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "DB"
id = "YOUR_KV_ID_HERE"

[vars]
TELEGRAM_CHANNEL = "@seeknamdar"

# secret ها را با wrangler secret put اضافه کنید
```

#### ث) ذخیره رمزها (Secret)
```bash
wrangler secret put ADMIN_PASSWORD
# وقتی پرسید: Namdar1534000$

wrangler secret put TELEGRAM_BOT_TOKEN
# توکن جدید بات
```

#### ج) کد Worker — کپی به `src/index.js`

```javascript
// namdar-api/src/index.js
// Cloudflare Worker — همه‌چیزی که سایت سکه نامدار نیاز دارد

const CORS = {
  'Access-Control-Allow-Origin': '*',            // در عمل: https://namdarcoin.ir
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

// ---- ساده‌ترین احراز هویت با توکن ----
async function makeToken(env) {
  const t = crypto.randomUUID();
  await env.DB.put(`session:${t}`, '1', { expirationTtl: 60 * 60 * 8 }); // ۸ ساعت
  return t;
}
async function checkAuth(req, env) {
  const tok = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!tok) return false;
  return !!(await env.DB.get(`session:${tok}`));
}

// ---- ساخت متن پست تلگرام ----
function buildTelegramText(prices, time) {
  const lines = prices.map(p =>
    `${p.name}  ${p.buy.toLocaleString('fa-IR')} / ${p.sell.toLocaleString('fa-IR')}`
  ).join('\n');
  return `📢 قیمت‌های جدید — ${time}

${lines}

خرید و فروش سکه‌های بانکی 💰📉
به علت نوسانات بازار قیمت‌ها لحظه‌ای می‌باشد ⏳📈
استعلام فرمایید ✨🙏🏻

سکه نامدار — مجتمع تجاری اداری اطلس مال
طبقه اول تجاری G4 · واحد ۴۰۵۶ 🏢📍

📞 02126370017
📱 09128912903

🔗 Telegram: @seeknamdar
📸 Instagram: https://www.instagram.com/namdarcoin
🌐 Website: https://namdarcoin.ir`;
}

async function postToTelegram(env, text) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHANNEL,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

// ---- روتر اصلی ----
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const path = url.pathname;

    // ----- عمومی: گرفتن قیمت‌ها -----
    if (path === '/api/prices' && req.method === 'GET') {
      const data = (await env.DB.get('prices', 'json')) || [];
      const updatedAt = (await env.DB.get('updatedAt')) || '';
      return json({ prices: data, updatedAt });
    }

    // ----- عمومی: ساعات کاری -----
    if (path === '/api/hours' && req.method === 'GET') {
      return json((await env.DB.get('hours', 'json')) || []);
    }

    // ----- ورود -----
    if (path === '/api/login' && req.method === 'POST') {
      const { username, password } = await req.json();
      if (username === 'admin' && password === env.ADMIN_PASSWORD) {
        const token = await makeToken(env);
        return json({ token });
      }
      return json({ error: 'invalid' }, 401);
    }

    // ----- از اینجا به بعد فقط ادمین -----
    if (!(await checkAuth(req, env))) return json({ error: 'unauthorized' }, 401);

    // ----- ذخیره قیمت‌ها + ارسال به تلگرام -----
    if (path === '/api/prices' && req.method === 'POST') {
      const { prices, autoPost } = await req.json();
      const now = new Date();
      const timeFa = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      const dateFa = now.toLocaleDateString('fa-IR');
      const stamp = `${dateFa} · ${timeFa}`;

      await env.DB.put('prices', JSON.stringify(prices));
      await env.DB.put('updatedAt', stamp);

      let telegram = null;
      if (autoPost) {
        const res = await postToTelegram(env, buildTelegramText(prices, stamp));
        telegram = await res.json();
      }
      return json({ ok: true, updatedAt: stamp, telegram });
    }

    // ----- ذخیره ساعات -----
    if (path === '/api/hours' && req.method === 'POST') {
      const hours = await req.json();
      await env.DB.put('hours', JSON.stringify(hours));
      return json({ ok: true });
    }

    // ----- تست اتصال تلگرام -----
    if (path === '/api/telegram/test' && req.method === 'POST') {
      const res = await postToTelegram(env, '✓ تست اتصال سکه نامدار — ' + new Date().toISOString());
      return json(await res.json());
    }

    return json({ error: 'not found' }, 404);
  },
};
```

#### چ) Deploy
```bash
wrangler deploy
```
آدرس Worker را می‌دهد، مثلاً `https://namdar-api.your-name.workers.dev`.

#### ح) متصل کردن به دامنه
در Cloudflare dashboard:
- Workers & Pages → namdar-api → Triggers → **Custom Domain**
- اضافه کنید: `api.namdarcoin.ir`

---

## ۵) وصل کردن فرانت به API

در `app.jsx` این تغییرات را بدهید:

### الف) اضافه کردن یک فایل کوچک `api.js` (یا بالای `app.jsx`)
```javascript
const API = 'https://api.namdarcoin.ir';

async function apiGet(path) {
  const r = await fetch(`${API}${path}`);
  return r.json();
}
async function apiPost(path, body, token) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return r.json();
}
```

### ب) در `App()` به‌جای داده ثابت، از API بخوانید
```jsx
const [prices, setPrices] = useState([]);
const [lastUpdate, setLastUpdate] = useState('');

useEffect(() => {
  const load = async () => {
    const { prices, updatedAt } = await apiGet('/api/prices');
    setPrices(prices); setLastUpdate(updatedAt);
  };
  load();
  // به‌روزرسانی لحظه‌ای: هر ۱۰ ثانیه
  const id = setInterval(load, 10_000);
  return () => clearInterval(id);
}, []);
```

### پ) در `LoginScreen` ورود واقعی
```jsx
const submit = async (e) => {
  e.preventDefault();
  const r = await apiPost('/api/login', { username: u, password: p });
  if (r.token) {
    localStorage.setItem('namdar_token', r.token);
    onLogin();
  } else {
    setErr('نام کاربری یا رمز عبور نادرست است');
  }
};
```

### ت) در `AdminScreen` ذخیره روی سرور
```jsx
const save = async () => {
  const token = localStorage.getItem('namdar_token');
  const r = await apiPost('/api/prices', { prices: draft, autoPost }, token);
  if (r.ok) {
    setPrices(draft);
    setLastUpdate(r.updatedAt);
  }
};
```

برای ساعات کاری همین کار را با `/api/hours` تکرار کنید.

---

## ۶) Hosting فرانت‌اند

سه گزینه:

### الف) Cloudflare Pages (بهترین — رایگان)
```bash
wrangler pages deploy . --project-name namdar-site
```
سپس در dashboard دامنهٔ `namdarcoin.ir` را Connect کنید.

### ب) GitHub Pages
- پروژه را در گیت‌هاب پابلیک کنید
- Settings → Pages → Source: Deploy from branch → main
- دامنه را در Custom domain بنویسید

### پ) هاست سنتی (cPanel و …)
- کل فایل‌ها را در `public_html` آپلود کنید
- فقط مطمئن شوید CORS بک‌اند روی دامنه شما باز است

---

## ۷) اضافه کردن بات به کانال

1. در تلگرام، روی کانال `@seeknamdar` کلیک کنید → **Administrators** → **Add Administrator**
2. `@Namdarcoinpricebot` را جست‌وجو کنید
3. این مجوزها را بدهید:
   - ✅ Post Messages
   - ❌ بقیه را خاموش بگذارید
4. تأیید کنید

برای تست:
```bash
curl -X POST https://api.namdarcoin.ir/api/telegram/test \
  -H "Authorization: Bearer YOUR_LOGIN_TOKEN"
```

---

## ۸) موارد امنیتی مهم

| ✅ بکن | ❌ نکن |
|---|---|
| توکن بات را با `wrangler secret put` ذخیره کن | در `wrangler.toml` یا گیت قرار نده |
| رمز ادمین را قوی نگه دار | از همان `Namdar1534000$` در همه‌جا استفاده نکن |
| HTTPS را اجباری کن | روی HTTP کار نکن — تلگرام به HTTPS نیاز دارد |
| CORS را محدود به دامنه خودت کن | `*` فقط برای تست |
| سشن‌ها را زمان‌دار کن (همان `expirationTtl`) | سشن نامحدود نگذار |
| لاگ تغییرات قیمت را در KV نگه دار | تاریخچه‌ای نداشته باش |

برای CORS سخت‌گیر، در Worker `Access-Control-Allow-Origin` را به `https://namdarcoin.ir` تغییر دهید.

---

## ۹) لیست کارهای باقی‌مانده

پروژه از این چک‌لیست عبور می‌کند:

- [ ] دامنه `namdarcoin.ir` به Cloudflare وصل شد
- [ ] توکن بات قدیمی Revoke شد
- [ ] Worker روی `api.namdarcoin.ir` deploy شد
- [ ] رمز ادمین و توکن بات در Secret ذخیره شدند
- [ ] بات `@Namdarcoinpricebot` ادمین کانال `@seeknamdar` شد
- [ ] فرانت‌اند روی `namdarcoin.ir` آپلود شد
- [ ] تست شد: ورود → ویرایش قیمت → پست در کانال
- [ ] صفحه عمومی هر ۱۰ ثانیه قیمت تازه می‌گیرد
- [ ] CORS فقط روی دامنه خودی باز است

---

## ۱۰) سؤالات بعدی؟

اگر در هر مرحله گیر کردید:
- ارورهای Cloudflare Worker را در dashboard → Workers → Logs ببینید
- ارور تلگرام معمولاً `400 Bad Request` به معنای فرمت اشتباه `chat_id` است
- اگر کانال private است، باید `chat_id` عددی (مثل `-1001234567890`) را استفاده کنید نه `@username`

موفق باشید 🌟
