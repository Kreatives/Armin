/* =========================================================
   Armin Shah — hero
   Zelf-spelende intro (GEEN scroll/pin): sequence -> peel -> objecten.
   Config staat bovenaan (SEQUENCE, TEAR, TIMING, SERVICES).
   ========================================================= */

/* ---- Config: alles wat je met de hand kunt tunen -------- */
const SEQUENCE = { path: 'assets/sequence/frame_', ext: '.webp', count: 151, pad: 4 };

// Scroll: pin-lengte (% van de viewport) en welk deel van de scroll de sequence aanstuurt.
const SCROLL = { pin: 150, seqEnd: 0.66 };
// Duur van de scheur-animatie (seconden), speelt NA de sequence. curl = de OGL page-curl.
const TIMING = { curl: 2.6, objects: 0.7 };

// Posities in % van de HEAD-container (x = midden, y = bovenkant, w = breedte),
// plus rotatie (graden) en z (stapelvolgorde). Compacte, overlappende cluster.
const SERVICES = [
  { slug: 'creative-strategy',                 title: 'Creative Strategy',                   href: '/diensten/creative-strategy',                 x: 29, y: 7,  w: 16, rotate: -13, z: 2 },
  { slug: 'format-ip-development',             title: 'Format & IP Development',             href: '/diensten/format-ip-development',             x: 38, y: 2,  w: 20, rotate: -5,  z: 3 },
  { slug: 'football-culture-consultancy',      title: 'Football & Culture Consultancy',      href: '/diensten/football-culture-consultancy',      x: 48, y: 0,  w: 19, rotate: 5,   z: 5 },
  { slug: 'creative-direction-production',     title: 'Creative Direction & Production',     href: '/diensten/creative-direction-production',     x: 57, y: 5,  w: 20, rotate: 11,  z: 4 },
  { slug: 'partnerships-cultural-connections', title: 'Partnerships & Cultural Connections', href: '/diensten/partnerships-cultural-connections', x: 41, y: 11, w: 14, rotate: -16, z: 1 }
];

// Merken/platforms waar Armin mee werkte (logo-marquee).
const LOGOS = [
  { name: 'Convo', src: 'assets/cases/convo/logo.png' },
  { name: "Kick 't Met", src: 'assets/cases/kick-t-met/logo.png' },
  { name: "Kick 't Net", src: 'assets/cases/kick-t-net/logo.png' },
  { name: 'Convo × Rabobank', src: 'assets/cases/rabobank/logo.png' },
  { name: 'Ziggo', src: 'assets/logos/ziggo.png' },
  { name: 'Red Bull', src: 'assets/logos/red-bull.png' },
  { name: 'Complex', src: 'assets/logos/complex.png' },
  { name: 'Adidas', src: 'assets/logos/adidas.png' },
  { name: 'Puma', src: 'assets/logos/puma.png' },
  { name: 'Reebok', src: 'assets/logos/reebok.png' },
  { name: 'KFC', src: 'assets/logos/kfc.png' },
  { name: 'Zalando', src: 'assets/logos/zalando.png' },
  { name: 'FIFA', src: 'assets/logos/fifa.png' },
  { name: 'AFCON', src: 'assets/logos/afcon.png' },
  { name: 'G-Shock', src: 'assets/logos/gshock.png' },
  { name: 'Hot Ones', src: 'assets/logos/hot-ones.png' },
  { name: 'Spire', src: 'assets/logos/spire.png' },
  { name: 'Telfaz', src: 'assets/logos/telfaz.png' },
];

// Cases in de werk-sectie (gebaseerd op Armins echte projecten).
// Cases komen uit cases.js (window.CASES). Fallback op lege lijst.
const CASES = window.CASES || [];

// Diensten-reel (odometer) + zwevende video-kaarten (per dienst een eigen set posities).
const DIENSTEN = ['Creative Strategy', 'Format & IP', 'Football & Culture', 'Creative Direction', 'Partnerships'];
const DCARD_VIDEO = 'assets/video/showreel.mp4';
const DCARD_LABELS = ['video productie', 'case', 'showreel'];
// Centerpunten (x,y) van de 3 zwevende kaarten per set — aan de zijkanten zodat de
// odometer-tekst in het midden vrij blijft en alles binnen beeld valt.
const DCARD_SETS = [
  [ { x: '19%', y: '46%' }, { x: '50%', y: '30%' }, { x: '82%', y: '52%' } ],
  [ { x: '22%', y: '34%' }, { x: '52%', y: '56%' }, { x: '80%', y: '36%' } ],
  [ { x: '18%', y: '52%' }, { x: '48%', y: '31%' }, { x: '81%', y: '48%' } ],
  [ { x: '24%', y: '36%' }, { x: '54%', y: '56%' }, { x: '78%', y: '32%' } ],
  [ { x: '20%', y: '48%' }, { x: '50%', y: '31%' }, { x: '82%', y: '50%' } ]
];

/* ---- Setup --------------------------------------------- */
const DEBUG = new URLSearchParams(location.search).has('debug');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width: 767px)').matches;

const stage      = document.querySelector('[data-stage]');
const canvas     = document.querySelector('[data-canvas]');
const ctx        = canvas.getContext('2d');
const titleEl    = document.querySelector('[data-fit-text]');
const heroFrame  = document.querySelector('.hero__frame');
const headEl     = document.querySelector('[data-head]');
const curlCanvas = document.querySelector('[data-curl-canvas]');
const servicesEl = document.querySelector('[data-services]');
const loaderEl   = document.querySelector('[data-loader]');
const loaderFill = document.querySelector('[data-loader-fill]');
const preloaderEl  = document.querySelector('[data-preloader]');
const preloaderNum = document.querySelector('[data-preloader-num]');
let   preloaderPct = 0;
function setPreloader(p) {                          // p = 0..1
  const pct = Math.max(preloaderPct, Math.round(p * 100));   // nooit terugtellen
  preloaderPct = pct;
  if (preloaderNum) preloaderNum.textContent = pct;
}
function hidePreloader() {
  setPreloader(1);
  if (preloaderEl) preloaderEl.classList.add('is-done');
}
// Tijdgestuurde teller: loopt vloeiend naar 100 over een minimale duur, en
// wacht met de laatste sprint tot de assets (ready) klaar zijn.
function runPreloader(ready) {
  if (!preloaderEl) return;
  const MIN = 2200;                                 // ms — minimale zichtduur
  let done = false, start = null;
  ready.then(() => { done = true; });
  function tick(t) {
    if (start === null) start = t;
    const timeP = Math.min((t - start) / MIN, 1);
    const eased = 1 - Math.pow(1 - timeP, 2);        // ease-out
    const p = Math.min(eased, done ? 1 : 0.9);       // laatste 10% pas als assets klaar zijn
    setPreloader(p);
    if (done && timeP >= 1) { hidePreloader(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const cursorPill = document.querySelector('[data-cursor-pill]');

if (DEBUG) document.body.classList.add('debug');

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
  // Na de reveal het woord-masker vrijgeven, zodat de letters niet meer aan de
  // bovenkant worden afgesneden en de titel netjes het scherm uit scrollt.
  if (reducedMotion) { gsap.set(titleChars, { yPercent: 0, opacity: 1 }); titleEl.classList.add('is-revealed'); return; }
  gsap.fromTo(titleChars,
    { yPercent: 115, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.045,
      onComplete: () => titleEl.classList.add('is-revealed') });
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
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

/* ---- Scheur-animatie: OGL page-curl, één-malig (geen scroll) --- */
const curl = { p: 0 };
const setCurl = () => { if (window.HeadCurl) window.HeadCurl.setProgress(curl.p); };
let peelTl = null;
let torn = false;

function openHead() {
  if (torn) return;
  torn = true;
  revealed = true;                 // hover werkt zodra objecten zichtbaar zijn (pick gate op opacity)
  const els = services.map(s => s.el);
  // Harde swap (geen fade -> geen 'licht worden'): sequence uit, hoofd aan.
  gsap.set(canvas, { autoAlpha: 0 });
  gsap.set(headEl, { autoAlpha: 1 });
  gsap.set(curlCanvas, { opacity: 1, xPercent: 0, yPercent: 0, rotation: 0 });
  curl.p = 0.001; setCurl();       // OGL rendert het bovenstuk meteen (plat), dan rolt het op

  peelTl = gsap.timeline({ onComplete: () => { if (!reducedMotion) startFloats(); } });
  peelTl
    // papier peelt/rolt op en gaat het beeld uit (geen wegvliegen)
    .to(curl, { p: 1, duration: TIMING.curl, ease: 'power1.inOut', onUpdate: setCurl }, 0)
    // objecten poppen op terwijl het papier oprolt (opaak)
    .fromTo(els, { yPercent: 55, scale: 0.5 }, { yPercent: 0, scale: 1, stagger: 0.07, duration: TIMING.objects, ease: 'back.out(1.7)' }, TIMING.curl * 0.2)
    .fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.07, duration: 0.22 }, '<');
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
  gsap.set(curlCanvas, { opacity: 0, xPercent: 0, yPercent: 0, rotation: 0 });
  curl.p = 0; setCurl();
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
      const p = self.progress;
      const seqP = Math.min(1, p / SCROLL.seqEnd);              // sequence over eerste deel
      drawFrame(Math.round(seqP * last));
      if (p >= SCROLL.seqEnd) {
        openHead();                                            // scheur = losse animatie
        const t = (p - SCROLL.seqEnd) / (1 - SCROLL.seqEnd);   // 0..1 in het restdeel
        gsap.set(heroFrame, { y: -t * 260 });                 // parallax: alleen de titel schuift weg
      } else {
        closeHead();
        gsap.set(heroFrame, { y: 0 });
      }
    }
  });
}

/* ---- Reduced motion: direct de eindstaat --------------- */
function showEndState() {
  headEl.style.visibility = 'visible';
  gsap.set(curlCanvas, { opacity: 0 });    // bovenstuk 'weg' -> open hoofd
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

/* ---- Content-secties na de hero ------------------------ */
function buildMarquee() {
  const track = document.querySelector('[data-marquee]');
  if (!track) return;
  // CMS-override (window.CMS_MARQUEE) heeft voorrang, anders de lijst hierboven.
  const logos = (window.CMS_MARQUEE && window.CMS_MARQUEE.length) ? window.CMS_MARQUEE : LOGOS;
  const items = logos.map(l => `<span class="marquee__item"><img class="marquee__logo" src="${l.src}" alt="${l.name || ''}" loading="lazy" /></span>`).join('');
  track.innerHTML = items + items;                 // 2x voor een naadloze loop
}

/* ---- 3D ring-carousel (cases + partners) --------------- */
const PARTNERS = [
  { src: 'assets/logos/ziggo.png', alt: 'Ziggo' },
  { src: 'assets/logos/red-bull.png', alt: 'Red Bull' },
  { src: 'assets/logos/complex.png', alt: 'Complex' },
  { src: 'assets/logos/adidas.png', alt: 'Adidas' },
  { src: 'assets/logos/puma.png', alt: 'Puma' },
  { src: 'assets/logos/reebok.png', alt: 'Reebok' },
  { src: 'assets/logos/kfc.png', alt: 'KFC', light: true },
  { src: 'assets/logos/zalando.png', alt: 'Zalando' },
  { src: 'assets/logos/fifa.png', alt: 'FIFA' },
  { src: 'assets/logos/afcon.png', alt: 'AFCON' },
  { src: 'assets/logos/hot-ones.png', alt: 'Hot Ones', light: true },
  { src: 'assets/logos/gshock.png', alt: 'G-Shock' },
  { src: 'assets/logos/legacy-show.png', alt: 'The Legacy Show' },
  { src: 'assets/logos/convo.png', alt: 'CONVO' },
  { src: 'assets/logos/kick-t-met.png', alt: "Kick 't Met" }
];
let casesRing = null, partnersRing = null;

function ringCardWidth(stage, base, min) {
  const w = stage.clientWidth || window.innerWidth;
  return Math.round(Math.max(min, Math.min(base, w * 0.8)));
}

// Zet DOM-kaarten op een cilinder en maakt 'm sleep-/roteerbaar (+ zachte auto-spin).
function createRing(stage, cardEls, opts) {
  opts = opts || {};
  const N = cardEls.length;
  if (!N) return null;
  const angle = 360 / N;
  const radius = Math.round((opts.cardW / 2) / Math.tan(Math.PI / N) * (opts.spread || 1));

  const ring = document.createElement('div');
  ring.className = 'ring3d';
  // Concave "wrap" (kaarten buigen om de kijker heen): draaipunt ligt vóór het kaartvlak
  // (transform-origin op +radius). Spinnen = per kaart de rotateY bijwerken.
  cardEls.forEach((el, i) => {
    el.classList.add('ring3d__card');
    el.style.width = opts.cardW + 'px';
    if (opts.cardH) el.style.height = opts.cardH + 'px';
    el.style.transformOrigin = `50% 50% ${radius}px`;
    ring.appendChild(el);
  });
  stage.innerHTML = '';
  stage.appendChild(ring);

  // Op mobiel: geen intro-/auto-spin en geen sleep -> rustig, alleen de pijlen.
  const noSpin = reducedMotion || isMobile();
  const state = { rot: 0, vel: noSpin ? 0 : (opts.introSpin || 0), target: null, last: NaN, hover: false, dragging: false, lastX: 0, moved: 0 };
  const auto = noSpin ? 0 : (opts.autoSpin || 0);
  const listeners = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); };

  const render = () => {
    for (let i = 0; i < cardEls.length; i++)
      cardEls[i].style.transform = `translate(-50%, -50%) rotateY(${i * angle + state.rot}deg)`;
  };
  render();

  function tick() {
    if (!state.dragging) {
      if (state.target !== null) {
        // Pijl-stap: zacht naar de doel-rotatie toe (ease-out) -> geen sprong.
        state.rot += (state.target - state.rot) * 0.12;
        if (Math.abs(state.target - state.rot) < 0.04) { state.rot = state.target; state.target = null; }
      } else {
        if (!state.hover) state.rot += auto;
        state.rot += state.vel;
        state.vel *= 0.92;
        if (Math.abs(state.vel) < 0.002) state.vel = 0;
      }
    }
    if (state.rot !== state.last) { render(); state.last = state.rot; }
    stage._raf = requestAnimationFrame(tick);
  }
  tick();

  const getX = e => (e.touches ? e.touches[0].clientX : e.clientX);
  on(stage, 'mousedown', e => { state.dragging = true; state.target = null; state.moved = 0; state.lastX = getX(e); state.vel = 0; stage.classList.add('is-grabbing'); });
  on(stage, 'touchstart', e => { if (isMobile()) return; state.dragging = true; state.target = null; state.moved = 0; state.lastX = getX(e); state.vel = 0; }, { passive: true });
  const move = e => {
    if (!state.dragging) return;
    const x = getX(e), dx = x - state.lastX, d = dx * 0.22;
    state.lastX = x; state.moved += Math.abs(dx); state.rot += d; state.vel = d;
  };
  on(window, 'mousemove', move);
  on(window, 'touchmove', e => { if (isMobile()) return; move(e); }, { passive: true });
  const up = () => { if (!state.dragging) return; state.dragging = false; stage.classList.remove('is-grabbing'); };
  on(window, 'mouseup', up);
  on(window, 'touchend', up);
  on(stage, 'mouseenter', () => { state.hover = true; });
  on(stage, 'mouseleave', () => { state.hover = false; });
  // Na een sleep: klik onderdrukken zodat de kaart-link niet per ongeluk opent.
  on(stage, 'click', e => { if (state.moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

  return {
    step(dir) { state.vel = 0; state.target = (state.target === null ? state.rot : state.target) + dir * angle; },
    destroy() { cancelAnimationFrame(stage._raf); listeners.forEach(([t, ev, fn, o]) => t.removeEventListener(ev, fn, o)); }
  };
}

function buildCasesRing() {
  const stage = document.querySelector('[data-cases-ring]');
  if (!stage || !CASES.length) return;
  if (casesRing) casesRing.destroy();
  const cardW = ringCardWidth(stage, 620, 320);
  const cards = CASES.map(c => {
    const a = document.createElement('a');
    a.className = 'rcase';
    a.href = `/case?case=${encodeURIComponent(c.slug)}`;
    a.setAttribute('aria-label', `${c.title} — ${c.sub}`);
    // Poster per case: foto-cover -> die foto; video-cover -> de thumb. Heeft een case
    // een eigen video op schijf maar enkel de generieke fallback-thumb, gebruik dan het
    // eigen poster-frame (<slug>/poster.webp) i.p.v. overal dezelfde showreel-poster.
    let poster = /\.(webp|jpe?g|png)$/i.test(c.cover.src) ? c.cover.src : c.thumb;
    const dir = c.cover.src.match(/^(assets\/cases\/[^/]+)\//);
    if (dir && /showreel-poster/.test(poster)) poster = dir[1] + '/poster.webp';
    // iOS kan niet veel autoplay-video's tegelijk aan -> op mobiel poster-afbeeldingen.
    const media = (!isMobile() && /\.mp4$/i.test(c.cover.src))
      ? `<video src="${c.cover.src}" poster="${poster}" autoplay muted loop playsinline preload="metadata"></video>`
      : `<img src="${poster}" alt="" loading="lazy" />`;
    a.innerHTML = `<div class="rcase__media">${media}<span class="rcase__brand">${c.brand}</span></div><span class="rcase__sub">${c.sub}</span>`;
    return a;
  });
  casesRing = createRing(stage, cards, { cardW, autoSpin: 0, introSpin: 3, spread: 1.07 });
  stage.querySelectorAll('video').forEach(v => v.play && v.play().catch(() => {}));
}

function buildPartnersRing() {
  const stage = document.querySelector('[data-partners-ring]');
  if (!stage || !PARTNERS.length) return;
  if (partnersRing) partnersRing.destroy();
  const cardW = ringCardWidth(stage, 230, 160);
  const cardH = Math.round(cardW * 0.62);
  const cards = PARTNERS.map(p => {
    const d = document.createElement('div');
    d.className = 'rpartner' + (p.light ? ' rpartner--light' : '');
    d.innerHTML = `<img src="${p.src}" alt="${p.alt}" loading="lazy" />`;
    return d;
  });
  partnersRing = createRing(stage, cards, { cardW, cardH, autoSpin: -0.05, introSpin: -4, spread: 1.05 });
}

// Pijlen onder de cases draaien de ring één kaart verder.
function setupWork() {
  const prev = document.querySelector('[data-work-prev]');
  const next = document.querySelector('[data-work-next]');
  if (prev) prev.addEventListener('click', () => casesRing && casesRing.step(-1));
  if (next) next.addEventListener('click', () => casesRing && casesRing.step(1));
}

function setupReveals() {
  if (reducedMotion) return;                       // reduced motion: gewoon tonen
  document.body.classList.add('has-reveal');
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
}

/* ---- Diensten: fullscreen overlay (odometer + video-kaarten) --- */
let dienstReelInner = null, dienstIndex = 0, dienstWheelLock = false;
const dienstOverlay = () => document.getElementById('diensten');

// Case -> dienst-index (voor de highlight in de onderste balk).
function dienstIndexOf(c) {
  const s = (c.services || '').toLowerCase();
  if (s.indexOf('format') >= 0) return DIENSTEN.indexOf('Format & IP');
  if (s.indexOf('football') >= 0) return DIENSTEN.indexOf('Football & Culture');
  if (s.indexOf('creative direction') >= 0) return DIENSTEN.indexOf('Creative Direction');
  if (s.indexOf('partnership') >= 0) return DIENSTEN.indexOf('Partnerships');
  return DIENSTEN.indexOf('Creative Strategy');
}

// Unieke media-items voor de zwevende kaarten (cover + body-media). Geen padding -> geen duplicaten.
function cardMediaFor(c) {
  return [c.cover].concat(c.media || []).filter(Boolean)
    .map(m => (typeof m === 'string' ? { src: m, portrait: false } : m))
    .slice(0, 3);
}

// Eerste landscape (16:9) video van een case — cover heeft voorrang, anders de body-media.
function landscapeVideoFor(c) {
  return [c.cover].concat(c.media || []).filter(Boolean)
    .map(m => (typeof m === 'string' ? { src: m, portrait: false } : m))
    .filter(m => !m.portrait && /\.mp4$/i.test(m.src))
    .map(m => m.src)[0] || null;
}

let dienstBgSrc = null;
// Volledige achtergrond-media van de actieve case: eerst een 16:9 video, anders de
// cover (video/foto), anders de poster. Op mobiel is dit de zichtbare case-media
// (de zwevende kaarten zijn daar verborgen).
function updateDienstBg(i) {
  const bg = document.querySelector('[data-diensten-bg]');
  if (!bg) return;
  const c = CASES[i] || {};
  const coverSrc = c.cover && c.cover.src;
  const src = landscapeVideoFor(c)
    || coverSrc                                     // cover (video óf foto) als er geen 16:9-video is
    || c.thumb || null;                             // laatste redmiddel: de poster
  if (src === dienstBgSrc) return;                  // zelfde bron -> niet opnieuw laden
  dienstBgSrc = src;
  bg.innerHTML = '';
  if (!src) { bg.classList.remove('is-visible'); return; }
  if (/\.mp4$/i.test(src)) {
    const v = document.createElement('video');
    // iOS: muted + playsinline + autoplay als ATTRIBUUT, anders weigert autoplay.
    v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');
    v.loop = true; v.autoplay = true; v.setAttribute('autoplay', '');
    v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.preload = 'auto';
    if (c.thumb) v.poster = c.thumb;                // nooit zwart voordat de video speelt
    v.src = src;
    bg.appendChild(v);
    if (v.play) v.play().catch(() => {});
  } else {
    const im = document.createElement('img'); im.src = src; im.alt = '';
    bg.appendChild(im);
  }
  bg.classList.add('is-visible');
}

// Toont het merk-logo van de actieve case op de popup-achtergrond (indien aanwezig).
function updateDienstLogo(i) {
  const el = document.querySelector('[data-diensten-logo]');
  if (!el) return;
  const logo = CASES[i] && CASES[i].logo;
  if (logo) { el.src = logo; el.classList.add('is-visible'); }
  else { el.removeAttribute('src'); el.classList.remove('is-visible'); }
}

function renderDienstCards(i) {
  const cards = document.querySelector('[data-diensten-cards]');
  if (!cards) return;
  cards.innerHTML = '';
  // Op mobiel geen kaart-video's bouwen: ook verborgen video's tellen mee voor de
  // iOS-decoderlimiet en zouden de ene zichtbare achtergrondvideo blokkeren.
  if (isMobile()) return;
  const c = CASES[i];
  if (!c) return;
  const media = cardMediaFor(c);
  const three = DCARD_SETS[i % DCARD_SETS.length] || DCARD_SETS[0];
  // Posities passen zich aan het aantal kaarten aan (1 = midden, 2 = gespreid, 3 = set).
  const layout = media.length === 1 ? [{ x: '72%', y: '42%' }]
    : media.length === 2 ? [{ x: '30%', y: '46%' }, { x: '72%', y: '38%' }]
    : three;
  media.forEach((item, idx) => {
    const pos = layout[idx];
    const el = document.createElement('a');
    el.className = 'diensten__card ' + (item.portrait ? 'diensten__card--portrait' : 'diensten__card--landscape');
    el.href = `/case?case=${encodeURIComponent(c.slug)}`;
    el.style.left = pos.x; el.style.top = pos.y;   // centerpunt; CSS centreert via transform
    el.style.animationDelay = (idx * 0.9) + 's';

    const isVid = /\.mp4$/i.test(item.src);
    // Hoofdmedia (in het scherm) + ambilight-dupe (zelfde bron, achter het scherm).
    const make = cls => {
      let n;
      if (isVid) {
        n = document.createElement('video');
        n.src = item.src; n.muted = true; n.loop = true; n.playsInline = true; n.autoplay = true; n.preload = 'metadata';
      } else {
        n = document.createElement('img'); n.src = item.src; n.alt = '';
      }
      n.className = cls;
      return n;
    };
    const glow = make('dcard__ambilight'); glow.setAttribute('aria-hidden', 'true');
    const m = make('dcard__video');
    const screen = document.createElement('span'); screen.className = 'dcard__screen';
    screen.append(m);
    const label = document.createElement('span'); label.className = 'dcard__label';
    label.textContent = c.brand;

    el.append(glow, screen, label);
    cards.appendChild(el);
    if (m.play) m.play().catch(() => {});
    if (glow.play) glow.play().catch(() => {});
  });
}

function buildDiensten() {
  const reel = document.querySelector('[data-diensten-reel]');
  const menu = document.querySelector('[data-diensten-menu]');
  if (!reel || !CASES.length) return;
  const inner = document.createElement('div');
  inner.className = 'diensten__reel-inner';
  CASES.forEach(c => { const it = document.createElement('div'); it.className = 'dienst-item'; it.textContent = c.brand; inner.appendChild(it); });
  reel.appendChild(inner);
  dienstReelInner = inner;
  // Onderaan: de diensten (services). Klik = spring naar de eerste case met die dienst.
  DIENSTEN.forEach((d, di) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = d;
    b.addEventListener('click', () => {
      const idx = CASES.findIndex(c => dienstIndexOf(c) === di);
      if (idx >= 0) setDienst(idx);
    });
    menu.appendChild(b);
  });
  renderDienstCards(0);
  setDienst(0, true);

  document.querySelectorAll('[data-open-diensten]').forEach(b => b.addEventListener('click', (e) => {
    // Als er in het CMS een link is ingevuld -> daarheen navigeren i.p.v. de overlay openen.
    const href = b.getAttribute('data-cms-href');
    if (href) { e.preventDefault(); window.location.href = href; return; }
    openDiensten();
  }));
  const closeBtn = document.querySelector('[data-diensten-close]');
  if (closeBtn) closeBtn.addEventListener('click', closeDiensten);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && dienstOverlay().classList.contains('is-open')) closeDiensten(); });
}

function setDienst(i, instant) {
  if (!dienstReelInner) return;
  dienstIndex = i;
  updateDienstBg(i);
  updateDienstLogo(i);
  const items = dienstReelInner.querySelectorAll('.dienst-item');
  items.forEach((it, idx) => it.classList.toggle('is-active', idx === i));
  const activeDienst = dienstIndexOf(CASES[i]);       // highlight de dienst van deze case
  document.querySelectorAll('[data-diensten-menu] button').forEach((b, idx) => b.classList.toggle('is-active', idx === activeDienst));
  const itemH = items[0].offsetHeight || (window.innerHeight * 0.16);
  const y = -(i - 1) * itemH;                        // actieve case in het midden (odometer)
  if (instant || reducedMotion) { gsap.set(dienstReelInner, { y }); renderDienstCards(i); return; }
  gsap.to(dienstReelInner, { y, duration: 0.6, ease: 'power3.out' });
  // Kaarten faden rustig uit (licht omhoog) en de nieuwe set fadet weer in -> blijft in beeld.
  const cards = document.querySelector('[data-diensten-cards]');
  gsap.to(cards.children, {
    opacity: 0, y: -32, duration: 0.32, stagger: 0.05, ease: 'power2.in',
    onComplete: () => {
      renderDienstCards(i);
      gsap.fromTo(cards.children, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out' });
    }
  });
}

function stepDienst(dir) {
  if (!CASES.length) return;
  setDienst((dienstIndex + dir + CASES.length) % CASES.length);
}
function openDiensten() {
  const ov = dienstOverlay();
  ov.classList.add('is-open'); ov.setAttribute('aria-hidden', 'false');
  document.body.classList.add('diensten-open');
  setDienst(dienstIndex, true);       // reel-hoogte klopt nu pas (was hidden)
  ov.addEventListener('wheel', onDienstWheel, { passive: false });
  ov.addEventListener('touchstart', onDienstTouchStart, { passive: true });
  ov.addEventListener('touchend', onDienstTouchEnd, { passive: true });
  ov.querySelectorAll('video').forEach(v => v.play && v.play().catch(() => {}));
}
function closeDiensten() {
  const ov = dienstOverlay();
  ov.classList.remove('is-open'); ov.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('diensten-open');
  ov.removeEventListener('wheel', onDienstWheel);
  ov.removeEventListener('touchstart', onDienstTouchStart);
  ov.removeEventListener('touchend', onDienstTouchEnd);
}
function onDienstWheel(e) {
  e.preventDefault();
  if (dienstWheelLock || Math.abs(e.deltaY) < 8) return;
  dienstWheelLock = true; setTimeout(() => { dienstWheelLock = false; }, 750);
  stepDienst(e.deltaY > 0 ? 1 : -1);
}
// Mobiel: verticaal vegen bladert door de cases (de wheel-interactie van desktop).
let dienstTouchY = null;
function onDienstTouchStart(e) { dienstTouchY = e.touches[0].clientY; }
function onDienstTouchEnd(e) {
  if (dienstTouchY === null) return;
  const dy = e.changedTouches[0].clientY - dienstTouchY;
  dienstTouchY = null;
  if (Math.abs(dy) > 45) stepDienst(dy < 0 ? 1 : -1);   // omhoog vegen -> volgende case
}

/* ---- Scroll-highlight (tekst vult in bij scrollen) ------ */
function setupHighlight() {
  document.querySelectorAll('[data-highlight]').forEach(el => {
    const fill = el.dataset.hlColor || '#F7F5F0';   // per sectie instelbaar (default wit)
    const text = el.textContent.trim();
    el.textContent = '';
    const chars = [];
    text.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span'); w.className = 'hl-word';
      [...word].forEach(ch => { const c = document.createElement('span'); c.className = 'hl-char'; c.textContent = ch; w.appendChild(c); chars.push(c); });
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    if (reducedMotion) { gsap.set(chars, { color: fill }); return; }
    gsap.to(chars, {
      color: fill, stagger: 0.5, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 60%', scrub: true }
    });
  });
}

const SUBSTACK_URL = 'https://substack.com/@arminshah';
function setupNewsletter() {
  const form = document.querySelector('[data-newsletter]');
  if (!form) return;
  const note = document.querySelector('[data-newsletter-note]');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = (form.email.value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.textContent = 'Please enter a valid email address.'; return; }
    // Afronden op Substack (met e-mail voorgevuld).
    note.textContent = 'Taking you to Substack…';
    window.open(SUBSTACK_URL + '?email=' + encodeURIComponent(email), '_blank', 'noopener');
    form.reset();
  });
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
  titleChars = splitTitle();
  gsap.set(titleChars, { yPercent: 115, opacity: 0 });
  buildServices();
  buildMarquee();
  buildCasesRing();
  buildDiensten();
  setupNewsletter();
  fitText();
  if (DEBUG) headEl.style.visibility = 'visible';

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.all(services.map(s => s.img.decode().catch(() => {}))).then(buildHitMaps);

  let ringResizeT, lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    fitText();
    resizeCanvas();
    buildHitMaps();
    // Alleen bij een breedte-wijziging (orientatie) de ring herbouwen en ScrollTrigger
    // verversen. Op mobiel verandert de hoogte constant (adresbalk) -> anders pin-sprongen.
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(ringResizeT);
    ringResizeT = setTimeout(() => { buildCasesRing(); }, 200);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  if (reducedMotion) {
    showEndState();
    setupHighlight();
    runPreloader(fontsReady.then(showHero));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });   // mobiele adresbalk niet als resize behandelen

  // Pauzeer de object-floats zodra de hero uit beeld is -> geen werk tijdens het lezen.
  const heroEl = document.querySelector('.hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      const vis = es[0].isIntersecting;
      services.forEach(s => { if (s.floatTween) s.floatTween.paused(!vis); });
    }, { threshold: 0 }).observe(heroEl);
  }

  // Dezelfde scroll-animatie op desktop én mobiel (sequence-scrub -> WebGL-curl -> objecten).
  // Op mobiel de helft van de frames: lichter in geheugen, nog steeds vloeiend.
  const step = isMobile() ? 2 : 1;
  const paths = buildPaths(step);
  const ready = preload(paths, p => { loaderFill.style.width = (p * 100) + '%'; })
    .then(imgs => {
      frames = imgs;
      resizeCanvas();
      drawFrame(0, true);
      loaderEl.classList.add('is-done');
      return fontsReady.then(() => { showHero(); setupScroll(); setupReveals(); setupWork(); setupHighlight(); ScrollTrigger.refresh(); });
    });
  runPreloader(ready);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
