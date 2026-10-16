(function sky() {
  const root = document.documentElement;
  const LAT = 44.0582, LNG = -121.3153, RAD = Math.PI / 180;
  const DUSK = 3 * 36e5;

  const DAY = [
    [0,   { bg: '#ffffff', surface: '#f4f6fb', text: '#1a1d26', text2: '#4a5068', muted: '#8b92a8', accent: '#3b82f6', accent2: '#06b6d4' }],
    [0.3, { bg: '#fffaf2', surface: '#fdf1e2', text: '#2a2016', text2: '#5c4a38', muted: '#a08a72', accent: '#ea580c', accent2: '#f59e0b' }],
    [0.5, { bg: '#f7e2c8', surface: '#f1d4b3', text: '#2b1a10', text2: '#5a3f2c', muted: '#8f6b52', accent: '#c2410c', accent2: '#ea580c' }],
  ];
  const NIGHT = [
    [0.5, { bg: '#24150f', surface: '#2e1b13', text: '#fbeee3', text2: '#dfc4ae', muted: '#9c7a64', accent: '#fb923c', accent2: '#fbbf24' }],
    [0.75, { bg: '#120c0b', surface: '#1a120e', text: '#f5ece6', text2: '#c9b6a8', muted: '#7c6658', accent: '#fb923c', accent2: '#f59e0b' }],
    [1,   { bg: '#060812', surface: '#0a0f1e', text: '#f1f5f9', text2: '#b0b8c8', muted: '#4a5578', accent: '#60a5fa', accent2: '#22d3ee' }],
  ];

  function sunTimes(now) {
    const J = now / 864e5 + 2440587.5;
    const n = Math.round(J - 2451545 + LNG / 360);
    const Jstar = n - LNG / 360;
    const M = (357.5291 + 0.98560028 * Jstar) % 360;
    const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
    const L = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + Jstar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
    const dec = Math.asin(Math.sin(L * RAD) * Math.sin(23.4397 * RAD));
    const w = Math.acos((Math.sin(-0.833 * RAD) - Math.sin(LAT * RAD) * Math.sin(dec)) / (Math.cos(LAT * RAD) * Math.cos(dec))) / RAD;
    const ms = j => (j - 2440587.5) * 864e5;
    return { rise: ms(transit - w / 360), set: ms(transit + w / 360) };
  }

  function clockT(now = Date.now()) {
    const { rise, set } = sunTimes(now);
    if (now < rise) return 1;
    if (now <= set) { const d = (now - rise) / (set - rise); return 0.5 * d * d; }
    return Math.min(1, 0.5 + 0.5 * (now - set) / DUSK);
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, f) => hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * f));
  const rgb = c => `rgb(${c.join(',')})`;
  const rgba = (c, a) => `rgba(${c.join(',')},${a})`;

  function palette(t) {
    const stops = t < 0.5 ? DAY : NIGHT;
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0, a] = stops[i], [t1, b] = stops[i + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const out = {};
    for (const k in a) out[k] = mix(a[k], b[k], f);
    return out;
  }

  let current = -1;
  function apply(t) {
    t = Math.min(1, Math.max(0, t));
    if (Math.abs(t - current) < 0.0005) return;
    current = t;
    const p = palette(t);
    const theme = t < 0.5 ? 'light' : 'dark';
    const s = root.style;
    s.setProperty('--bg', rgb(p.bg));
    s.setProperty('--bg-surface', rgb(p.surface));
    s.setProperty('--text', rgb(p.text));
    s.setProperty('--text-2', rgb(p.text2));
    s.setProperty('--text-muted', rgb(p.muted));
    s.setProperty('--ice-blue', rgb(p.accent));
    s.setProperty('--cyan', rgb(p.accent2));
    s.setProperty('--ice-soft', rgba(p.accent, 0.2));
    s.setProperty('--border-a', rgba(p.accent, 0.32));
    s.setProperty('--accent-glow', rgba(p.accent, 0.22));
    s.setProperty('--night', Math.min(1, Math.max(0, (t - 0.42) / 0.16)).toFixed(3));
    s.setProperty('--warm', (t < 0.5 ? t / 0.5 : t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25).toFixed(3));
    if (root.dataset.theme !== theme) {
      root.dataset.theme = theme;
      document.querySelectorAll('img[data-logo-dark]').forEach(img => {
        img.src = img.getAttribute(theme === 'light' ? 'data-logo-dark' : 'data-logo-light');
      });
    }
  }

  apply(clockT());

  document.addEventListener('DOMContentLoaded', () => {
    const range = document.querySelector('.sky__range');
    const now = document.querySelector('.sky__now');
    if (!range) return;
    let manual = false;
    const follow = () => { manual = false; now.hidden = true; apply(clockT()); range.value = current * 100; };

    document.querySelectorAll('img[data-logo-dark]').forEach(img => {
      img.src = img.getAttribute(root.dataset.theme === 'light' ? 'data-logo-dark' : 'data-logo-light');
    });
    range.value = current * 100;
    range.addEventListener('input', () => { manual = true; now.hidden = false; apply(range.value / 100); });
    now.addEventListener('click', follow);
    setInterval(() => { if (!manual) { apply(clockT()); range.value = current * 100; } }, 60000);
  });
})();
