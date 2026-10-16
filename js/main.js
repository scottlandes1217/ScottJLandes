/* ScottJLandes.com — Main JS (Standout Redesign) */

// ---- Nav scroll effect ------------------------------------
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---- Mobile hamburger menu --------------------------------
const ham    = document.querySelector('.nav__ham');
const mobile = document.querySelector('.nav__mobile');

if (ham && mobile) {
  const toggleMenu = () => {
    const open = ham.classList.toggle('open');
    mobile.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  ham.addEventListener('touchstart', (e) => {
    e.preventDefault();
    toggleMenu();
  }, { passive: false });

  ham.addEventListener('click', toggleMenu);

  mobile.querySelectorAll('.nav__mobile-link').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      mobile.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ---- Scroll reveal with spring stagger --------------------
const revealEls = document.querySelectorAll('.reveal, .reveal-l');
if (revealEls.length) {
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => ro.observe(el));
}

// ---- Card shimmer on mouse move --------------------------
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${((e.clientY - r.top)  / r.height * 100).toFixed(1)}%`);
  });
});

// ---- Theme toggle with smooth transition ------------------
const themeBtn = document.querySelector('.nav__theme');
themeBtn?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  const apply = () => {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.querySelectorAll('img[data-logo-dark]').forEach(img => {
      img.src = next === 'light' ? img.getAttribute('data-logo-dark') : img.getAttribute('data-logo-light');
    });
  };
  if (document.startViewTransition) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
});

// ---- Current page nav highlight ---------------------------
const path = window.location.pathname;
document.querySelectorAll('.nav__link').forEach(l => {
  const href = l.getAttribute('href');
  if (href && path.endsWith(href.replace(/^.*\//, '/'))) l.classList.add('active');
});

// ---- Page search: ⌘K / Ctrl+K or "/" -------------------------
// Find-in-page for the site: highlights every match with the CSS Custom
// Highlight API (no DOM changes), steps through them, and outlines the
// chip/card the current match lives in.
(function pageSearch() {
  const navInner = document.querySelector('.nav__inner');
  const theme = document.querySelector('.nav__theme');
  if (!navInner || !theme || !(window.CSS && CSS.highlights)) return;

  // Shorthand people type → words that appear on the page.
  const ALIASES = {
    js: ['javascript'], ts: ['typescript'], py: ['python'], rb: ['ruby'],
    sf: ['salesforce'], sfdc: ['salesforce'], lwc: ['lightning web components'],
    ror: ['ruby on rails'], postgres: ['postgresql'], pg: ['postgresql'], gql: ['graphql'],
    cicd: ['ci/cd'], llms: ['llm'], gpt: ['openai', 'chatgpt'], ml: ['ai'],
  };
  const SEARCH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);

  // Search button sits with the theme toggle so the nav links stay centered.
  const tools = document.createElement('div');
  tools.className = 'nav__tools';
  const btn = document.createElement('button');
  btn.className = 'nav__search';
  btn.setAttribute('aria-label', 'Search this page');
  btn.title = `Search this page (${mac ? '⌘' : 'Ctrl+'}K)`;
  btn.innerHTML = SEARCH_ICON;
  theme.replaceWith(tools);
  tools.append(btn, theme);

  const bar = document.createElement('div');
  bar.className = 'search-bar';
  bar.hidden = true;
  bar.setAttribute('role', 'search');
  bar.innerHTML = `${SEARCH_ICON}
    <input type="search" placeholder="Search this page…" aria-label="Search this page" autocomplete="off" spellcheck="false">
    <span class="search-bar__count" aria-live="polite"></span>
    <button type="button" data-step="-1" aria-label="Previous match"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg></button>
    <button type="button" data-step="1" aria-label="Next match"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>
    <button type="button" class="search-bar__close" aria-label="Close search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  document.body.appendChild(bar);
  const input = bar.querySelector('input');
  const count = bar.querySelector('.search-bar__count');

  const all = new Highlight(), current = new Highlight();
  CSS.highlights.set('search', all);
  CSS.highlights.set('search-current', current);
  let hits = [], idx = -1, hitEl = null;

  function textNodes() {
    const nodes = [];
    for (const root of document.querySelectorAll('main, footer')) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: n => {
          const el = n.parentElement;
          if (!n.nodeValue.trim() || el.closest('script, style, [aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
          return el.checkVisibility && !el.checkVisibility({ visibilityProperty: true }) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
      });
      while (walker.nextNode()) nodes.push(walker.currentNode);
    }
    return nodes;
  }

  // ponytail: matches within a single text node, so a phrase split across
  // elements (e.g. "Salesforce <span>Tech Stack</span>") won't match as one.
  function run() {
    const q = input.value.trim().toLowerCase();
    all.clear();
    hits = [];
    if (q) {
      const terms = [q, ...(ALIASES[q] || [])];
      for (const node of textNodes()) {
        const text = node.nodeValue.toLowerCase();
        const found = [];
        for (const t of terms) for (let i = text.indexOf(t); i !== -1; i = text.indexOf(t, i + t.length)) found.push([i, i + t.length]);
        found.sort((a, b) => a[0] - b[0]);
        let end = -1;
        for (const [s, e] of found) {
          if (s < end) continue;  // overlapping alias match
          const r = new Range();
          r.setStart(node, s);
          r.setEnd(node, e);
          hits.push(r);
          all.add(r);
          end = e;
        }
      }
    }
    go(0);
  }

  function go(i) {
    current.clear();
    hitEl?.classList.remove('search-hit');
    hitEl = null;
    if (!hits.length) {
      idx = -1;
      count.textContent = input.value.trim() ? 'No matches' : '';
      return;
    }
    idx = (i + hits.length) % hits.length;
    const r = hits[idx];
    current.add(r);
    count.textContent = `${idx + 1} of ${hits.length}`;
    const el = r.startContainer.parentElement;
    hitEl = el.closest('.skill-chip, .tag, .card, .exp-item__bullets li, .step');
    hitEl?.classList.add('search-hit');
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function open() {
    bar.hidden = false;
    input.focus();
    input.select();
    if (input.value) run();
  }
  function close() {
    bar.hidden = true;
    all.clear();
    current.clear();
    hitEl?.classList.remove('search-hit');
    btn.focus();
  }

  btn.addEventListener('click', () => (bar.hidden ? open() : close()));
  input.addEventListener('input', run);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); go(idx + (e.shiftKey ? -1 : 1)); }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  bar.addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) go(idx + Number(step.dataset.step));
    if (e.target.closest('.search-bar__close')) close();
  });
  document.addEventListener('keydown', e => {
    const typing = e.target.closest?.('input, textarea, [contenteditable="true"]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); open(); }
  });
})();
