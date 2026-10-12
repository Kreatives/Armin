/* =========================================================
   Armin Shah — hero
   Zelf-spelende intro (GEEN scroll/pin): sequence -> peel -> objecten.
   Config staat bovenaan (SEQUENCE, TEAR, TIMING, SERVICES).
   ========================================================= */

/* ---- Config: alles wat je met de hand kunt tunen -------- */
const SEQUENCE = { path: 'assets/sequence/frame_', ext: '.webp', count: 151, pad: 4 };

// Organische scheurlijn (voor de clip). baseY = hoogte (0–1), amplitude = rafeligheid.
const TEAR = { baseY: 0.34, amplitude: 0.045, points: 46, seed: 11 };

// Scroll: pin-lengte (% van de viewport) en welk deel van de scroll de sequence aanstuurt.
const SCROLL = { pin: 200, seqEnd: 0.6 };
// Duur van de zelf-spelende scheur-animatie (seconden), speelt NA de sequence.
const TIMING = { peel: 0.9, objects: 0.7 };

// Posities in % van de HEAD-container (x = midden, y = bovenkant, w = breedte),
// plus rotatie (graden) en z (stapelvolgorde). Compacte, overlappende cluster.
const SERVICES = [
  { slug: 'creative-strategy',                 title: 'Creative Strategy',                   href: '/diensten/creative-strategy',                 x: 35, y: 7,  w: 19, rotate: -13, z: 2 },
  { slug: 'format-ip-development',             title: 'Format & IP Development',             href: '/diensten/format-ip-development',             x: 44, y: 2,  w: 23, rotate: -5,  z: 3 },
  { slug: 'football-culture-consultancy',      title: 'Football & Culture Consultancy',      href: '/diensten/football-culture-consultancy',      x: 54, y: 0,  w: 22, rotate: 5,   z: 5 },
  { slug: 'creative-direction-production',     title: 'Creative Direction & Production',     href: '/diensten/creative-direction-production',     x: 63, y: 5,  w: 23, rotate: 11,  z: 4 },
  { slug: 'partnerships-cultural-connections', title: 'Partnerships & Cultural Connections', href: '/diensten/partnerships-cultural-connections', x: 47, y: 11, w: 16, rotate: -16, z: 1 }
];

/* ---- Setup --------------------------------------------- */
const DEBUG = new URLSearchParams(location.search).has('debug');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width: 767px)').matches;

const stage      = document.querySelector('[data-stage]');
const canvas     = document.querySelector('[data-canvas]');
const ctx        = canvas.getContext('2d');
const titleEl    = document.querySelector('[data-fit-text]');
const headEl     = document.querySelector('[data-head]');
const headBase   = document.querySelector('[data-head-base]');
const headCap    = document.querySelector('[data-head-cap]');
const headFold   = document.querySelector('[data-head-fold]');
const foldSheen  = document.querySelector('[data-fold-sheen]');
const peelShadow = document.querySelector('[data-peel-shadow]');
const headImg    = headEl.querySelector('[data-head-img="default"]');
const servicesEl = document.querySelector('[data-services]');
const loaderEl   = document.querySelector('[data-loader]');
const loaderFill = document.querySelector('[data-loader-fill]');
const cursorPill = document.querySelector('[data-cursor-pill]');

if (DEBUG) document.body.classList.add('debug');

/* ---- Scheurlijn: organische punten + clip-paden -------- */
function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const pts = (() => {
  const rnd = seededRand(TEAR.seed);
  const out = [];
  for (let i = 0; i < TEAR.points; i++) {
    const x = i / (TEAR.points - 1);
    const wave = Math.sin(x * Math.PI * 2.3) * 0.014;
    const jag = (rnd() - 0.5) * TEAR.amplitude;
    out.push([x, Math.min(0.46, Math.max(0.16, TEAR.baseY + wave + jag))]);
  }
  return out;
})();

function buildClip() {
  const line = pts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(' L');
  const first = pts[0], last = pts[pts.length - 1];
  const baseD = `M0,${first[1].toFixed(4)} L${line} L1,${last[1].toFixed(4)} L1,1 L0,1 Z`;
  const rev = [...pts].reverse().map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(' L');
  const capD = `M0,0 L1,0 L1,${last[1].toFixed(4)} L${rev} L0,${first[1].toFixed(4)} Z`;

  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.querySelector('.svg-defs defs');
  [['tear-clip-base', baseD], ['tear-clip-cap', capD]].forEach(([id, d]) => {
    const cp = document.createElementNS(ns, 'clipPath');
    cp.setAttribute('id', id);
    cp.setAttribute('clipPathUnits', 'objectBoundingBox');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    cp.appendChild(path);
    defs.appendChild(cp);
  });
  headBase.style.clipPath = 'url(#tear-clip-base)';
  headFold.style.clipPath = 'url(#tear-clip-cap)';
  headEl.style.setProperty('--tear-y', (TEAR.baseY * 100) + '%');
}

/* ---- Titel: split in woorden/chars voor de reveal ------ */
let titleChars = [];
function splitTitle() {
  const text = titleEl.textContent.trim();
  titleEl.textContent = '';
  const chars = [];
  text.split(' ').forEach(word => {
    const w = document.createElement('span');
    w.className = 'word';
    [...word].forEach(ch => {
      const c = document.createElement('span');
      c.className = 'char';
      c.textContent = ch;
      w.appendChild(c);
      chars.push(c);
    });
    titleEl.appendChild(w);
  });
  return chars;
}
function revealTitle() {
  if (reducedMotion) { gsap.set(titleChars, { yPercent: 0, opacity: 1 }); return; }
  gsap.fromTo(titleChars,
    { yPercent: 115, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.045 });
}

/* ---- Service-objecten opbouwen ------------------------- */
const services = [];
function buildServices() {
  SERVICES.forEach((s, i) => {
    const a = document.createElement('a');
    a.className = 'service';
    a.href = s.href;
    a.setAttribute('aria-label', s.title);
    a.dataset.slug = s.slug;
    a.style.setProperty('--x', s.x + '%');
    a.style.setProperty('--y', s.y + '%');
    a.style.setProperty('--w', s.w + '%');
    a.style.zIndex = s.z;

    const img = document.createElement('img');
    img.src = `assets/services/${s.slug}.webp`;
    img.alt = '';
    img.draggable = false;

    a.appendChild(img);
    servicesEl.appendChild(a);
    services.push({ el: a, img, cfg: s, hit: null, floatTween: null });

    a.addEventListener('focus', () => activate(i));
    a.addEventListener('blur',  () => { if (activeIndex === i) deactivate(); });
  });
  gsap.set(services.map(s => s.el), { rotation: (i) => SERVICES[i].rotate });
}

/* ---- Alpha hit-test (met bounding-box fallback) -------- */
const HIT_W = 200;
function buildHitMaps() {
  services.forEach(s => {
    const im = s.img;
    if (!im.naturalWidth) return;
    const h = Math.round(HIT_W * im.naturalHeight / im.naturalWidth);
    const c = document.createElement('canvas');
    c.width = HIT_W; c.height = h;
    const cx = c.getContext('2d');
    cx.drawImage(im, 0, 0, HIT_W, h);
    try { s.hit = { data: cx.getImageData(0, 0, HIT_W, h).data, w: HIT_W, h }; }
    catch (e) { s.hit = null; } // getaint canvas (file://) -> bbox fallback
    if (DEBUG) {
      s.el.querySelectorAll('.debug-hit').forEach(n => n.remove());
      c.className = 'debug-hit';
      s.el.appendChild(c);
    }
  });
}

function pick(clientX, clientY) {
  const order = services
    .map((s, i) => ({ s, i, z: s.cfg.z }))
    .sort((a, b) => b.z - a.z || b.i - a.i);
  for (const { s, i } of order) {
    if ((gsap.getProperty(s.el, 'opacity') || 0) < 0.6) continue;
    const w = s.img.offsetWidth, h = s.img.offsetHeight;
    if (!w || !h) continue;
    const r = s.img.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ang = -(gsap.getProperty(s.el, 'rotation') || 0) * Math.PI / 180;
    const dx = clientX - cx, dy = clientY - cy;
    const lx = dx * Math.cos(ang) - dy * Math.sin(ang);
    const ly = dx * Math.sin(ang) + dy * Math.cos(ang);
    const u = lx / w + 0.5, v = ly / h + 0.5;
    if (u < 0 || u > 1 || v < 0 || v > 1) continue;
    if (!s.hit) return i;
    const px = Math.min(s.hit.w - 1, Math.max(0, Math.floor(u * s.hit.w)));
    const py = Math.min(s.hit.h - 1, Math.max(0, Math.floor(v * s.hit.h)));
    if (s.hit.data[(py * s.hit.w + px) * 4 + 3] > 20) return i;
  }
  return -1;
}

/* ---- Cursor-pill --------------------------------------- */
function movePill(x, y) {
  const above = y > 90;
  cursorPill.style.left = Math.max(70, Math.min(window.innerWidth - 70, x)) + 'px';
  cursorPill.style.top = (above ? y - 16 : y + 16) + 'px';
  cursorPill.style.transform = `translate(-50%, ${above ? '-100%' : '0'})`;
}

/* ---- Activeren / deactiveren van een object ------------ */
let activeIndex = -1;
function activate(i) {
  if (i === activeIndex) return;
  if (activeIndex !== -1) resetService(activeIndex);
  activeIndex = i;
  const s = services[i];
  s.el.style.zIndex = 99;
  if (s.floatTween) s.floatTween.pause();
  gsap.to(s.el, { y: -34, scale: 1.07, rotation: s.cfg.rotate, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
  cursorPill.textContent = s.cfg.title;
  cursorPill.classList.add('is-visible');
}
function resetService(i) {
  const s = services[i];
  s.el.style.zIndex = s.cfg.z;
  gsap.to(s.el, {
    y: 0, scale: 1, rotation: s.cfg.rotate, duration: 0.4, ease: 'power3.out', overwrite: 'auto',
    onComplete: () => { if (!reducedMotion) startFloat(i); }
  });
}
function deactivate() {
  if (activeIndex === -1) return;
  resetService(activeIndex);
  activeIndex = -1;
  cursorPill.classList.remove('is-visible');
}

/* ---- Idle float: continu, één voor één ----------------- */
function startFloat(i) {
  const s = services[i];
  if (s.floatTween) s.floatTween.kill();
  s.floatTween = gsap.fromTo(s.el,
    { y: -7, rotation: s.cfg.rotate - 1.4 },
    { y: 7, rotation: s.cfg.rotate + 1.4, duration: 3 + (i % 3) * 0.7, ease: 'sine.inOut',
      yoyo: true, repeat: -1, delay: i * 0.4 });
}
function startFloats() { services.forEach((_, i) => startFloat(i)); }

/* ---- Pointer-interactie (desktop) ---------------------- */
let revealed = false;
function onPointerMove(e) {
  if (isMobile() || !revealed) return;
  const hit = pick(e.clientX, e.clientY);
  if (hit !== -1) { activate(hit); movePill(e.clientX, e.clientY); }
  else if (activeIndex !== -1) deactivate();
}
window.addEventListener('pointermove', onPointerMove);

/* ---- Mobiele navigatie: pijlen + swipe ----------------- */
function cycle(dir) {
  if (!revealed) return;
  const i = activeIndex === -1 ? (dir > 0 ? 0 : SERVICES.length - 1)
                               : (activeIndex + dir + SERVICES.length) % SERVICES.length;
  activate(i);
  const r = services[i].img.getBoundingClientRect();
  movePill(r.left + r.width / 2, r.top);
}
document.querySelector('[data-nav="prev"]').addEventListener('click', () => cycle(-1));
document.querySelector('[data-nav="next"]').addEventListener('click', () => cycle(1));
let touchX = null;
stage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
stage.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) cycle(dx < 0 ? 1 : -1);
  touchX = null;
});

/* ---- Canvas / image sequence --------------------------- */
let frames = [];
let currentFrame = -1;
function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  drawFrame(Math.max(0, currentFrame), true);
}
function drawFrame(i, force) {
  if (i === currentFrame && !force) return;
  currentFrame = i;
  const img = frames[i];
  if (!img || !img.naturalWidth) return;
  const cw = canvas.width, ch = canvas.height;
  const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - w) / 2, ch - h, w, h);
}
function buildPaths(step) {
  const p = [];
  for (let i = 1; i <= SEQUENCE.count; i += step) {
    p.push(SEQUENCE.path + String(i).padStart(SEQUENCE.pad, '0') + SEQUENCE.ext);
  }
  return p;
}
function preload(paths, onProgress) {
  return new Promise(resolve => {
    const out = new Array(paths.length);
    let loaded = 0, idx = 0, active = 0;
    (function next() {
      while (active < 8 && idx < paths.length) {
        const i = idx++; active++;
        const im = new Image();
        im.onload = im.onerror = () => {
          out[i] = im; loaded++; active--;
          onProgress(loaded / paths.length);
          if (loaded === paths.length) resolve(out); else next();
        };
        im.src = paths[i];
      }
    })();
  });
}

/* ---- Scheur-animatie: één-malig, GEEN scroll ----------- */
const peel = { fold: 0 };
const setFold = () => headFold.style.setProperty('--fold', peel.fold + 'deg');
let peelTl = null;
let torn = false;

function openHead() {
  if (torn) return;
  torn = true;
  const els = services.map(s => s.el);
  peelTl = gsap.timeline();
  peelTl.to(canvas, { autoAlpha: 0, duration: 0.25 })
        .fromTo(headEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, '<')
        // papier-peel: kapje krult om (één fold-variabele)
        .to(peel, { fold: 134, duration: TIMING.peel, ease: 'power2.inOut', onUpdate: setFold }, '>-0.05')
        .fromTo(foldSheen, { opacity: 0 }, { opacity: 1, duration: TIMING.peel * 0.55, ease: 'none' }, '<0.2')
        .fromTo(peelShadow, { opacity: 0 }, { opacity: 0.55, duration: TIMING.peel * 0.5 }, '<')
        .to(headCap, { opacity: 0, duration: 0.3 }, '>-0.28')
        .to(peelShadow, { opacity: 0, duration: 0.4 }, '<')
        // objecten poppen op (opaak: opacity snapt snel, scale/y met overshoot)
        .fromTo(els, { yPercent: 55, scale: 0.5 }, { yPercent: 0, scale: 1, stagger: 0.07, duration: TIMING.objects, ease: 'back.out(1.7)' }, '>-0.1')
        .fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.07, duration: 0.22 }, '<')
        .add(() => { revealed = true; if (!reducedMotion) startFloats(); });
}

function closeHead() {
  if (!torn) return;
  torn = false;
  revealed = false;
  deactivate();
  if (peelTl) peelTl.kill();
  services.forEach(s => { if (s.floatTween) { s.floatTween.kill(); s.floatTween = null; } });
  gsap.set(canvas, { autoAlpha: 1 });
  gsap.set(headEl, { autoAlpha: 0 });
  gsap.set(headCap, { opacity: 1 });
  peel.fold = 0; setFold();
  gsap.set(foldSheen, { opacity: 0 });
  gsap.set(peelShadow, { opacity: 0 });
  gsap.set(services.map(s => s.el), { autoAlpha: 0, y: 0, scale: 1, yPercent: 0, rotation: (i) => SERVICES[i].rotate });
}

/* ---- Scroll: sequence scrubt, daarna scheurt het hoofd -- */
function setupScroll() {
  const last = frames.length - 1;
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: '+=' + SCROLL.pin + '%',
    pin: true,
    scrub: 0.3,
    onUpdate: self => {
      const seqP = Math.min(1, self.progress / SCROLL.seqEnd); // sequence over eerste deel
      drawFrame(Math.round(seqP * last));
      if (self.progress >= SCROLL.seqEnd) openHead();           // scheur = losse animatie
      else closeHead();
    }
  });
}

/* ---- Reduced motion: direct de eindstaat --------------- */
function showEndState() {
  headEl.style.visibility = 'visible';
  gsap.set(services.map(s => s.el), { yPercent: 0, scale: 1, autoAlpha: 1, rotation: (i) => SERVICES[i].rotate });
  revealed = true;
}

/* ---- Fit-text: titel exact op contentbreedte ----------- */
function fitText() {
  const parent = titleEl.parentElement;
  const cs = getComputedStyle(parent);
  const target = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (target <= 0) return;
  titleEl.style.fontSize = '100px';
  const w = titleEl.getBoundingClientRect().width;
  if (w <= 0) return;
  const size = 100 * target / w;
  titleEl.style.fontSize = size + 'px';
  const actual = titleEl.getBoundingClientRect().width;
  if (actual > target) titleEl.style.fontSize = (size * target / actual) + 'px';
}

/* ---- Debug-overlays ------------------------------------ */
function addDebugOverlays() {
  headEl.style.visibility = 'visible';
  const line = document.createElement('div');
  line.className = 'debug-tearline';
  line.style.top = (TEAR.baseY * 100) + '%';
  headEl.appendChild(line);
}

/* ---- Hero tonen zodra fonts + eerste frame klaar zijn --- */
let heroShown = false;
function showHero() {
  if (heroShown) return;
  heroShown = true;
  document.documentElement.classList.remove('hero-loading');
  fitText();
  revealTitle();
}

/* ---- Init ---------------------------------------------- */
function init() {
  buildClip();
  titleChars = splitTitle();
  gsap.set(titleChars, { yPercent: 115, opacity: 0 });
  buildServices();
  fitText();
  if (DEBUG) addDebugOverlays();

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.all(services.map(s => s.img.decode().catch(() => {}))).then(buildHitMaps);

  window.addEventListener('resize', () => {
    fitText();
    resizeCanvas();
    buildHitMaps();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  if (reducedMotion) {
    showEndState();
    fontsReady.then(showHero);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const paths = buildPaths(isMobile() ? 2 : 1);
  preload(paths, p => { loaderFill.style.width = (p * 100) + '%'; })
    .then(imgs => {
      frames = imgs;
      resizeCanvas();
      drawFrame(0, true);
      loaderEl.classList.add('is-done');
      fontsReady.then(() => { showHero(); setupScroll(); ScrollTrigger.refresh(); });
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
