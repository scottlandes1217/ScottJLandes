/* ScottJLandes.com — Main JS */

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
  ham.addEventListener('click', () => {
    const open = ham.classList.toggle('open');
    mobile.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobile.querySelectorAll('.nav__mobile-link').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      mobile.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ---- Scroll reveal ----------------------------------------
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
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

// ---- Theme toggle -----------------------------------------
const themeBtn = document.querySelector('.nav__theme');
themeBtn?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('img[data-logo-dark]').forEach(img => {
    img.src = next === 'light' ? img.getAttribute('data-logo-dark') : img.getAttribute('data-logo-light');
  });
});

// ---- Current page nav highlight (sub-pages) --------------
const path = window.location.pathname;
document.querySelectorAll('.nav__link').forEach(l => {
  const href = l.getAttribute('href');
  if (href && path.endsWith(href.replace(/^.*\//, '/'))) l.classList.add('active');
});
