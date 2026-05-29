# سکه نامدار — راه‌اندازی بک‌اند

## ۱. پیش‌نیاز
- **Node.js نسخه ۱۸ یا بالاتر**  
  دانلود: https://nodejs.org

---

## ۲. اولین راه‌اندازی

```bash
# وارد پوشه backend شوید
cd "namdar coin website/Namdar Coin/backend"

# وابستگی‌ها را نصب کنید (فقط یک بار)
npm install

# فایل تنظیمات را بسازید
cp .env.example .env
```

سپس فایل `backend/.env` را با یک ویرایشگر باز کنید و مقادیر را پر کنید:

```
PORT=3000
JWT_SECRET=یک-رشته-تصادفی-طولانی-بنویسید
ADMIN_USERNAME=USER-NAME
ADMIN_PASSWORD=YOUR-PASSWORD-HERE
TELEGRAM_BOT_TOKEN=توکن-بات-تلگرام-شما
TELEGRAM_CHANNEL=YOUR-BOT-ID
```

---

## ۳. اجرا

```bash
# اجرای عادی
node server.js

# اجرا با hot-reload (نیاز به Node 18+)
node --watch server.js
```

سایت روی **http://localhost:3000** بالا می‌آید.

---

## ۴. ساختار فایل‌ها

```
Namdar Coin/
├── index.html          ← نقطه ورود سایت (production)
├── app.jsx             ← کل منطق فرانت‌اند
├── assets/
│   └── logo.jpg
└── backend/
    ├── server.js       ← سرور بک‌اند
    ├── package.json
    ├── .env            ← رمزها (این فایل را در git نگذارید!)
    ├── .env.example    ← نمونه تنظیمات
    └── data/
        ├── prices.json ← قیمت‌های جاری (auto-created)
        ├── hours.json  ← ساعات کاری (auto-created)
        └── history.json← تاریخچه قیمت‌ها (auto-created)
```

---

## ۵. API endpoints

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| GET | `/api/prices` | عمومی | دریافت قیمت‌ها |
| GET | `/api/hours` | عمومی | دریافت ساعات کاری |
| POST | `/api/login` | عمومی | ورود ادمین → JWT token |
| POST | `/api/prices` | ادمین | ذخیره قیمت‌ها + تلگرام |
| POST | `/api/hours` | ادمین | ذخیره ساعات کاری |
| POST | `/api/telegram/test` | ادمین | تست اتصال تلگرام |
| GET | `/api/history` | ادمین | تاریخچه تغییرات قیمت |

---

## ۶. Hosting در ایران — ابر آروان

**ابر آروان** (arvancloud.ir) بهترین گزینه برای هاست در ایران است:

### الف) ساخت VPS
1. به https://console.arvancloud.ir بروید
2. **Cloud Server** ← جدید ← Ubuntu 22.04
3. پلن ۱ CPU / ۱ GB RAM کافی است (ماهانه ~۳۰,۰۰۰ تومان)
4. یک IP عمومی ایرانی می‌گیرید

### ب) آپلود فایل‌ها روی VPS

```bash
# از روی کامپیوتر خودتان:
scp -r "namdar coin website/Namdar Coin" root@IP_SERVER:~/namdar/

# یا با rsync (بهتر):
rsync -av "namdar coin website/Namdar Coin/" root@IP_SERVER:~/namdar/
```

### پ) نصب Node.js روی سرور

```bash
ssh root@IP_SERVER
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### ت) اجرای دائمی با PM2

```bash
npm install -g pm2
cd ~/namdar/backend
npm install
cp .env.example .env
nano .env          # مقادیر را پر کنید

pm2 start server.js --name namdar
pm2 save
pm2 startup        # سرور را auto-start کنید
```

### ث) تنظیم Nginx (اختیاری — برای دامنه)

```bash
apt install nginx -y
```

فایل `/etc/nginx/sites-available/namdar`:
```nginx
server {
    listen 80;
    server_name IP_SERVER;   # یا namdarcoin.ir بعد از خرید دامنه

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/namdar /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## ۷. اتصال بات تلگرام به کانال

1. در تلگرام به **@BotFather** پیام بزنید
2. `/mybots` ← `Namdarcoinpricebot` ← **API Token**
3. توکن را در `backend/.env` بنویسید
4. در کانال `@seeknamdar`: Settings ← Administrators ← Add Admin ← `@Namdarcoinpricebot`
5. فقط **Post Messages** را فعال کنید
6. در پنل ادمین سایت روی «تست اتصال» کلیک کنید

---

## ۸. دامنه (اختیاری)

دامنه `namdarcoin.ir` را می‌توانید از **ایران‌سرور** یا **نیک ایران** بخرید.  
بعد از خرید، DNS را به IP سرور آروان اشاره دهید:
```
A  @  →  IP_SERVER
A  www  →  IP_SERVER
```
