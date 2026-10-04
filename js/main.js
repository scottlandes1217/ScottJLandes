/* ScottJLandes.com — Main JS (Standout Redesign) */

// ---- Canvas particle network ---------------------------------
(function initCanvas() {
  const canvas = document.querySelector('.hero__canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];
  const COUNT = 48;          // nodes at desktop
  const CONNECT_DIST = 140;  // max link distance
  let scrollVel = 0;
  let lastY = window.scrollY;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
    if (nodes.length === 0) {
      for (let i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.2 + Math.random() * 1.2,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const boost = 1 + scrollVel * 0.5;

    // Draw connections first
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.25;
          // Alternate ice-blue and cyan for visual interest
          ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw and update nodes
    for (const n of nodes) {
      n.x += n.vx * boost;
      n.y += n.vy * boost;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      // Pulse on scroll velocity
      const pulseR = n.r + (scrollVel > 0.5 ? Math.sin(Date.now() * 0.008) * 0.6 : 0);

      ctx.beginPath();
      ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
      // Cycle colors: ice-blue and cyan
      const colorIdx = (nodes.indexOf(n)) % 3;
      if (colorIdx === 0) {
        ctx.fillStyle = 'rgba(96,165,250,0.7)';
      } else if (colorIdx === 1) {
        ctx.fillStyle = 'rgba(34,211,238,0.6)';
      } else {
        ctx.fillStyle = 'rgba(129,140,248,0.5)'; // indigo accent
      }
      ctx.fill();
    }

    scrollVel *= 0.92; // decay
    requestAnimationFrame(draw);
  }

  window.addEventListener('scroll', () => {
    const cur = window.scrollY;
    scrollVel = Math.abs(cur - lastY) * 0.05;
    lastY = cur;
  }, { passive: true });

  resize();
  draw();
  window.addEventListener('resize', () => { nodes = []; resize(); });
})();

// ---- Character-by-character hero title reveal ----------------
(function charReveal() {
  const title = document.querySelector('.hero__title');
  if (!title) return;
  // Only animate for users who prefer motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Wrap each character in a span
  function wrapChars(el) {
    const text = el.textContent;
    el.innerHTML = '';
    let i = 0;
    for (const ch of text) {
      if (ch === '\n' || ch === ' ') {
        if (ch === ' ') {
          el.appendChild(document.createTextNode(' ')); // non-breaking space
        }
        continue;
      }
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      el.appendChild(span);
      i++;
    }
  }

  wrapChars(title);
  const chars = title.querySelectorAll('.char');
  chars.forEach((ch, idx) => {
    setTimeout(() => ch.classList.add('revealed'), 200 + idx * 28);
  });
})();

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
