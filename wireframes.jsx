// Namdar Coin — sketchy wireframe components
// All artboards are RTL Persian by default. Lo-fi style: dashed strokes,
// hand-drawn rotations, Vazirmatn + Caveat type pairing, paper background.

const { useState, useEffect, useMemo } = React;

// ---------- shared product data ----------
const PRODUCTS_FA = [
  { name: 'سکه امامی',            buy: '۱۸۱٬۰۰۰٬۰۰۰', sell: '۱۸۴٬۰۰۰٬۰۰۰', dir: 'up',   chg: '۰٫۸٪'  },
  { name: 'سکه بهار آزادی',       buy: '۱۷۴٬۰۰۰٬۰۰۰', sell: '۱۷۹٬۰۰۰٬۰۰۰', dir: 'up',   chg: '۰٫۲٪'  },
  { name: 'نیم سکه',              buy: '۹۲٬۰۰۰٬۰۰۰',  sell: '۹۵٬۰۰۰٬۰۰۰',  dir: 'flat', chg: '۰٫۰٪'  },
  { name: 'ربع سکه',              buy: '۵۰٬۵۰۰٬۰۰۰',  sell: '۵۳٬۰۰۰٬۰۰۰',  dir: 'up',   chg: '۰٫۵٪'  },
  { name: 'سکه یک گرمی',          buy: '۲۴٬۰۰۰٬۰۰۰',  sell: '۲۹٬۰۰۰٬۰۰۰',  dir: 'flat', chg: '۰٫۰٪'  },
  { name: 'سکه امامی (قبل ۸۶)',  buy: '۱۷۴٬۰۰۰٬۰۰۰', sell: '۱۷۹٬۰۰۰٬۰۰۰', dir: 'down', chg: '۰٫۴٪-' },
  { name: 'نیم سکه (قبل ۸۶)',    buy: '۸۷٬۰۰۰٬۰۰۰',  sell: '۹۱٬۰۰۰٬۰۰۰',  dir: 'flat', chg: '۰٫۰٪'  },
  { name: 'ربع سکه (قبل ۸۶)',    buy: '۴۳٬۰۰۰٬۰۰۰',  sell: '۴۶٬۵۰۰٬۰۰۰',  dir: 'flat', chg: '۰٫۰٪'  },
];

const PRODUCTS_EN = [
  { name: 'Emami Coin',         buy: '181,000,000', sell: '184,000,000', dir: 'up',   chg: '+0.8%' },
  { name: 'Bahar Azadi',        buy: '174,000,000', sell: '179,000,000', dir: 'up',   chg: '+0.2%' },
  { name: 'Half Coin',          buy: '92,000,000',  sell: '95,000,000',  dir: 'flat', chg: '0.0%'  },
  { name: 'Quarter Coin',       buy: '50,500,000',  sell: '53,000,000',  dir: 'up',   chg: '+0.5%' },
  { name: 'One-Gram Coin',      buy: '24,000,000',  sell: '29,000,000',  dir: 'flat', chg: '0.0%'  },
  { name: 'Emami (pre-86)',     buy: '174,000,000', sell: '179,000,000', dir: 'down', chg: '-0.4%' },
  { name: 'Half (pre-86)',      buy: '87,000,000',  sell: '91,000,000',  dir: 'flat', chg: '0.0%'  },
  { name: 'Quarter (pre-86)',   buy: '43,000,000',  sell: '46,500,000',  dir: 'flat', chg: '0.0%'  },
];

// ---------- visual helpers ----------
const useT = () => window.__TWEAKS__ || {};
const t  = (fa, en) => (window.__TWEAKS__?.lang === 'en' ? en : fa);
const rtl = () => (window.__TWEAKS__?.lang === 'en' ? 'ltr' : 'rtl');

// hand-drawn sparkline: simple svg polyline with jitter
function Spark({ dir = 'flat', w = 70, h = 20 }) {
  const tw = useT();
  if (tw.sparklines === false) return null;
  const seed = (dir + w).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i) => {
    const x = Math.sin(seed + i * 7.3) * 10000;
    return x - Math.floor(x);
  };
  const N = 10;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * (w - 4) + 2;
    let base = 0.5;
    if (dir === 'up')   base = 0.8 - (i / N) * 0.55;
    if (dir === 'down') base = 0.2 + (i / N) * 0.55;
    const y = base * h + (rand(i) - 0.5) * (h * 0.25);
    pts.push(`${x.toFixed(1)},${Math.max(2, Math.min(h - 2, y)).toFixed(1)}`);
  }
  const color = dir === 'up' ? '#3d7c4a' : dir === 'down' ? '#a83232' : '#666';
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// directional triangle
function Trend({ dir }) {
  if (dir === 'up')   return <span style={{ color: '#3d7c4a' }}>▲</span>;
  if (dir === 'down') return <span style={{ color: '#a83232' }}>▼</span>;
  return <span style={{ color: '#999' }}>—</span>;
}

// hand-scribble underline for headings
function Scribble({ w = 120 }) {
  return (
    <svg width={w} height="8" style={{ display: 'block', marginTop: 2 }}>
      <path d={`M2 5 Q ${w*0.25} 1, ${w*0.5} 4 T ${w-3} 4`}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

// dashed wireframe box wrapper
const Box = ({ children, style = {}, dashed = true, rot = 0, ...rest }) => (
  <div {...rest} style={{
    border: `1.4px ${dashed ? 'dashed' : 'solid'} var(--ink)`,
    borderRadius: 6,
    background: 'transparent',
    transform: rot ? `rotate(${rot}deg)` : undefined,
    ...style,
  }}>{children}</div>
);

// margin annotation in Caveat
const Note = ({ children, style = {}, color }) => (
  <div style={{
    fontFamily: '"Caveat", cursive',
    fontSize: 17,
    color: color || 'var(--accent)',
    lineHeight: 1.1,
    ...style,
  }}>{children}</div>
);

// arrow pointer for annotations
const Arrow = ({ d = 'M0 0 L 40 20', style = {} }) => (
  <svg style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', ...style }} width="60" height="40">
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
      </marker>
    </defs>
    <path d={d} stroke="var(--accent)" strokeWidth="1.4" fill="none"
      strokeDasharray="2 3" markerEnd="url(#ah)" />
  </svg>
);

// ---------- frame chrome ----------
function BrowserBar({ url = 'namdarcoin.ir' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
      borderBottom: '1.2px solid var(--ink)', background: 'var(--paper-2)',
    }}>
      <span style={{ width: 9, height: 9, borderRadius: 9, background: '#d96a5a' }} />
      <span style={{ width: 9, height: 9, borderRadius: 9, background: '#e3c44a' }} />
      <span style={{ width: 9, height: 9, borderRadius: 9, background: '#7ab06b' }} />
      <div style={{
        flex: 1, marginInline: 10, padding: '3px 10px', borderRadius: 10,
        border: '1px dashed var(--ink)', fontSize: 12, fontFamily: 'monospace',
        color: 'var(--ink-2)', direction: 'ltr', textAlign: 'center',
      }}>{url}</div>
    </div>
  );
}

function SiteHeader({ tag }) {
  return (
    <div style={{
      padding: '14px 22px 12px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', borderBottom: '1.2px dashed var(--ink-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', border: '1.6px solid var(--ink)',
          display: 'grid', placeItems: 'center', fontFamily: '"Caveat", cursive',
          fontSize: 22, color: 'var(--accent)', fontWeight: 700,
        }}>ن</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t('نامدار کوین', 'Namdar Coin')}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
            {t('قیمت لحظه‌ای سکه', 'Live coin pricing')}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--ink-2)' }}>
        <span>{t('قیمت‌ها', 'Prices')}</span>
        <span>{t('شعبه', 'Branch')}</span>
        <span>{t('تماس', 'Contact')}</span>
        <Box style={{ padding: '4px 10px', fontSize: 12 }} dashed>
          {t('کانال تلگرام', 'Telegram')}
        </Box>
      </div>
    </div>
  );
}

// ---------- A · Hero + table ----------
function WF_HeroTable() {
  const tw = useT();
  const products = tw.lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA;
  const featured = products[0];
  const density = tw.density || 'minimal';
  const rows = density === 'minimal' ? products.slice(0, 4) : density === 'balanced' ? products.slice(0, 6) : products;
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar />
      <SiteHeader />
      <div style={{ padding: '28px 26px 0', position: 'relative' }}>
        <Note style={{ position: 'absolute', top: 10, insetInlineEnd: 16 }}>
          {t('بزرگ‌ترین قیمتِ روز ↘', 'hero = today’s headline ↘')}
        </Note>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: 1 }}>
          {t('پرفروش‌ترین', 'FEATURED')}
        </div>
        <div style={{ fontSize: 22, marginTop: 4, fontWeight: 700 }}>{featured.name}</div>
        <Scribble w={150} />
        <div style={{ display: 'flex', gap: 28, marginTop: 16, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('خرید', 'BUY')}</div>
            <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{featured.buy}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('فروش', 'SELL')}</div>
            <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: 'var(--accent)' }}>{featured.sell}</div>
          </div>
          <div style={{ marginInlineStart: 'auto', textAlign: 'center' }}>
            <Spark dir={featured.dir} w={120} h={36} />
            <div style={{ fontSize: 13, marginTop: 4 }}>
              <Trend dir={featured.dir} /> {featured.chg}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 26px 22px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t('سایر سکه‌ها', 'Other coins')}</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--ink-2)' }}>
            {t('به‌روز شد ۱۶:۰۸  ۱۴۰۵/۰۳/۰۵', 'updated 16:08  1405/03/05')}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ color: 'var(--ink-2)', fontSize: 12 }}>
            <tr style={{ borderBottom: '1.2px dashed var(--ink-3)' }}>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('عنوان', 'Item')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('خرید', 'Buy')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('فروش', 'Sell')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('تغییرات', 'Δ')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('نمودار', 'Chart')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px dashed var(--ink-3)' }}>
                <td style={{ padding: '10px 6px' }}>{p.name}</td>
                <td style={{ padding: '10px 6px', fontVariantNumeric: 'tabular-nums' }}>{p.buy}</td>
                <td style={{ padding: '10px 6px', fontVariantNumeric: 'tabular-nums' }}>{p.sell}</td>
                <td style={{ padding: '10px 6px' }}><Trend dir={p.dir} /> <span style={{ fontSize: 12 }}>{p.chg}</span></td>
                <td style={{ padding: '10px 6px' }}><Spark dir={p.dir} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- B · Ticker + card grid ----------
function WF_TickerGrid() {
  const tw = useT();
  const products = tw.lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA;
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar />
      <SiteHeader />
      {/* ticker */}
      <div style={{
        position: 'relative',
        display: 'flex', gap: 28, overflow: 'hidden',
        padding: '8px 14px', fontFamily: 'monospace', fontSize: 12,
        borderBottom: '1.2px dashed var(--ink-3)', background: 'var(--paper-2)',
      }}>
        {products.concat(products).map((p, i) => (
          <span key={i} style={{ whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>
            {p.name} · <b style={{ color: 'var(--ink)' }}>{p.sell}</b> <Trend dir={p.dir} />
          </span>
        ))}
        <Note style={{ position: 'absolute', top: -6, insetInlineEnd: 18, background: 'var(--paper)', padding: '0 6px' }}>
          {t('نوار تیکر ←', '← live ticker')}
        </Note>
      </div>
      <div style={{ padding: '22px 22px 18px' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{t('قیمت‌های امروز', 'Today’s prices')}</div>
        <Scribble w={120} />
      </div>
      <div style={{
        padding: '0 22px 22px', display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1,
      }}>
        {products.map((p, i) => (
          <Box key={i} style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }} dashed>
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{p.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {p.sell}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                {t('خرید', 'buy')} {p.buy}
              </div>
              <Spark dir={p.dir} w={48} h={16} />
            </div>
            <div style={{ fontSize: 11 }}>
              <Trend dir={p.dir} /> {p.chg}
            </div>
          </Box>
        ))}
      </div>
    </div>
  );
}

// ---------- C · Two-column rates + sidebar ----------
function WF_TwoCol() {
  const tw = useT();
  const products = tw.lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA;
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar />
      <SiteHeader />
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, padding: '20px 22px', flex: 1, position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{t('قیمت لحظه‌ای', 'Live rates')}</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--ink-2)' }}>16:08  1405/03/05</div>
          </div>
          <Scribble w={110} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 12 }}>
            <thead style={{ color: 'var(--ink-2)', fontSize: 11 }}>
              <tr style={{ borderBottom: '1.2px dashed var(--ink-3)' }}>
                <th style={{ textAlign: 'start', padding: '8px 4px' }}>{t('عنوان', 'Item')}</th>
                <th style={{ textAlign: 'start', padding: '8px 4px' }}>{t('خرید', 'Buy')}</th>
                <th style={{ textAlign: 'start', padding: '8px 4px' }}>{t('فروش', 'Sell')}</th>
                <th style={{ textAlign: 'start', padding: '8px 4px' }}></th>
                <th style={{ textAlign: 'start', padding: '8px 4px' }}>{t('نمودار', 'Chart')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px dashed var(--ink-3)' }}>
                  <td style={{ padding: '9px 4px' }}>{p.name}</td>
                  <td style={{ padding: '9px 4px', fontVariantNumeric: 'tabular-nums' }}>{p.buy}</td>
                  <td style={{ padding: '9px 4px', fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>{p.sell}</td>
                  <td style={{ padding: '9px 4px', fontSize: 12 }}><Trend dir={p.dir} /></td>
                  <td style={{ padding: '9px 4px' }}><Spark dir={p.dir} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Box style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{t('شعبه اطلس', 'Atlas Branch')}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.7 }}>
              {t('اطلس مال · طبقه اول تجاری G4 · واحد ۴۰۵۶', 'Atlas Mall · 1st floor G4 · unit 4056')}
              <br />
              {t('۰۲۱-۲۶۳۷۰۰۱۷', '+98 21 2637 0017')}
              <br />
              {t('۰۹۱۲-۸۹۱-۲۹۰۳', '+98 912 891 2903')}
            </div>
            <div style={{
              marginTop: 8, height: 80, border: '1px dashed var(--ink-3)', borderRadius: 4,
              display: 'grid', placeItems: 'center', color: 'var(--ink-2)', fontFamily: 'monospace', fontSize: 11,
              background: 'repeating-linear-gradient(45deg,transparent 0 6px,var(--ink-4) 6px 7px)',
            }}>[ {t('نقشه', 'map')} ]</div>
          </Box>
          <Box style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{t('کانال تلگرام', 'Telegram channel')}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>@seeknamdar</div>
            <Box style={{ padding: '6px 10px', marginTop: 8, textAlign: 'center', fontSize: 12 }} dashed>
              {t('عضویت', 'Join')}
            </Box>
          </Box>
          <Box style={{ padding: 14, background: 'var(--paper-2)' }} dashed={false}>
            <div style={{ fontSize: 12 }}>{t('ساعات کاری', 'Hours')}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4 }}>
              {t('شنبه تا چهارشنبه · ۹ تا ۲۰', 'Sat–Wed · 9:00–20:00')}
            </div>
          </Box>
        </aside>
      </div>
    </div>
  );
}

// ---------- D · Terminal market board ----------
function WF_Terminal() {
  const tw = useT();
  const products = tw.lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA;
  return (
    <div dir={rtl()} style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: '"JetBrains Mono", "Vazirmatn", monospace',
    }}>
      <BrowserBar />
      <div style={{
        padding: '10px 16px', borderBottom: '1.2px solid var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--paper-2)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          {t('نامدار کوین — تابلوی بازار', 'Namdar Coin — market board')}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-2)' }}>
          <span style={{ color: '#3d7c4a' }}>● {t('آنلاین', 'online')}</span>
          <span>1405/03/05  16:08:46</span>
        </div>
      </div>
      <div style={{ padding: 16, flex: 1, fontSize: 13, position: 'relative' }}>
        <Note style={{ position: 'absolute', insetInlineEnd: 16, top: 6 }}>
          {t('پرتراکم — برای پی‌گیران بازار', 'dense — for watchers')}
        </Note>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr style={{ borderTop: '1.4px solid var(--ink)', borderBottom: '1.4px solid var(--ink)', color: 'var(--ink-2)', fontSize: 11 }}>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>#</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('عنوان', 'ITEM')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('خرید', 'BID')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('فروش', 'ASK')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('اختلاف', 'SPREAD')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('تغییر ۲۴س', 'Δ 24H')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('روند', 'TREND')}</th>
              <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('آخرین', 'LAST')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const buy = parseInt(p.buy.replace(/[^0-9]/g, ''), 10);
              const sell = parseInt(p.sell.replace(/[^0-9]/g, ''), 10);
              const spread = (sell - buy).toLocaleString(tw.lang === 'en' ? 'en-US' : 'fa-IR');
              return (
                <tr key={i} style={{ borderBottom: '1px dashed var(--ink-3)' }}>
                  <td style={{ padding: '8px 6px', color: 'var(--ink-2)' }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '8px 6px' }}>{p.name}</td>
                  <td style={{ padding: '8px 6px' }}>{p.buy}</td>
                  <td style={{ padding: '8px 6px', color: 'var(--accent)' }}>{p.sell}</td>
                  <td style={{ padding: '8px 6px', color: 'var(--ink-2)' }}>{spread}</td>
                  <td style={{ padding: '8px 6px' }}><Trend dir={p.dir} /> <span style={{ fontSize: 11 }}>{p.chg}</span></td>
                  <td style={{ padding: '8px 6px' }}><Spark dir={p.dir} w={80} h={18} /></td>
                  <td style={{ padding: '8px 6px', color: 'var(--ink-2)', fontSize: 11 }}>16:08:{30 + i}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-2)' }}>
          {t('› منبع: داشبورد نامدار · به‌روز هر تغییر', '› source: Namdar admin · pushed on every change')}
        </div>
      </div>
    </div>
  );
}

// ---------- E · Mobile single-column ----------
function WF_Mobile() {
  const tw = useT();
  const products = tw.lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA;
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <div style={{
        padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', fontSize: 11, fontFamily: 'monospace', color: 'var(--ink-2)',
      }}>
        <span>16:08</span>
        <span>●●●● 5G</span>
      </div>
      <div style={{ padding: '6px 16px 12px', borderBottom: '1.2px dashed var(--ink-3)' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{t('نامدار کوین', 'Namdar Coin')}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('قیمت لحظه‌ای', 'live prices')}</div>
      </div>
      <div style={{ padding: 16, position: 'relative' }}>
        <Note style={{ position: 'absolute', insetInlineEnd: 14, top: 6 }}>
          {t('موبایل — تک‌ستون', 'mobile — single col')}
        </Note>
        <Box style={{ padding: 14, marginTop: 6, background: 'var(--paper-2)' }} dashed={false}>
          <div style={{ fontSize: 10, color: 'var(--ink-2)' }}>{t('پرفروش', 'FEATURED')}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{products[0].name}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-2)' }}>{t('فروش', 'sell')}</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: 'var(--accent)' }}>{products[0].sell}</div>
            </div>
            <div style={{ marginInlineStart: 'auto' }}>
              <Spark dir={products[0].dir} w={70} h={22} />
            </div>
          </div>
        </Box>
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {products.slice(1).map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 4px', borderBottom: '1px dashed var(--ink-3)',
          }}>
            <div>
              <div style={{ fontSize: 13 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-2)' }}>
                {t('خرید', 'buy')} {p.buy}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spark dir={p.dir} w={36} h={14} />
              <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.sell}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', borderTop: '1.2px solid var(--ink)', padding: '8px 10px',
        justifyContent: 'space-around', fontSize: 10, color: 'var(--ink-2)',
      }}>
        <span>● {t('قیمت‌ها', 'Prices')}</span>
        <span>○ {t('شعبه', 'Branch')}</span>
        <span>○ {t('تلگرام', 'Telegram')}</span>
      </div>
    </div>
  );
}

// ---------- Admin login ----------
function WF_AdminLogin() {
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar url="admin.namdarcoin.ir/login" />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', position: 'relative' }}>
        <Note style={{ position: 'absolute', top: 30, insetInlineEnd: 30 }}>
          {t('ورود فقط برای کارکنان', 'staff-only entrance')}
        </Note>
        <Box style={{ width: 320, padding: 28 }} dashed>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', border: '1.6px solid var(--ink)',
            display: 'grid', placeItems: 'center', fontFamily: '"Caveat", cursive',
            fontSize: 26, color: 'var(--accent)', fontWeight: 700, margin: '0 auto 10px',
          }}>ن</div>
          <div style={{ textAlign: 'center', fontWeight: 700 }}>{t('ورود مدیر', 'Admin sign-in')}</div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>
            {t('نامدار کوین · پنل قیمت‌گذاری', 'Namdar Coin · price console')}
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('نام کاربری', 'username')}</div>
            <div style={{ border: '1px solid var(--ink)', borderRadius: 4, padding: '8px 10px', marginTop: 4, fontSize: 13, color: 'var(--ink-2)' }}>
              admin@namdar
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{t('رمز عبور', 'password')}</div>
            <div style={{ border: '1px solid var(--ink)', borderRadius: 4, padding: '8px 10px', marginTop: 4, fontSize: 13, color: 'var(--ink-2)' }}>
              • • • • • • • •
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
            <span>☐ {t('مرا به خاطر بسپار', 'remember me')}</span>
            <span style={{ color: 'var(--accent)' }}>{t('فراموشی رمز؟', 'forgot?')}</span>
          </div>
          <Box style={{
            marginTop: 18, padding: '10px 0', textAlign: 'center',
            background: 'var(--ink)', color: 'var(--paper)', fontWeight: 700,
          }} dashed={false}>
            {t('ورود', 'Sign in')}
          </Box>
          <div style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-2)', textAlign: 'center' }}>
            {t('احراز هویت دومرحله‌ای فعال است', '2-factor enabled')}
          </div>
        </Box>
        <Arrow style={{ insetInlineEnd: 80, top: 110 }} d="M0 0 Q 30 30, 70 50" />
      </div>
    </div>
  );
}

// ---------- Admin dashboard ----------
function WF_AdminDash() {
  const tw = useT();
  const products = tw.lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA;
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar url="admin.namdarcoin.ir/prices" />
      {/* top bar */}
      <div style={{
        padding: '10px 18px', borderBottom: '1.2px solid var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%', border: '1.4px solid var(--ink)',
            display: 'grid', placeItems: 'center', fontFamily: '"Caveat", cursive',
            fontSize: 16, color: 'var(--accent)', fontWeight: 700,
          }}>ن</span>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t('پنل مدیریت قیمت', 'Price console')}</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--ink-2)', alignItems: 'center' }}>
          <span>{t('آخرین انتشار: ۱۶:۰۸', 'last push: 16:08')}</span>
          <Box style={{ padding: '4px 8px', fontSize: 11 }} dashed>{t('سعید · خروج', 'saeed · sign out')}</Box>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', flex: 1 }}>
        {/* side nav */}
        <nav style={{ borderInlineEnd: '1.2px dashed var(--ink-3)', padding: 14, fontSize: 13 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: 1, marginBottom: 8 }}>{t('منو', 'MENU')}</div>
          {[
            t('قیمت‌ها', 'Prices'),
            t('تاریخچه', 'History'),
            t('تلگرام', 'Telegram'),
            t('شعبه', 'Branch'),
            t('تنظیمات', 'Settings'),
          ].map((x, i) => (
            <div key={i} style={{
              padding: '6px 8px', borderRadius: 4, marginBottom: 4,
              background: i === 0 ? 'var(--paper-2)' : 'transparent',
              fontWeight: i === 0 ? 700 : 400,
              border: i === 0 ? '1px dashed var(--ink-3)' : '1px solid transparent',
            }}>{i === 0 ? '● ' : '○ '}{x}</div>
          ))}
        </nav>

        {/* main */}
        <main style={{ padding: 18, position: 'relative' }}>
          <Note style={{ position: 'absolute', top: 6, insetInlineEnd: 16 }}>
            {t('کلیک روی قیمت = ویرایش', 'click price = edit')}
          </Note>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{t('مدیریت قیمت‌ها', 'Manage prices')}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                {t('۸ سکه فعال · ویرایش درجا', '8 active items · inline edit')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Box style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }} dashed={false}>
                <span style={{
                  width: 28, height: 14, border: '1px solid var(--ink)', borderRadius: 8,
                  position: 'relative', background: 'var(--accent)',
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 10, background: 'var(--paper)',
                    position: 'absolute', top: 1, insetInlineStart: 15,
                  }} />
                </span>
                {t('انتشار خودکار در تلگرام', 'auto-post to Telegram')}
              </Box>
              <Box style={{ padding: '6px 12px', fontSize: 12, background: 'var(--ink)', color: 'var(--paper)', fontWeight: 700 }} dashed={false}>
                {t('ذخیره و انتشار', 'Save & publish')}
              </Box>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 14 }}>
            <thead style={{ color: 'var(--ink-2)', fontSize: 11 }}>
              <tr style={{ borderTop: '1.2px solid var(--ink)', borderBottom: '1.2px solid var(--ink)' }}>
                <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('عنوان', 'Item')}</th>
                <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('قیمت خرید', 'Buy')}</th>
                <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('قیمت فروش', 'Sell')}</th>
                <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('تغییر', 'Δ')}</th>
                <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('نمایش', 'Visible')}</th>
                <th style={{ textAlign: 'start', padding: '8px 6px' }}>{t('عملیات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px dashed var(--ink-3)', background: i === 0 ? 'rgba(184,140,69,0.06)' : 'transparent' }}>
                  <td style={{ padding: '10px 6px' }}>{p.name}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{
                      border: '1px dashed var(--ink-3)', borderRadius: 4, padding: '3px 8px',
                      fontVariantNumeric: 'tabular-nums', background: i === 0 ? 'var(--paper)' : 'transparent',
                    }}>{p.buy}{i === 0 && ' ▎'}</span>
                  </td>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{ border: '1px dashed var(--ink-3)', borderRadius: 4, padding: '3px 8px', fontVariantNumeric: 'tabular-nums' }}>{p.sell}</span>
                  </td>
                  <td style={{ padding: '10px 6px', fontSize: 12 }}><Trend dir={p.dir} /> {p.chg}</td>
                  <td style={{ padding: '10px 6px', fontSize: 12 }}>{i < 6 ? '☑' : '☐'} {t('قابل مشاهده', 'shown')}</td>
                  <td style={{ padding: '10px 6px', fontSize: 11, color: 'var(--ink-2)' }}>
                    {t('ویرایش · حذف · سابقه', 'edit · remove · log')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{
            marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            <Box style={{ padding: 12 }} dashed>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{t('پیش‌نمایش پست تلگرام', 'Telegram post preview')}</div>
              <div style={{
                marginTop: 8, padding: 10, background: 'var(--paper-2)', borderRadius: 6,
                fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--ink-2)',
              }}>
{t(`📢 قیمت‌های جدید — ۱۶:۰۸
سکه امامی    ۱۸۴٬۰۰۰٬۰۰۰  ▲
بهار آزادی   ۱۷۹٬۰۰۰٬۰۰۰
…`,
`📢 New prices — 16:08
Emami       183,000,000  ▲
Bahar Azadi 178,000,000
…`)}
              </div>
            </Box>
            <Box style={{ padding: 12 }} dashed>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{t('گزارش فعالیت', 'Activity log')}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.7, fontFamily: 'monospace' }}>
                16:08 · {t('سعید · سکه امامی  +۳م', 'saeed · Emami  +3m')}<br />
                15:42 · {t('سعید · ربع سکه  +۱م', 'saeed · Quarter  +1m')}<br />
                14:10 · {t('انتشار خودکار', 'auto-publish')}
              </div>
            </Box>
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------- Branch / contact ----------
function WF_Branch() {
  return (
    <div dir={rtl()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar url="namdarcoin.ir/branch" />
      <SiteHeader />
      <div style={{ padding: '22px 24px', flex: 1, position: 'relative' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{t('شعبه نامدار کوین', 'Namdar Coin · branch')}</div>
        <Scribble w={150} />
        <Note style={{ position: 'absolute', top: 18, insetInlineEnd: 24 }}>
          {t('یک شعبه — اطلس مال', 'one branch — Atlas Mall')}
        </Note>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20, marginTop: 14 }}>
          <Box style={{
            height: 280, border: '1.4px dashed var(--ink)', borderRadius: 6,
            background: 'repeating-linear-gradient(45deg,transparent 0 10px,var(--ink-4) 10px 11px)',
            display: 'grid', placeItems: 'center', color: 'var(--ink-2)', fontFamily: 'monospace',
          }} dashed={false}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>📍</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>[ {t('نقشه شعبه', 'branch map')} ]</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>{t('مرکز خرید اطلس', 'Atlas Mall')}</div>
            </div>
          </Box>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Box style={{ padding: 16 }} dashed>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('نشانی', 'Address')}</div>
              <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.8 }}>
                {t('تهران · اطلس مال · طبقه اول تجاری G4 · واحد ۴۰۵۶', 'Tehran · Atlas Mall · 1st floor G4 · unit 4056')}
              </div>
            </Box>
            <Box style={{ padding: 16 }} dashed>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('تماس', 'Contact')}</div>
              <div style={{ fontSize: 14, marginTop: 6, fontFamily: 'monospace', lineHeight: 1.9, direction: 'ltr', textAlign: 'start' }}>
                ☎ +98 21 2637 0017<br />
                ☏ +98 912 891 2903<br />
                ✈ @seeknamdar
              </div>
            </Box>
            <Box style={{ padding: 16 }} dashed>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t('ساعات کاری', 'Hours')}</div>
              <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.8 }}>
                {t('شنبه – چهارشنبه · ۹:۰۰ تا ۲۰:۰۰', 'Sat – Wed · 9:00 – 20:00')}<br />
                {t('پنج‌شنبه · ۹:۰۰ تا ۱۴:۰۰', 'Thu · 9:00 – 14:00')}<br />
                {t('جمعه · تعطیل', 'Fri · closed')}
              </div>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Telegram post preview ----------
function WF_TelegramPost() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper-2)' }} dir={rtl()}>
      <div style={{
        padding: '10px 14px', background: '#5b8bb5', color: '#fff',
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
      }}>
        <span>←</span>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff3', display: 'grid', placeItems: 'center' }}>ن</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{t('سکه نامدار (اطلس)', 'Namdar Coin (Atlas)')}</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>{t('۱۸۶ عضو', '186 subscribers')}</div>
        </div>
        <span>⋮</span>
      </div>
      <div style={{ flex: 1, padding: 14, position: 'relative', overflowY: 'auto' }}>
        <Note style={{ position: 'absolute', top: 6, insetInlineEnd: 12 }}>
          {t('فرمت پست خودکار', 'auto-post format')}
        </Note>
        <Box style={{
          padding: 12, marginTop: 22, background: 'var(--paper)',
          borderRadius: 10, borderTopStartRadius: 2,
          maxWidth: 340,
        }} dashed={false}>
          {/* price image — dashed placeholder mimicking the gold table card */}
          <div style={{
            border: '1.2px dashed var(--ink-3)', borderRadius: 6,
            background: 'linear-gradient(180deg, var(--paper-2), var(--paper))',
            padding: 10, fontSize: 10, fontFamily: 'monospace', lineHeight: 1.8,
          }}>
            <div style={{ textAlign: 'start', color: 'var(--ink-2)', marginBottom: 6 }}>
              {t('آخرین بروز‌رسانی: ۱۴۰۵/۰۳/۰۵', 'updated: 1405/03/05')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .9fr .9fr 24px', gap: 4, fontWeight: 700, fontSize: 9, color: 'var(--accent)', borderBottom: '1px solid var(--ink-3)', paddingBottom: 4, marginBottom: 4 }}>
              <span>{t('نوع سکه', 'item')}</span>
              <span style={{ textAlign: 'end' }}>{t('خرید', 'buy')}</span>
              <span style={{ textAlign: 'end' }}>{t('فروش', 'sell')}</span>
              <span style={{ textAlign: 'center' }}>{t('‎', 'tr')}</span>
            </div>
            {(useT().lang === 'en' ? PRODUCTS_EN : PRODUCTS_FA).map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr .9fr .9fr 24px', gap: 4, fontSize: 9, padding: '2px 0' }}>
                <span style={{ fontFamily: 'Vazirmatn, sans-serif' }}>🥇 {p.name}</span>
                <span style={{ textAlign: 'end' }}>{p.buy}</span>
                <span style={{ textAlign: 'end' }}>{p.sell}</span>
                <span style={{ textAlign: 'center' }}><Trend dir={p.dir} /></span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.9, fontFamily: 'Vazirmatn, sans-serif' }}>
            📒💰 {t('خرید و فروش سکه‌های بانکی', 'buy & sell bank coins')}<br />
            📈⏳ {t('به علت نوسانات بازار قیمت‌ها لحظه‌ای می‌باشد · استعلام فرمایید 🙏✨',
               'prices update live with market · please call to confirm 🙏✨')}
          </div>

          <div style={{
            marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--ink-3)',
            fontSize: 11, lineHeight: 1.8, color: 'var(--ink-2)',
          }}>
            {t('سکه نامدار — مجتمع تجاری اداری اطلس مال، طبقه اول تجاری G4',
               'Namdar Coin — Atlas Mall, 1st floor G4')}<br />
            📍 {t('واحد ۴۰۵۶', 'unit 4056')}<br />
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#3a6aa8', direction: 'ltr' }}>📞 02126370017</span><br />
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#3a6aa8', direction: 'ltr' }}>📱 09128912903</span><br />
            <span style={{ color: '#3a6aa8' }}>🔗 @seeknamdar</span><br />
            <span style={{ color: '#3a6aa8' }}>📷 Instagram</span><br />
            <span style={{ color: '#3a6aa8' }}>🌐 Website</span>
          </div>

          <div style={{
            marginTop: 10, fontSize: 10, color: 'var(--ink-2)', display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>👁 ۲۲</span>
            <span>16:08 ✓</span>
          </div>
        </Box>
        <Arrow style={{ insetInlineStart: 30, top: 100 }} d="M50 0 Q 20 30, 0 60" />
        <Note style={{ position: 'absolute', insetInlineStart: 14, top: 180, maxWidth: 110 }}>
          {t('ساخته‌شده از قیمت‌های ذخیره‌شده در پنل', 'generated on admin save')}
        </Note>
      </div>
    </div>
  );
}

// expose
Object.assign(window, {
  WF_HeroTable, WF_TickerGrid, WF_TwoCol, WF_Terminal, WF_Mobile,
  WF_AdminLogin, WF_AdminDash, WF_Branch, WF_TelegramPost,
});
