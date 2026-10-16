/* ScottJLandes.com — The brain.
   A photographic lateral-view brain (front faces left) pinned behind the homepage. Each
   section or card names a region with data-brain="..."; as it scrolls into
   place that region lights up and neurons fire across it.                */

(function brain() {
  const host = document.querySelector('.brain');
  if (!host) return;

  const NS = 'http://www.w3.org/2000/svg';
  // Coordinates are pixels of images/brain-{dark,light}.jpg (1536×1024);
  // the viewBox adds a margin around the photo for the callout labels.
  const IMG = { w: 1536, h: 1024 };
  const VB = { x: -120, y: -40, w: 1776, h: 1104 };
  const K = 2;  // stroke/dot scale relative to the old 740-wide drawing
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Anatomy (image pixels) -------------------------------------
  // SILHOUETTE was traced from the photo (background flood-fill + contour).
  const SILHOUETTE = 'M666,66 L794,66 L818,78 L866,74 L918,94 L958,98 L1058,142 L1102,186 L1126,198 L1146,218 L1158,242 L1190,270 L1214,318 L1222,326 L1246,350 L1306,482 L1310,530 L1318,550 L1318,594 L1310,602 L1302,634 L1282,662 L1246,690 L1206,698 L1218,746 L1206,778 L1186,806 L1158,830 L1114,854 L1030,882 L982,878 L950,858 L946,862 L946,850 L934,842 L934,910 L946,966 L906,970 L878,966 L866,898 L834,818 L794,786 L758,722 L650,766 L566,750 L502,698 L486,662 L486,630 L462,634 L410,622 L366,622 L346,610 L314,610 L290,602 L254,582 L234,562 L222,538 L222,514 L214,506 L210,510 L214,502 L206,486 L206,458 L214,442 L214,402 L238,358 L242,330 L262,294 L334,218 L378,190 L406,162 L454,134 L498,122 L550,94 L606,90 L634,74 L666,66 Z';
  const CEREBELLUM = 'M884,740 C910,690 1090,676 1212,700 C1228,745 1214,805 1170,834 C1110,872 1020,890 962,872 C906,852 870,790 884,740 Z';
  const BRAINSTEM = 'M760,716 C800,760 846,800 862,866 L878,972 L948,972 L934,880 C928,820 918,770 896,716 Z';
  const ARCUATE = 'M560,540 C620,390 900,320 1005,452';

  // Lobes are rough polygons clipped to the silhouette, following the
  // photo's central sulcus and Sylvian fissure; small areas are ellipses.
  // `deep` structures sit under the cortex and draw dashed.
  const R = {
    prefrontal:    { name: 'Prefrontal cortex',     fn: 'planning · strategy · thinking moves ahead', color: '#34d399', poly: 'M0,0 L640,0 L560,330 L520,560 L470,640 L0,700 Z', label: [380, 330, 0, 140] },
    premotor:      { name: 'Premotor cortex',       fn: 'sequencing actions',          color: '#5eead4', poly: 'M640,0 L725,0 L640,470 L590,520 L520,560 L560,330 Z' },
    motor:         { name: 'Primary motor cortex',  fn: 'turning intent into action',  color: '#22d3ee', poly: 'M725,0 L805,0 L770,160 L735,290 L700,440 L640,470 Z', label: [740, 190, 560, 0] },
    somatosensory: { name: 'Somatosensory cortex',  fn: 'touch & feedback',            color: '#7dd3fc', poly: 'M805,0 L895,0 L850,200 L800,330 L775,430 L700,440 L735,290 L770,160 Z' },
    parietal:      { name: 'Parietal lobe',         fn: 'numbers · structure · integrating signals', color: '#38bdf8', poly: 'M895,0 L1170,0 L1175,260 L1120,420 L1020,400 L900,420 L775,430 L800,330 L850,200 Z', label: [990, 240, 1050, 40] },
    occipital:     { name: 'Occipital lobe',        fn: 'vision · color · form · layout', color: '#818cf8', poly: 'M1170,0 L1536,0 L1536,1024 L1220,1024 L1220,700 L1150,600 L1120,420 L1175,260 Z', label: [1250, 470, 1335, 250] },
    temporal:      { name: 'Temporal lobe',         fn: 'hearing · recognition',       color: '#c4b5fd', poly: 'M0,700 L470,640 L520,560 L590,520 L640,470 L700,440 L775,430 L900,420 L1020,400 L1120,420 L1150,600 L1220,700 L1220,1024 L0,1024 Z' },
    broca:         { name: "Broca's area",          fn: 'producing language',          color: '#f59e0b', ellipse: [560, 528, 62, 38, -0.4], label: [545, 530, 330, 880] },
    wernicke:      { name: "Wernicke's area",       fn: 'understanding language',      color: '#f59e0b', ellipse: [1010, 450, 62, 38, -0.3], label: [1030, 460, 1335, 590] },
    insula:        { name: 'Insula',                fn: 'empathy · gut feeling',       color: '#fb7185', ellipse: [750, 505, 110, 28, -0.36], deep: true, label: [750, 505, 600, 985] },
    amygdala:      { name: 'Amygdala',              fn: 'emotion · bonding',           color: '#fb7185', ellipse: [600, 645, 24, 20, 0], deep: true, label: [600, 645, 330, 880] },
    hippocampus:   { name: 'Hippocampus',           fn: 'turning experience into long-term memory', color: '#facc15', path: 'M620,650 C700,630 820,600 920,560 C945,550 962,568 942,584 C862,628 732,668 642,682 C612,688 600,660 620,650 Z', deep: true, label: [780, 620, 420, 960] },
    cerebellum:    { name: 'Cerebellum',            fn: 'coordination · precise timing · routines on autopilot', color: '#a78bfa', path: CEREBELLUM, label: [1110, 800, 1250, 950] },
    brainstem:     { name: 'Brainstem',             fn: 'keeps the lights on: heartbeat & breathing', color: '#f472b6', path: BRAINSTEM, label: [905, 920, 560, 1030] },
  };
  const CORTEX = ['prefrontal', 'premotor', 'motor', 'somatosensory', 'parietal', 'occipital', 'temporal', 'broca', 'wernicke'];

  // What a data-brain value lights, and how the readout names it.
  const TARGETS = {
    prefrontal: { ids: ['prefrontal'], tag: 'strategy' },
    motor:      { ids: ['motor', 'premotor'], tag: 'action' },
    parietal:   { ids: ['parietal'], tag: 'structure' },
    occipital:  { ids: ['occipital'], tag: 'vision' },
    language:   { ids: ['broca', 'wernicke'], tag: 'language', name: "Broca's + Wernicke's areas", fn: 'producing & understanding language', arcuate: true },
    limbic:     { ids: ['insula', 'amygdala'], tag: 'empathy', name: 'Insula + amygdala', fn: 'empathy · emotion · bonding' },
    hippocampus:{ ids: ['hippocampus'], tag: 'memory' },
    temporal:   { ids: ['temporal'], tag: 'hearing' },
    cerebellum: { ids: ['cerebellum'], tag: 'coordination' },
    brainstem:  { ids: ['brainstem'], tag: 'uptime' },
    dmn:        { ids: ['prefrontal', 'parietal'], name: 'Default mode network', fn: 'the brain thinking about itself' },
    neocortex:  { ids: CORTEX, name: 'Neocortex', fn: 'pattern recognition, everywhere at once' },
    all:        { ids: Object.keys(R), name: 'Whole brain', fn: 'every region firing', arcuate: true },
  };

  // ---- Build the stage --------------------------------------------
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  };
  const shapeOf = (r, attrs, parent) => r.ellipse
    ? el('ellipse', { cx: r.ellipse[0], cy: r.ellipse[1], rx: r.ellipse[2], ry: r.ellipse[3],
        transform: `rotate(${r.ellipse[4] * 180 / Math.PI} ${r.ellipse[0]} ${r.ellipse[1]})`, ...attrs }, parent)
    : el('path', { d: r.path || r.poly, ...attrs }, parent);

  const stage = document.createElement('div');
  stage.className = 'brain__stage';
  host.appendChild(stage);

  // The photo, one per theme, placed where the viewBox puts image pixel 0,0.
  for (const theme of ['dark', 'light']) {
    const img = document.createElement('img');
    img.src = host.dataset.src.replace('{theme}', theme);
    img.alt = '';
    img.className = `brain__img brain__img--${theme}`;
    Object.assign(img.style, {
      left: `${(-VB.x / VB.w) * 100}%`, top: `${(-VB.y / VB.h) * 100}%`,
      width: `${(IMG.w / VB.w) * 100}%`, height: `${(IMG.h / VB.h) * 100}%`,
    });
    stage.appendChild(img);
  }

  const svg = el('svg', { viewBox: `${VB.x} ${VB.y} ${VB.w} ${VB.h}`, class: 'brain__svg' }, stage);
  const defs = el('defs', {}, svg);
  el('path', { d: SILHOUETTE }, el('clipPath', { id: 'brain-clip' }, defs));
  el('feGaussianBlur', { stdDeviation: 22 }, el('filter', { id: 'brain-soft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs));

  const fills = el('g', { filter: 'url(#brain-soft)' }, el('g', { 'clip-path': 'url(#brain-clip)' }, svg));
  const fillEls = {};
  for (const id in R) fillEls[id] = shapeOf(R[id], { class: 'brain__fill', fill: R[id].color }, fills);

  const ink = el('g', { class: 'brain__ink' }, svg);
  const deepEls = {};
  for (const id in R) if (R[id].deep) deepEls[id] = shapeOf(R[id], { class: 'brain__deep' }, ink);
  const arcuate = el('path', { d: ARCUATE, class: 'brain__arcuate' }, ink);

  // Callout labels: a leader line from the region out to a mono caption.
  const labels = el('g', { class: 'brain__labels' }, svg);
  const labelEls = {};
  for (const id in R) {
    const r = R[id];
    if (!r.label) continue;
    const [ax, ay, tx, ty] = r.label;
    const g = el('g', { class: 'brain__label', style: `--c:${r.color}` }, labels);
    el('circle', { cx: ax, cy: ay, r: 3 * K }, g);
    el('path', { d: `M${ax},${ay} L${tx},${ty + (ty > ay ? -30 : 12)}`, pathLength: 1 }, g);
    const t = el('text', { x: tx, y: ty }, g);
    t.textContent = r.name.toUpperCase();
    labelEls[id] = g;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'brain__canvas';
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const readout = document.createElement('div');
  readout.className = 'brain__readout';
  readout.innerHTML = '<span class="brain__readout-dot"></span><span class="brain__readout-text"><b></b><span></span></span>';
  document.body.appendChild(readout);  // outside .brain: its transform would trap position:fixed

  // ---- Neurons ------------------------------------------------------
  // Scatter nodes inside each structure, tag each with its region, and
  // wire it to its nearest neighbours.
  const paths = {};
  for (const id in R) {
    const r = R[id], p = new Path2D();
    if (r.ellipse) p.ellipse(...r.ellipse, 0, Math.PI * 2);
    else p.addPath(new Path2D(r.path || r.poly));
    paths[id] = p;
  }
  const probe = document.createElement('canvas').getContext('2d');
  const inside = (p, x, y) => probe.isPointInPath(p, x, y);

  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const nodes = [];
  function scatter(boundary, count, minDist, pick, deep) {
    const box = { x: 200, y: 60, w: 1130, h: 920 };
    const mine = [];
    for (let tries = 0; mine.length < count && tries < count * 60; tries++) {
      const x = box.x + rand() * box.w, y = box.y + rand() * box.h;
      if (!boundary.has(x, y)) continue;
      if (mine.some(n => (n.x - x) ** 2 + (n.y - y) ** 2 < minDist * minDist)) continue;
      const n = { x, y, region: pick(x, y), deep, flash: 0, links: [] };
      mine.push(n);
      nodes.push(n);
    }
    // Link each node to its 3 nearest neighbours within its own structure.
    for (const n of mine) {
      mine.filter(m => m !== n)
        .map(m => [m, (m.x - n.x) ** 2 + (m.y - n.y) ** 2])
        .filter(([, d]) => d < 84 * 84)
        .sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([m]) => { if (!n.links.includes(m)) { n.links.push(m); m.links.push(n); } });
    }
  }
  const surfaceOrder = ['broca', 'wernicke', 'motor', 'premotor', 'somatosensory', 'prefrontal', 'parietal', 'occipital', 'temporal'];
  // The silhouette includes cerebellum and brainstem; carve them out of the cerebrum.
  const silhouette = new Path2D(SILHOUETTE);
  const cerebrum = { has: (x, y) => inside(silhouette, x, y) && !inside(paths.cerebellum, x, y) && !inside(paths.brainstem, x, y) };
  scatter(cerebrum, 320, 31, (x, y) => surfaceOrder.find(id => inside(paths[id], x, y)) || 'temporal');
  scatter({ has: (x, y) => inside(paths.cerebellum, x, y) && inside(silhouette, x, y) }, 80, 19, () => 'cerebellum');
  scatter({ has: (x, y) => inside(paths.brainstem, x, y) && inside(silhouette, x, y) }, 16, 19, () => 'brainstem');
  for (const id of ['hippocampus', 'insula', 'amygdala']) scatter({ has: (x, y) => inside(paths[id], x, y) }, id === 'amygdala' ? 6 : 16, 13, () => id, true);

  // ---- Activation -------------------------------------------------
  let active = new Set();
  let activeKey = '';
  let arcuateOn = false;

  function show(key, note) {
    const t = TARGETS[key];
    if (!t || key + note === activeKey) return;
    activeKey = key + note;
    active = new Set(t.ids);
    arcuateOn = !!t.arcuate;
    for (const id in fillEls) fillEls[id].classList.toggle('is-on', active.has(id));
    for (const id in deepEls) deepEls[id].classList.toggle('is-on', active.has(id));
    // Name every lit region, unless it's a whole-brain mode.
    const labelled = t.ids.length > 3 ? [] : t.ids;
    for (const id in labelEls) labelEls[id].classList.toggle('is-on', labelled.includes(id));
    arcuate.classList.toggle('is-on', arcuateOn);

    const first = R[t.ids[0]];
    readout.style.setProperty('--c', t.ids.length > 3 || key === '__row' ? 'var(--text)' : first.color);
    readout.querySelector('b').textContent = t.name || first.name;
    readout.querySelector('b + span').textContent = t.fn === '' ? note : (t.fn || first.fn) + (note ? `  →  ${note}` : '');
    readout.classList.remove('is-fresh');
    void readout.offsetWidth;
    readout.classList.add('is-fresh');
  }

  // The current section is the last [data-brain] element (in document
  // order) whose top has risen past 60% of the viewport. Elements sharing
  // a row (the project cards) light up together.
  const targets = [...document.querySelectorAll('[data-brain]')];
  let hoverEl = null;
  // Until a [data-brain] section scrolls up, show the page's home region.
  let heroKey = host.dataset.home || 'motor', heroNote = host.dataset.homeNote || '';

  function pick() {
    if (hoverEl) return show(hoverEl.dataset.brain, hoverEl.dataset.brainNote || '');
    const line = innerHeight * 0.6;
    let best = null, bestTop = -Infinity;
    for (const t of targets) {
      const top = t.getBoundingClientRect().top;
      if (top < line && top > bestTop + 8) { best = [t]; bestTop = top; }
      else if (top < line && Math.abs(top - bestTop) <= 8) best.push(t);
    }
    document.body.classList.toggle('brain-past-hero', scrollY > innerHeight * 0.45);
    if (!best) return show(heroKey, heroNote);
    if (best.length === 1) return show(best[0].dataset.brain, best[0].dataset.brainNote || '');
    // A row of cards: light the union, and list what's lit.
    const ids = [...new Set(best.flatMap(b => TARGETS[b.dataset.brain].ids))];
    TARGETS.__row = { ids, name: `${best.length} regions firing`, fn: '',
      arcuate: best.some(b => TARGETS[b.dataset.brain].arcuate) };
    show('__row', best.map(b => `${b.dataset.brainNote} = ${TARGETS[b.dataset.brain].tag}`).join(' · '));
  }

  let queued = false;
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; pick(); }); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  // Cards slide in with staggered transforms; re-check once they land so a row lines up.
  document.addEventListener('transitionend', e => { if (e.target.matches('[data-brain]')) queue(); });

  if (matchMedia('(hover: hover)').matches) {
    for (const t of targets) {
      if (!t.matches('.card')) continue;
      t.addEventListener('mouseenter', () => { hoverEl = t; pick(); });
      t.addEventListener('mouseleave', () => { if (hoverEl === t) hoverEl = null; pick(); });
    }
  }

  // The hero's rotating role line drives the brain until you scroll.
  window.brainHero = (key, note) => { heroKey = key; heroNote = note; queue(); };

  // ---- Render -----------------------------------------------------
  let scale = 1, dpr = 1;
  function size() {
    const w = stage.clientWidth;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = w * (VB.h / VB.w) * dpr;
    scale = (w / VB.w) * dpr;
  }

  let colors = {};
  function readColors() {
    const cs = getComputedStyle(host);
    colors = { node: cs.getPropertyValue('--brain-node').trim(), link: cs.getPropertyValue('--brain-link').trim() };
  }
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const spikes = [];
  const arcuatePath = arcuate;
  const arcuateLen = arcuatePath.getTotalLength();
  let arcuateT = 0;

  function fire(from, chain, ambient) {
    if (!from.links.length) return;
    const to = from.links[(rand() * from.links.length) | 0];
    spikes.push({ from, to, t: 0, chain, ambient, speed: 0.045 + rand() * 0.04 });
  }

  function frame(now) {
    ctx.setTransform(scale, 0, 0, scale, -VB.x * scale, -VB.y * scale);
    ctx.clearRect(VB.x, VB.y, VB.w, VB.h);
    const pulse = 0.5 + 0.5 * Math.sin(now / 600);
    const lit = nodes.filter(n => active.has(n.region));

    if (!reduced) {
      if (rand() < 0.5 && lit.length) fire(lit[(rand() * lit.length) | 0], 4, false);
      if (rand() < 0.08) fire(nodes[(rand() * nodes.length) | 0], 1, true);
    }

    // Wiring inside lit regions.
    ctx.lineWidth = 0.6 * K;
    for (const n of lit) {
      ctx.strokeStyle = R[n.region].color + '40';
      ctx.beginPath();
      for (const m of n.links) if (m.region === n.region) { ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); }
      ctx.stroke();
    }

    // Nodes.
    for (const n of nodes) {
      const on = active.has(n.region);
      n.flash *= 0.92;
      if (on || n.flash > 0.05) {
        const c = R[n.region].color;
        if (n.flash > 0.05) {
          ctx.fillStyle = c + Math.round(n.flash * 70).toString(16).padStart(2, '0');
          ctx.beginPath(); ctx.arc(n.x, n.y, (3 + n.flash * 5) * K, 0, 7); ctx.fill();
        }
        ctx.fillStyle = on ? c : c + '99';
        ctx.beginPath(); ctx.arc(n.x, n.y, ((n.deep ? 1.1 : 1.5) + (on ? pulse * 0.5 : 0) + n.flash) * K, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = colors.node;
        ctx.beginPath(); ctx.arc(n.x, n.y, (n.deep ? 0.8 : 1.1) * K, 0, 7); ctx.fill();
      }
    }

    // Action potentials racing along the wiring.
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.t += reduced ? 1 : s.speed;
      const x = s.from.x + (s.to.x - s.from.x) * Math.min(s.t, 1);
      const y = s.from.y + (s.to.y - s.from.y) * Math.min(s.t, 1);
      const c = s.ambient ? colors.link : R[s.from.region].color;
      ctx.strokeStyle = c;
      ctx.lineWidth = (s.ambient ? 0.6 : 1.1) * K;
      ctx.beginPath(); ctx.moveTo(s.from.x, s.from.y); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = s.ambient ? colors.link : '#fff';
      ctx.beginPath(); ctx.arc(x, y, (s.ambient ? 0.9 : 1.6) * K, 0, 7); ctx.fill();
      if (s.t >= 1) {
        spikes.splice(i, 1);
        if (!s.ambient) s.to.flash = 1;
        if (s.chain > 0 && active.has(s.to.region)) fire(s.to, s.chain - 1, s.ambient);
      }
    }
    if (spikes.length > 160) spikes.splice(0, spikes.length - 160);

    // Language mode: a signal crossing the arcuate fasciculus, Broca ↔ Wernicke.
    if (arcuateOn && !reduced) {
      arcuateT = (arcuateT + 0.012) % 2;
      const along = arcuateT < 1 ? arcuateT : 2 - arcuateT;
      const p = arcuatePath.getPointAtLength(along * arcuateLen);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * K, 0, 7); ctx.fill();
      ctx.fillStyle = '#f59e0b33';
      ctx.beginPath(); ctx.arc(p.x, p.y, 7 * K, 0, 7); ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  readColors();
  new ResizeObserver(size).observe(stage);
  pick();
  requestAnimationFrame(() => host.classList.add('is-drawn'));
  requestAnimationFrame(frame);
})();

// ---- Hero role line: types out each role and points the brain at it ----
(function heroRoles() {
  const out = document.querySelector('.hero__role-text');
  if (!out) return;
  const roles = [
    ['Software Engineer', 'motor'],
    ['AI Tooling Builder', 'language'],
    ['Salesforce Architect', 'parietal'],
    ['Web Designer', 'occipital'],
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const point = ([text, key]) => window.brainHero && window.brainHero(key, text);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  (async () => {
    for (let i = 0; ; i = (i + 1) % roles.length) {
      const role = roles[i];
      point(role);
      if (reduced) { out.textContent = role[0]; await wait(3200); continue; }
      for (let n = 1; n <= role[0].length; n++) { out.textContent = role[0].slice(0, n); await wait(55 + Math.random() * 45); }
      await wait(2200);
      for (let n = role[0].length; n >= 0; n--) { out.textContent = role[0].slice(0, n); await wait(28); }
      await wait(250);
    }
  })();
})();
