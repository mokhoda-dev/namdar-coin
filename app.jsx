// سکه نامدار — hi-fi product
// Single-screen state switching: home / branch / login / admin
// Brand: mustard gold + ink black + warm off-white. Persian RTL.

const { useState, useEffect, useMemo, useRef } = React;

// persian numeral formatter
const fa = (n) => n.toLocaleString('fa-IR');

// ── API helpers ───────────────────────────────────────────────────────────────
// بک‌اند روی همین origin سرو می‌شود — مسیرهای نسبی کافی است
async function apiGet(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
async function apiPost(path, body, token) {
  const r = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => String(r.status));
    throw new Error(txt.includes('401') ? '401' : txt);
  }
  return r.json();
}
function getToken()    { return sessionStorage.getItem('namdar_token'); }
function setToken(t)   { sessionStorage.setItem('namdar_token', t); }
function clearToken()  { sessionStorage.removeItem('namdar_token'); }

// -------- visual atoms --------
function Logo({ size = 36, ring = true }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: '#d4a73a', display: 'grid', placeItems: 'center',
      boxShadow: ring ? 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
      overflow: 'hidden', flex: '0 0 auto',
    }}>
      <img src="assets/logo.jpg" alt="" style={{
        width: '100%', height: '100%', objectFit: 'cover',
      }} />
    </div>
  );
}

function Spark({ dir, w = 80, h = 22 }) {
  const seed = (dir + w).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i) => {
    const x = Math.sin(seed + i * 7.3) * 10000;
    return x - Math.floor(x);
  };
  const N = 14;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * (w - 4) + 2;
    let base = 0.5;
    if (dir === 'up')   base = 0.78 - (i / N) * 0.55;
    if (dir === 'down') base = 0.22 + (i / N) * 0.55;
    const y = base * h + (rand(i) - 0.5) * (h * 0.22);
    pts.push(`${x.toFixed(1)},${Math.max(2, Math.min(h - 2, y)).toFixed(1)}`);
  }
  const color = dir === 'up' ? 'var(--up)' : dir === 'down' ? 'var(--down)' : 'var(--ink-3)';
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendPill({ dir, chg }) {
  const map = {
    up:   { bg: 'rgba(45,122,74,0.10)',  fg: 'var(--up)',   ar: '▲' },
    down: { bg: 'rgba(176,58,58,0.10)',  fg: 'var(--down)', ar: '▼' },
    flat: { bg: 'rgba(0,0,0,0.05)',      fg: 'var(--ink-2)',ar: '—' },
  };
  const s = map[dir];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.fg, padding: '2px 8px',
      borderRadius: 999, fontSize: 12, fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <span>{s.ar}</span>{chg}
    </span>
  );
}

// -------- header & footer (shared) --------
function Header({ go, screen }) {
  const linkCls = (s) => ({
    color: screen === s ? 'var(--ink)' : 'var(--ink-2)',
    fontWeight: screen === s ? 700 : 500,
    cursor: 'pointer', fontSize: 14,
    borderBottom: screen === s ? '2px solid var(--gold)' : '2px solid transparent',
    paddingBottom: 4,
  });
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px', borderBottom: '1px solid var(--line)',
      background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 10,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Logo size={42} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>سکه نامدار</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 1 }}>
            خرید و فروش سکه‌های بانکی · شعبه اطلس
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={linkCls('home')} onClick={() => go('home')}>قیمت‌ها</span>
        <span style={linkCls('branch')} onClick={() => go('branch')}>شعبه و تماس</span>
        <a href="https://t.me/seeknamdar" target="_blank" rel="noreferrer"
          style={{ ...linkCls('_tg'), textDecoration: 'none' }}>کانال تلگرام ↗</a>
        <span style={{
          fontSize: 12, color: 'var(--ink-2)', display: 'inline-flex',
          alignItems: 'center', gap: 6, padding: '5px 10px',
          background: 'rgba(45,122,74,0.08)', color: 'var(--up)', borderRadius: 999,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 6, background: 'var(--up)' }} />
          آنلاین
        </span>
      </nav>
    </header>
  );
}

function Footer({ go }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)', padding: '20px 32px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12, color: 'var(--ink-2)', background: 'var(--paper)',
    }}>
      <div>© ۱۴۰۵ سکه نامدار · تمامی حقوق محفوظ است</div>
      <div style={{ display: 'flex', gap: 18 }}>
        <a href="https://t.me/seeknamdar" target="_blank" rel="noreferrer"
          style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>تلگرام</a>
        <a href="https://www.instagram.com/namdarcoin" target="_blank" rel="noreferrer"
          style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>اینستاگرام</a>
        <span onClick={() => go('login')} style={{ cursor: 'pointer' }}>ورود مدیر</span>
      </div>
    </footer>
  );
}

// -------- Home (two-column live pricing) --------
function HomeScreen({ go, prices, lastUpdate, hours }) {
  return (
    <div style={{ background: 'var(--paper-2)', minHeight: '100vh' }}>
      <Header go={go} screen="home" />
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 32px 40px' }}>
        {/* status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 18,
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.015em',
            }}>قیمت لحظه‌ای سکه</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--ink-2)', fontSize: 14 }}>
              قیمت‌های امروز، به‌روزرسانی لحظه‌ای. در نوسانات بازار استعلام تلفنی توصیه می‌شود.
            </p>
          </div>
          <div style={{ textAlign: 'end', fontSize: 12, color: 'var(--ink-2)' }}>
            <div>آخرین به‌روزرسانی</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {lastUpdate}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 22,
          alignItems: 'start',
        }}>
          {/* RATES */}
          <section style={{
            background: 'var(--paper)', borderRadius: 14, padding: 6,
            border: '1px solid var(--line)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 12px 36px -22px rgba(40,30,15,0.18)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--ink-2)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'start', padding: '14px 16px', fontWeight: 600 }}>نوع سکه</th>
                  <th style={{ textAlign: 'start', padding: '14px 8px', fontWeight: 600 }}>خرید</th>
                  <th style={{ textAlign: 'start', padding: '14px 8px', fontWeight: 600 }}>فروش</th>
                  <th style={{ textAlign: 'start', padding: '14px 8px', fontWeight: 600 }}>تغییر</th>
                  <th style={{ textAlign: 'start', padding: '14px 16px', fontWeight: 600 }}>نمودار</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p, i) => (
                  <tr key={p.id} style={{
                    borderTop: '1px solid var(--line)',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--paper-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CoinChip id={p.id} />
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', fontVariantNumeric: 'tabular-nums', fontSize: 15 }}>{fa(p.buy)}</td>
                    <td style={{ padding: '16px 8px', fontVariantNumeric: 'tabular-nums', fontSize: 15, color: 'var(--gold-deep)', fontWeight: 700 }}>{fa(p.sell)}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <TrendPill dir={p.dir} chg={p.dir === 'up' ? '۰٫۸٪' : p.dir === 'down' ? '۰٫۴٪' : '۰٫۰٪'} />
                    </td>
                    <td style={{ padding: '16px 16px' }}><Spark dir={p.dir} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{
              padding: '12px 16px', borderTop: '1px solid var(--line)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 12, color: 'var(--ink-2)',
            }}>
              <span>قیمت‌ها به تومان — به‌روزرسانی لحظه‌ای</span>
              <span>۸ قلم فعال</span>
            </div>
          </section>

          {/* SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SidebarBranch />
            <SidebarTelegram />
            <SidebarHours hours={hours} />
          </aside>
        </div>
      </main>
      <Footer go={go} />
    </div>
  );
}

// little gold coin pill matching the coin
function CoinChip({ id }) {
  const sizes = { gram: 18, quarter: 22, quarter86: 22, half: 26, half86: 26 };
  const s = sizes[id] || 30;
  return (
    <div style={{
      width: 30, height: 30, display: 'grid', placeItems: 'center', flex: '0 0 auto',
    }}>
      <div style={{
        width: s, height: s, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #f1c75a, #b48427 75%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 -2px 4px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

function SidebarBranch() {
  return (
    <div style={{
      background: 'var(--paper)', borderRadius: 14, padding: 18,
      border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>شعبه</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>شعبه اطلس مال</div>
        </div>
        <span style={{
          fontSize: 11, color: 'var(--gold-deep)', background: 'rgba(212,167,58,0.12)',
          padding: '3px 10px', borderRadius: 999, fontWeight: 600,
        }}>باز</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.8 }}>
        مجتمع تجاری اداری اطلس مال<br />طبقه اول تجاری G4 · واحد ۴۰۵۶
      </div>
      <div style={{
        marginTop: 12, height: 130, borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--line)', position: 'relative',
      }}>
        <iframe
          title="سکه نامدار اطلس"
          src="https://www.google.com/maps?q=%D8%B3%DA%A9%D9%87+%D9%86%D8%A7%D9%85%D8%AF%D8%A7%D8%B1+%D8%A7%D8%B7%D9%84%D8%B3+%D9%85%D8%A7%D9%84+%D8%AA%D9%87%D8%B1%D8%A7%D9%86&output=embed&z=18"
          style={{ width: '100%', height: '100%', border: 0, filter: 'saturate(0.85)' }}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a href="https://maps.app.goo.gl/e5noJZ7mdgEhD1h68" target="_blank" rel="noreferrer"
        style={{ display: 'block', textAlign: 'center', marginTop: 10,
          fontSize: 12, color: 'var(--gold-deep)', textDecoration: 'none', fontWeight: 600 }}>
        بازکردن در Google Maps ↗
      </a>
    </div>
  );
}

function SidebarTelegram() {
  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--paper) 0%, #f6efdc 100%)',
      borderRadius: 14, padding: 18, border: '1px solid var(--line)', position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        تماس
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ContactRow icon="📞" label="تلفن ثابت" value="۰۲۱-۲۶۳۷۰۰۱۷" href="tel:02126370017" />
        <ContactRow icon="📱" label="همراه"     value="۰۹۱۲-۸۹۱-۲۹۰۳" href="tel:09128912903" />
        <ContactRow icon="🔗" label="تلگرام"    value="@seeknamdar" href="https://t.me/seeknamdar" />
        <ContactRow icon="📸" label="اینستاگرام" value="@namdarcoin" href="https://www.instagram.com/namdarcoin" />
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, href }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', textDecoration: 'none', color: 'inherit',
      borderBottom: '1px dashed var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </a>
  );
}

function SidebarHours({ hours }) {
  return (
    <div style={{
      background: 'var(--paper)', borderRadius: 14, padding: 18,
      border: '1px solid var(--line)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        ساعات کاری
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hours.map((r) => (
          <div key={r.id} style={{
            display: 'flex', justifyContent: 'space-between', fontSize: 13,
            opacity: r.closed ? 0.55 : 1,
          }}>
            <span>{r.day}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: r.closed ? 'var(--ink-2)' : 'var(--ink)' }}>
              {r.closed ? 'تعطیل' : `${faTime(r.open)} – ${faTime(r.close)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Branch screen --------
function BranchScreen({ go, hours }) {
  return (
    <div style={{ background: 'var(--paper-2)', minHeight: '100vh' }}>
      <Header go={go} screen="branch" />
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 32px 40px' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.015em' }}>
          شعبه و راه‌های ارتباطی
        </h1>
        <p style={{ margin: '6px 0 22px', color: 'var(--ink-2)', fontSize: 14 }}>
          سکه نامدار · مجتمع تجاری اداری اطلس مال
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22 }}>
          <div style={{
            background: 'var(--paper)', borderRadius: 14, padding: 6,
            border: '1px solid var(--line)', overflow: 'hidden',
          }}>
            <div style={{
              height: 480, borderRadius: 10, position: 'relative', overflow: 'hidden',
              border: '1px solid var(--line)',
            }}>
              <iframe
                title="سکه نامدار اطلس"
                src="https://www.google.com/maps?q=%D8%B3%DA%A9%D9%87+%D9%86%D8%A7%D9%85%D8%AF%D8%A7%D8%B1+%D8%A7%D8%B7%D9%84%D8%B3+%D9%85%D8%A7%D9%84+%D8%AA%D9%87%D8%B1%D8%A7%D9%86&output=embed&z=18"
                style={{ width: '100%', height: '100%', border: 0 }}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a href="https://maps.app.goo.gl/e5noJZ7mdgEhD1h68" target="_blank" rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', padding: '12px',
                fontSize: 13, color: 'var(--gold-deep)', textDecoration: 'none', fontWeight: 700,
                borderTop: '1px solid var(--line)' }}>
              بازکردن در Google Maps ↗
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BigCard label="نشانی" body={<>
              تهران · مجتمع تجاری اداری اطلس مال<br />طبقه اول تجاری G4 · واحد ۴۰۵۶
            </>} />
            <BigCard label="تماس">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <ContactRow icon="📞" label="تلفن ثابت" value="۰۲۱-۲۶۳۷۰۰۱۷" href="tel:02126370017" />
                <ContactRow icon="📱" label="همراه" value="۰۹۱۲-۸۹۱-۲۹۰۳" href="tel:09128912903" />
                <ContactRow icon="🔗" label="تلگرام" value="@seeknamdar" href="https://t.me/seeknamdar" />
                <ContactRow icon="📸" label="اینستاگرام" value="@namdarcoin" href="https://www.instagram.com/namdarcoin" />
              </div>
            </BigCard>
            <BigCard label="ساعات کاری">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {hours.map((r) => (
                  <div key={r.id} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 13,
                    opacity: r.closed ? 0.55 : 1,
                  }}>
                    <span>{r.day}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {r.closed ? 'تعطیل' : `${faTime(r.open)} تا ${faTime(r.close)}`}
                    </span>
                  </div>
                ))}
              </div>
            </BigCard>
          </div>
        </div>
      </main>
      <Footer go={go} />
    </div>
  );
}

function BigCard({ label, body, children }) {
  return (
    <div style={{
      background: 'var(--paper)', borderRadius: 14, padding: 18,
      border: '1px solid var(--line)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {body && <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.9 }}>{body}</div>}
      {children}
    </div>
  );
}

// -------- Admin login --------
function LoginScreen({ go, onLogin }) {
  const [u, setU] = useState('admin');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!u || !p) { setErr('نام کاربری و رمز عبور را وارد کنید'); return; }
    setLoading(true);
    try {
      const r = await apiPost('/api/login', { username: u, password: p });
      if (r.token) { setToken(r.token); setErr(''); onLogin(); }
      else setErr('نام کاربری یا رمز عبور نادرست است');
    } catch {
      setErr('خطا در اتصال به سرور');
    }
    setLoading(false);
  };
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--paper-2)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <form onSubmit={submit} style={{
        background: 'var(--paper)', borderRadius: 18,
        padding: '34px 30px', width: 380, border: '1px solid var(--line)',
        boxShadow: '0 24px 60px -28px rgba(40,30,15,0.30)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <Logo size={56} />
        </div>
        <h2 style={{ margin: 0, textAlign: 'center', fontSize: 20, fontWeight: 800 }}>سکه نامدار</h2>
        <div style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 12, marginTop: 4 }}>
          ورود به پنل مدیریت قیمت
        </div>

        <Field label="نام کاربری" value={u} onChange={setU} dir="ltr" />
        <Field label="رمز عبور" value={p} onChange={setP} type="password" dir="ltr" revealable />

        {err && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--down)' }}>{err}</div>}

        <button type="submit" disabled={loading} style={{
          marginTop: 18, width: '100%', padding: '12px 14px',
          background: loading ? 'var(--ink-2)' : 'var(--ink)', color: 'var(--paper)',
          border: 'none', borderRadius: 10, fontFamily: 'inherit',
          fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
        }}>{loading ? 'در حال ورود...' : 'ورود'}</button>

        <div onClick={() => go('home')} style={{
          marginTop: 14, textAlign: 'center', fontSize: 12,
          color: 'var(--ink-2)', cursor: 'pointer',
        }}>← بازگشت به سایت</div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', dir = 'rtl', revealable = false }) {
  const [shown, setShown] = useState(false);
  const realType = revealable ? (shown ? 'text' : 'password') : type;
  return (
    <label style={{ display: 'block', marginTop: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 6 }}>{label}</div>
      <div style={{ position: 'relative' }} dir="ltr">
        <input type={realType} value={value} dir={dir}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px',
            paddingInlineEnd: revealable ? 40 : 12,
            border: '1px solid var(--line)',
            borderRadius: 9, fontSize: 14, fontFamily: 'inherit',
            background: 'var(--paper-2)', color: 'var(--ink)',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
        />
        {revealable && (
          <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'مخفی کردن رمز' : 'نمایش رمز'}
            style={{
              position: 'absolute', insetInlineEnd: 8, top: '50%',
              transform: 'translateY(-50%)', background: 'transparent',
              border: 'none', padding: 6, cursor: 'pointer',
              color: 'var(--ink-2)', display: 'grid', placeItems: 'center',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--paper)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {shown ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.43 19.43 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </label>
  );
}

// -------- Admin dashboard --------
function AdminScreen({ go, prices, setPrices, lastUpdate, setLastUpdate, autoPost, setAutoPost, hours, setHours }) {
  const [draft, setDraft] = useState(prices);
  const [hoursDraft, setHoursDraft] = useState(hours);
  const [editing, setEditing] = useState(null); // {id, field}
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [tgStatus, setTgStatus] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(prices);
  const hoursDirty = JSON.stringify(hoursDraft) !== JSON.stringify(hours);

  // keep draft in sync when prices load from API
  useEffect(() => { setDraft(prices); }, [prices]);
  useEffect(() => { setHoursDraft(hours); }, [hours]);

  const save = async () => {
    const next = draft.map((d) => {
      const prev = prices.find(p => p.id === d.id);
      let dir = d.dir;
      if (prev) {
        if (d.sell > prev.sell) dir = 'up';
        else if (d.sell < prev.sell) dir = 'down';
        else dir = 'flat';
      }
      return { ...d, dir };
    });
    setSaving(true);
    try {
      const r = await apiPost('/api/prices', { prices: next, autoPost }, getToken());
      setPrices(next);
      if (r.updatedAt) setLastUpdate(r.updatedAt);
      if (autoPost) setSaveMsg(r.telegram?.ok ? '✓ ذخیره شد و به تلگرام ارسال شد' : '✓ ذخیره شد (تلگرام: خطا)');
      else setSaveMsg('✓ ذخیره شد');
    } catch (e) {
      if (String(e.message).includes('401')) { clearToken(); go('login'); return; }
      setSaveMsg('❌ خطا در ذخیره — دوباره تلاش کنید');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const update = (id, field, val) => {
    setDraft((d) => d.map((p) => p.id === id ? { ...p, [field]: val } : p));
  };

  const updateHour = (id, field, val) => {
    setHoursDraft((h) => h.map((r) => r.id === id ? { ...r, [field]: val } : r));
  };

  const saveHours = async () => {
    try {
      await apiPost('/api/hours', hoursDraft, getToken());
      setHours(hoursDraft);
    } catch (e) {
      if (String(e.message).includes('401')) { clearToken(); go('login'); }
    }
  };

  const testTelegram = async () => {
    setTgStatus('در حال ارسال...');
    try {
      const r = await apiPost('/api/telegram/test', {}, getToken());
      setTgStatus(r.ok ? '✅ اتصال برقرار — پیام ارسال شد' : `❌ خطا: ${r.description || 'نامشخص'}`);
    } catch { setTgStatus('❌ خطا در اتصال به سرور'); }
    setTimeout(() => setTgStatus(''), 5000);
  };

  return (
    <div style={{ background: 'var(--paper-2)', minHeight: '100vh' }}>
      {/* admin top bar */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>سکه نامدار · پنل مدیر</div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>مدیریت قیمت و انتشار</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
          <span style={{ opacity: 0.7 }}>آخرین انتشار: {lastUpdate}</span>
          <span onClick={() => go('home')} style={{ cursor: 'pointer', opacity: 0.8 }}>مشاهده سایت ↗</span>
          <span onClick={() => { clearToken(); go('home'); }} style={{
            cursor: 'pointer', padding: '5px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.10)', fontWeight: 600,
          }}>خروج</span>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 40px' }}>
        {/* action row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>قیمت‌ها</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-2)', fontSize: 13 }}>
              روی هر قیمت کلیک کنید تا ویرایش شود. تغییرات با «ذخیره و انتشار» قطعی می‌شوند.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>انتشار خودکار در تلگرام</span>
              <Switch on={autoPost} onChange={setAutoPost} />
            </div>
            {saveMsg && <span style={{
              fontSize: 12, color: saveMsg.startsWith('✓') ? 'var(--up)' : 'var(--down)',
              background: saveMsg.startsWith('✓') ? 'rgba(45,122,74,0.10)' : 'rgba(176,58,58,0.10)',
              padding: '5px 10px', borderRadius: 8, fontWeight: 600,
            }}>{saveMsg}</span>}
            <button disabled={!dirty || saving} onClick={save} style={{
              padding: '10px 18px', background: (dirty && !saving) ? 'var(--gold-deep)' : 'var(--line)',
              color: (dirty && !saving) ? '#fff' : 'var(--ink-2)',
              border: 'none', borderRadius: 10, fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, cursor: (dirty && !saving) ? 'pointer' : 'not-allowed',
              boxShadow: (dirty && !saving) ? '0 6px 18px -8px rgba(161,122,31,0.6)' : 'none',
              whiteSpace: 'nowrap',
            }}>{saving ? 'در حال ذخیره...' : 'ذخیره و انتشار'}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* edit table */}
          <section style={{
            background: 'var(--paper)', borderRadius: 14,
            border: '1px solid var(--line)', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--paper-2)', color: 'var(--ink-2)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'start', padding: '12px 14px', fontWeight: 600 }}>نوع سکه</th>
                  <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 600 }}>خرید (تومان)</th>
                  <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 600 }}>فروش (تومان)</th>
                  <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 600 }}>تغییر</th>
                </tr>
              </thead>
              <tbody>
                {draft.map((p) => {
                  const prev = prices.find(x => x.id === p.id);
                  const changed = !prev || prev.buy !== p.buy || prev.sell !== p.sell;
                  return (
                    <tr key={p.id} style={{
                      borderTop: '1px solid var(--line)',
                      background: changed ? 'rgba(212,167,58,0.08)' : 'transparent',
                    }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <CoinChip id={p.id} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                          {changed && <span style={{
                            fontSize: 10, color: 'var(--gold-deep)', fontWeight: 700,
                            background: 'rgba(212,167,58,0.18)', padding: '1px 6px', borderRadius: 4,
                          }}>تغییر یافته</span>}
                        </div>
                      </td>
                      <PriceCell value={p.buy} onChange={(v) => update(p.id, 'buy', v)} />
                      <PriceCell value={p.sell} onChange={(v) => update(p.id, 'sell', v)} accent />
                      <td style={{ padding: '12px 8px' }}>
                        {prev && (
                          <span style={{
                            fontSize: 12, fontVariantNumeric: 'tabular-nums',
                            color: p.sell > prev.sell ? 'var(--up)' : p.sell < prev.sell ? 'var(--down)' : 'var(--ink-2)',
                          }}>
                            {p.sell === prev.sell ? '—' : `${p.sell > prev.sell ? '+' : ''}${fa(p.sell - prev.sell)}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* telegram preview */}
          <aside style={{
            background: 'var(--paper)', borderRadius: 14,
            border: '1px solid var(--line)', overflow: 'hidden', position: 'sticky', top: 24,
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--line)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--paper-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, background: '#229ED9',
                  display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12, fontWeight: 700,
                }}>T</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>پیش‌نمایش پست تلگرام</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-2)' }}>@seeknamdar</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, color: autoPost ? 'var(--up)' : 'var(--ink-2)',
                background: autoPost ? 'rgba(45,122,74,0.10)' : 'rgba(0,0,0,0.05)',
                padding: '3px 8px', borderRadius: 999, fontWeight: 600,
              }}>{autoPost ? '● ارسال خودکار' : '○ دستی'}</span>
            </div>
            <TelegramPreview prices={draft} time={lastUpdate} />
          </aside>
        </div>

        {/* HOURS EDITOR */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 28, marginBottom: 14,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>ساعات کاری</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-2)', fontSize: 13 }}>
              ساعات نمایش‌داده‌شده در صفحه عمومی و صفحه شعبه را تنظیم کنید.
            </p>
          </div>
          <button disabled={!hoursDirty} onClick={saveHours} style={{
            padding: '10px 18px', background: hoursDirty ? 'var(--gold-deep)' : 'var(--line)',
            color: hoursDirty ? '#fff' : 'var(--ink-2)',
            border: 'none', borderRadius: 10, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: hoursDirty ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            boxShadow: hoursDirty ? '0 6px 18px -8px rgba(161,122,31,0.6)' : 'none',
          }}>ذخیره ساعات</button>
        </div>
        <section style={{
          background: 'var(--paper)', borderRadius: 14, padding: 6,
          border: '1px solid var(--line)',
        }}>
          {hoursDraft.map((r, idx) => (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto',
              gap: 14, alignItems: 'center', padding: '12px 14px',
              borderTop: idx === 0 ? 'none' : '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.day}</div>
              <TimeField value={r.open} onChange={(v) => updateHour(r.id, 'open', v)} disabled={r.closed} label="باز" />
              <TimeField value={r.close} onChange={(v) => updateHour(r.id, 'close', v)} disabled={r.closed} label="بسته" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>تعطیل</span>
                <Switch on={r.closed} onChange={(v) => updateHour(r.id, 'closed', v)} />
              </div>
            </div>
          ))}
        </section>

        {/* TELEGRAM STATUS */}
        <div style={{ marginTop: 28, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>تلگرام</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-2)', fontSize: 13 }}>
            تنظیمات بات از فایل <code style={{ fontSize: 12 }}>backend/.env</code> خوانده می‌شود.
            برای تغییر کانال، مقدار <code style={{ fontSize: 12 }}>TELEGRAM_CHANNEL</code> را ویرایش و سرور را ری‌استارت کنید.
          </p>
        </div>
        <section style={{
          background: 'var(--paper)', borderRadius: 14, padding: 18,
          border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#229ED9',
              display: 'grid', placeItems: 'center', color: '#fff', fontSize: 20, flexShrink: 0,
            }}>✈</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>@Namdarcoinpricebot</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
                با فعال‌بودن «انتشار خودکار»، قیمت‌ها پس از هر ذخیره به کانال ارسال می‌شوند
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <button onClick={testTelegram} style={{
              padding: '9px 20px', background: 'var(--paper-2)',
              color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 9,
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>تست اتصال</button>
            {tgStatus && <div style={{
              fontSize: 12, padding: '5px 10px', borderRadius: 8, fontWeight: 600,
              color: tgStatus.startsWith('✅') ? 'var(--up)' : 'var(--down)',
              background: tgStatus.startsWith('✅') ? 'rgba(45,122,74,0.10)' : 'rgba(176,58,58,0.10)',
            }}>{tgStatus}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}


function TimeField({ value, onChange, disabled, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: disabled ? 0.4 : 1 }}>
      <span style={{ fontSize: 12, color: 'var(--ink-2)', minWidth: 32 }}>{label}</span>
      <input type="time" value={value} dir="ltr" disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, padding: '8px 10px', border: '1px solid var(--line)',
          borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
          background: disabled ? 'var(--paper-2)' : 'var(--paper)',
          color: 'var(--ink)', outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
      />
    </label>
  );
}

function PriceCell({ value, onChange, accent }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => {
    const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
    if (!isNaN(n)) onChange(n);
    setEditing(false);
  };
  return (
    <td style={{ padding: '12px 8px' }}>
      {editing ? (
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)}
          onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()}
          dir="ltr" style={{
            width: 140, padding: '6px 10px', border: '1.5px solid var(--gold)',
            borderRadius: 8, fontSize: 14, fontFamily: 'inherit', textAlign: 'end',
            fontVariantNumeric: 'tabular-nums', background: 'var(--paper)',
            color: 'var(--ink)', outline: 'none',
          }} />
      ) : (
        <span onClick={() => setEditing(true)} style={{
          display: 'inline-block', padding: '6px 10px', borderRadius: 8,
          fontSize: 14, fontVariantNumeric: 'tabular-nums', cursor: 'text',
          color: accent ? 'var(--gold-deep)' : 'var(--ink)',
          fontWeight: accent ? 700 : 500,
          border: '1px dashed transparent',
          transition: 'border-color .12s, background .12s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--paper-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
        >{fa(value)}</span>
      )}
    </td>
  );
}

function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 38, height: 22, borderRadius: 999, padding: 0, border: 'none',
      background: on ? 'var(--up)' : 'rgba(0,0,0,0.18)',
      position: 'relative', cursor: 'pointer', transition: 'background .15s',
    }}>
      <span style={{
        position: 'absolute', top: 2, insetInlineStart: on ? 18 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'inset-inline-start .15s',
      }} />
    </button>
  );
}

function TelegramPreview({ prices, time }) {
  return (
    <div style={{ padding: 14, background: '#e7ebf0' }}>
      <div style={{
        background: '#fff', borderRadius: 12, borderTopStartRadius: 4,
        padding: 14, fontSize: 12, lineHeight: 1.9, color: '#1f2937',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #fbf3d9, #f3e4ac)',
          border: '1px solid #d9bc66', borderRadius: 8, padding: 10, marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, color: '#86631c', marginBottom: 6, textAlign: 'start' }}>
            آخرین به‌روزرسانی: {time}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ color: '#86631c', fontSize: 10, borderBottom: '1px solid #d9bc66' }}>
                <th style={{ textAlign: 'start', padding: '4px 2px' }}>نوع سکه</th>
                <th style={{ textAlign: 'end',  padding: '4px 2px' }}>خرید</th>
                <th style={{ textAlign: 'end',  padding: '4px 2px' }}>فروش</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '3px 2px' }}>{p.name}</td>
                  <td style={{ padding: '3px 2px', textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{fa(p.buy)}</td>
                  <td style={{ padding: '3px 2px', textAlign: 'end', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fa(p.sell)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>خرید و فروش سکه‌های بانکی 💰📉</div>
        <div style={{ marginTop: 6 }}>به علت نوسانات بازار قیمت‌ها لحظه‌ای می‌باشد ⏳📈<br />استعلام فرمایید ✨🙏🏻</div>
        <div style={{ marginTop: 8, color: '#1f2937' }}>
          سکه نامدار – مجتمع تجاری اداری اطلس مال، طبقه اول تجاری G4 🏢📍<br />واحد ۴۰۵۶
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ color: '#1d6dc1' }}>📞 02126370017</span><br />
          <span style={{ color: '#1d6dc1' }}>📱 09128912903</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <a href="https://t.me/seeknamdar" target="_blank" rel="noreferrer" style={{ color: '#1d6dc1', textDecoration: 'none' }}>🔗 @seeknamdar</a><br />
          <a href="https://www.instagram.com/namdarcoin?igsh=MXA5ZHkzeTQ0djFrbg==" target="_blank" rel="noreferrer" style={{ color: '#1d6dc1', textDecoration: 'none' }}>📸 instagram</a><br />
          <a href="https://namdarcoin.ir" target="_blank" rel="noreferrer" style={{ color: '#1d6dc1', textDecoration: 'none' }}>🌐 namdarcoin.ir</a>
        </div>
        <div style={{
          marginTop: 8, fontSize: 10, color: '#9ca3af',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>👁 ۲۸</span>
          <span>{time.split('·')[1]?.trim() || time}  ✓</span>
        </div>
      </div>
    </div>
  );
}

// -------- root app --------
const faTime = (s) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

function App() {
  const [screen, setScreen] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return ['home', 'branch', 'login', 'admin'].includes(h) ? h : 'home';
  });
  const [prices, setPrices]       = useState([]);
  const [lastUpdate, setLastUpdate] = useState('در حال بارگذاری...');
  const [autoPost, setAutoPost]   = useState(true);
  const [hours, setHours]         = useState([]);

  // ── fetch prices + poll every 10s ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/prices');
        if (Array.isArray(data.prices) && data.prices.length) setPrices(data.prices);
        if (data.updatedAt) setLastUpdate(data.updatedAt);
      } catch { /* سرور هنوز بالا نیامده — سکوت */ }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  // ── fetch hours once ─────────────────────────────────────────────────────
  useEffect(() => {
    apiGet('/api/hours')
      .then((h) => { if (Array.isArray(h) && h.length) setHours(h); })
      .catch(() => {});
  }, []);

  const go = (s) => {
    setScreen(s);
    window.location.hash = s;
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (['home', 'branch', 'login', 'admin'].includes(h)) setScreen(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // اگر کسی مستقیم به #admin رفت ولی لاگین نیست، به لاگین هدایت می‌شود
  if (screen === 'admin' && !getToken()) {
    return <LoginScreen go={go} onLogin={() => go('admin')} />;
  }

  if (screen === 'home')   return <HomeScreen go={go} prices={prices} lastUpdate={lastUpdate} hours={hours} />;
  if (screen === 'branch') return <BranchScreen go={go} hours={hours} />;
  if (screen === 'login')  return <LoginScreen go={go} onLogin={() => go('admin')} />;
  if (screen === 'admin')  return (
    <AdminScreen go={go} prices={prices} setPrices={setPrices}
      lastUpdate={lastUpdate} setLastUpdate={setLastUpdate}
      autoPost={autoPost} setAutoPost={setAutoPost}
      hours={hours} setHours={setHours} />
  );
  return null;
}

Object.assign(window, { App });
