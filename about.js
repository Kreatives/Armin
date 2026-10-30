/* About-pagina: reveals + scroll-highlight + horizontale carousels. */
(function () {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveals: fade + lichte y-translate zodra het element in beeld komt.
  function setupReveals() {
    if (reducedMotion) return;
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
  }

  // Scroll-highlight: tekst vult in van gedimd naar vol bij het scrollen.
  function setupHighlight() {
    document.querySelectorAll('[data-highlight]').forEach(el => {
      const fill = el.dataset.hlColor || '#F7F5F0';
      const text = el.textContent.trim();
      el.textContent = '';
      const chars = [];
      text.split(' ').forEach((word, wi, arr) => {
        const w = document.createElement('span'); w.className = 'hl-word';
        [...word].forEach(ch => {
          const c = document.createElement('span'); c.className = 'hl-char'; c.textContent = ch;
          w.appendChild(c); chars.push(c);
        });
        el.appendChild(w);
        if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
      });
      if (reducedMotion) { gsap.set(chars, { color: fill }); return; }
      gsap.to(chars, {
        color: fill, stagger: 0.5, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true }
      });
    });
  }

  // Hero (01): gepinde scroll-sequence. Groot ARMIN SHAH-wordmark + foto beginnen groot;
  // tijdens het scrollen krimpt de wordmark weg, reist de foto naar rechtsonder en komt de
  // statement + intro woord voor woord in beeld.
  function setupHero() {
    const hero = document.querySelector('[data-hero]');
    const word = document.querySelector('[data-hero-word] span');
    const title = document.querySelector('[data-hero-title]');
    const photo = document.querySelector('[data-hero-photo]');
    const reveals = document.querySelectorAll('.ab-hero__reveal');
    const inners = [];
    if (title) {
      const words = title.textContent.trim().split(' ');
      title.textContent = '';
      words.forEach((w, i) => {
        const mask = document.createElement('span'); mask.className = 'ab-hw';
        const inner = document.createElement('span'); inner.className = 'ab-hw__in'; inner.textContent = w;
        mask.appendChild(inner); title.appendChild(mask);
        if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
        inners.push(inner);
      });
    }
    if (reducedMotion || !hero) return;   // fallback: eindstaat zichtbaar, wordmark verborgen (CSS)
    hero.classList.add('is-seq');          // toon de wordmark-overlay
    // START-staat
    gsap.set(word, { opacity: 1, scale: 1, yPercent: 0 });
    gsap.set(inners, { yPercent: 115 });
    gsap.set(reveals, { opacity: 0, y: 24 });
    gsap.set(photo, { x: '-5vw', y: '-16vh', scale: 0.68 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=140%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    });
    tl.to(word,    { opacity: 0, scale: 0.72, yPercent: -14, ease: 'power1.in', duration: 0.42 }, 0)
      .to(photo,   { x: 0, y: 0, scale: 1, ease: 'none', duration: 1 }, 0)
      .to(inners,  { yPercent: 0, stagger: 0.04, ease: 'power3.out', duration: 0.5 }, 0.32)
      .to(reveals, { opacity: 1, y: 0, stagger: 0.09, ease: 'power2.out', duration: 0.5 }, 0.54);
    // Debug: ?seq=0.5 bevriest de sequence op die progress (voor verificatie-screenshots).
    const m = location.search.match(/[?&]seq=([\d.]+)/);
    if (m && tl.scrollTrigger) { tl.scrollTrigger.kill(); tl.pause().progress(parseFloat(m[1])); }
  }

  // What I do: titels komen woord voor woord van blur naar scherp bij het scrollen.
  function setupServices() {
    document.querySelectorAll('.ab-service').forEach((svc, i) => {
      const title = svc.querySelector('.ab-service__title');
      const desc = svc.querySelector('.ab-service__text');
      if (!title) return;
      const words = title.textContent.trim().split(' ');
      title.textContent = '';
      const spans = words.map((word, i) => {
        const s = document.createElement('span'); s.className = 'ab-word'; s.textContent = word;
        title.appendChild(s);
        if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
        return s;
      });
      if (reducedMotion) return;
      gsap.fromTo(spans,
        { opacity: 0.12, filter: 'blur(12px)', yPercent: 60 },
        { opacity: 1, filter: 'blur(0px)', yPercent: 0, ease: 'power2.out', stagger: 0.07,
          scrollTrigger: { trigger: svc, start: 'top 88%', end: 'top 42%', scrub: true } });
      if (desc) gsap.fromTo(desc,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: svc, start: 'top 78%', end: 'top 52%', scrub: true } });
      // Parallax: elk blok drift subtiel omhoog, afwisselend tempo.
      const drift = 34 + (i % 2) * 26;
      gsap.fromTo(svc,
        { y: drift },
        { y: -drift, ease: 'none',
          scrollTrigger: { trigger: svc, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // Wisselende achtergrondfoto: twee lagen die met GSAP smooth in/uit crossfaden.
  // Geeft een show(url)-functie terug; herhaalde calls met dezelfde url worden genegeerd.
  function makeBgSwitch(container) {
    if (!container) return function () {};
    const layers = container.querySelectorAll('[data-layer]');
    if (layers.length < 2) return function () {};
    let idx = 0, current = null;
    return function show(url) {
      if (!url || url === current) return;
      current = url;
      const next = layers[(idx + 1) % 2];
      const prev = layers[idx];
      next.style.backgroundImage = 'url("' + url + '")';
      if (reducedMotion) { next.style.opacity = 1; prev.style.opacity = 0; }
      else {
        gsap.to(next, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        gsap.to(prev, { opacity: 0, duration: 0.8, ease: 'power2.out' });
      }
      idx = (idx + 1) % 2;
    };
  }

  // Wisselende achtergrondvideo: twee <video>-lagen die met GSAP smooth in/uit crossfaden.
  // Geeft een show(url, poster)-functie terug; herhaalde calls met dezelfde url worden genegeerd.
  function makeVideoSwitch(container) {
    if (!container) return function () {};
    const layers = container.querySelectorAll('[data-vlayer]');
    if (layers.length < 2) return function () {};
    let idx = 0, current = null;
    return function show(url, poster) {
      if (!url || url === current) return;
      current = url;
      const next = layers[(idx + 1) % 2];
      const prev = layers[idx];
      if (poster) next.setAttribute('poster', poster);
      if (next.getAttribute('src') !== url) next.setAttribute('src', url);
      next.muted = true;
      const play = next.play();
      if (play && play.catch) play.catch(function () {});
      if (reducedMotion) { next.style.opacity = 1; prev.style.opacity = 0; }
      else {
        gsap.to(next, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        gsap.to(prev, { opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: function () { prev.pause(); } });
      }
      idx = (idx + 1) % 2;
    };
  }

  // What I do: de achtergrondvideo wisselt naar de dienst die in beeld komt (scroll-driven).
  function setupServiceBg() {
    const sec = document.querySelector('[data-services-sec]');
    if (!sec) return;
    const show = makeVideoSwitch(sec.querySelector('.ab-bgswitch'));
    const services = Array.prototype.slice.call(sec.querySelectorAll('.ab-service'));
    if (!services.length) return;
    show(services[0].getAttribute('data-video'), services[0].getAttribute('data-poster'));   // startvideo
    if (reducedMotion || !window.ScrollTrigger) return;
    services.forEach(function (svc) {
      ScrollTrigger.create({
        trigger: svc, start: 'top 65%', end: 'bottom 35%',
        onEnter: function () { show(svc.getAttribute('data-video'), svc.getAttribute('data-poster')); },
        onEnterBack: function () { show(svc.getAttribute('data-video'), svc.getAttribute('data-poster')); }
      });
    });
  }

  // Story: de meest linkse VOLLEDIG zichtbare kaart blijft scherp (niet de half afgesneden
  // kaart), de rest wordt geblurred. Het grote jaartal telt met GSAP omhoog naar het juiste jaar.
  function setupStoryFocus() {
    const vp = document.querySelector('[data-story-viewport]');
    if (!vp) return;
    const cards = Array.prototype.slice.call(vp.querySelectorAll('.ab-story__card'));
    if (!cards.length) return;
    const storyBg = makeBgSwitch(document.querySelector('[data-story-bg]'));
    if (cards[0]) storyBg(cards[0].getAttribute('data-bg'));   // startfoto
    if (reducedMotion) return;
    vp.classList.add('has-focus');
    const bigYear = document.querySelector('[data-story-bgyear]');
    const counter = { v: 0 };
    let current = null, raf = null, yearState = null;
    function update() {
      raf = null;
      // Eerste kaart waarvan de linkerrand op/na container-links ligt (niet afgesneden).
      const pad = cards[0].offsetLeft;          // bleed-padding = container-links (live)
      const tol = 10;
      let best = cards[cards.length - 1];
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].offsetLeft - vp.scrollLeft - pad >= -tol) { best = cards[i]; break; }
      }
      if (best === current) return;
      current = best;
      cards.forEach(function (c) { c.classList.toggle('is-focus', c === best); });
      storyBg(best.getAttribute('data-bg'));
      if (!bigYear) return;
      const label = best.getAttribute('data-big') || '';
      if (!/^\d{4}$/.test(label)) { bigYear.classList.remove('is-in'); return; }
      const target = parseInt(label, 10);
      const from = (yearState === null) ? target - 6 : yearState;
      yearState = target;
      bigYear.classList.add('is-in');
      counter.v = from;
      gsap.killTweensOf(counter);
      gsap.to(counter, { v: target, duration: 0.7, ease: 'power2.out',
        onUpdate: function () { bigYear.textContent = Math.round(counter.v); } });
    }
    const schedule = function () { if (!raf) raf = requestAnimationFrame(update); };
    vp.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', function () { current = null; schedule(); });  // her-meten na laden
    update();
  }

  // Hero: achtergrondfoto parallaxt subtiel omhoog bij het scrollen.
  function setupHeroParallax() {
    if (reducedMotion) return;
    const img = document.querySelector('.ab-hero__bg img');
    const hero = document.querySelector('.ab-hero');
    if (!img || !hero) return;
    gsap.fromTo(img, { yPercent: 0 }, { yPercent: -16, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
  }

  // Horizontale carousel: pijlen scrollen één item (+ gap) op en neer.
  function setupCarousel(viewportSel, itemSel, prevSel, nextSel) {
    const vp = document.querySelector(viewportSel);
    if (!vp) return;
    const track = vp.firstElementChild;
    const step = () => {
      const first = vp.querySelector(itemSel);
      const gap = track ? (parseFloat(getComputedStyle(track).columnGap) || 0) : 0;
      return first ? first.getBoundingClientRect().width + gap : vp.clientWidth * 0.8;
    };
    const prev = document.querySelector(prevSel);
    const next = document.querySelector(nextSel);
    const maxScroll = () => vp.scrollWidth - vp.clientWidth;
    // Dim de pijl aan begin/eind (en maak 'm niet-klikbaar daar).
    const setArrow = (btn, disabled) => {
      if (!btn) return;
      btn.style.opacity = disabled ? '0.3' : '1';
      btn.style.pointerEvents = disabled ? 'none' : 'auto';
      btn.style.transition = 'opacity 0.3s var(--ease-out)';
    };
    const updateArrows = () => {
      const x = vp.scrollLeft, max = maxScroll();
      setArrow(prev, x <= 2);
      setArrow(next, x >= max - 2);
    };
    if (prev) prev.addEventListener('click', () => vp.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => vp.scrollBy({ left: step(), behavior: 'smooth' }));
    vp.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 100);
  }

  // Video lightbox: Watch-knoppen en afspeelbare kaarten openen de YouTube-embed
  // in een overlay die autoplayt, in plaats van een nieuw tabblad te openen.
  function setupVideoLightbox() {
    const box = document.querySelector('[data-lightbox]');
    const frame = box && box.querySelector('[data-lightbox-frame]');
    if (!box || !frame) return;

    function open(id) {
      frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Video" ' +
        'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      box.hidden = false;
      requestAnimationFrame(() => box.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => { box.hidden = true; frame.innerHTML = ''; }, 300);
    }

    // Klik op een element met data-youtube (Watch-link of mediakaart) opent de player.
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-youtube]');
      if (!trigger) return;
      e.preventDefault();
      open(trigger.getAttribute('data-youtube'));
    });
    box.querySelectorAll('[data-lightbox-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) close(); });
  }

  // 3D ring-carousel (zelfde als de Cases-sectie op de homepage).
  function createRing(stage, cardEls, opts) {
    opts = opts || {};
    var N = cardEls.length;
    if (!N) return null;
    var angle = 360 / N;
    var radius = Math.round((opts.cardW / 2) / Math.tan(Math.PI / N) * (opts.spread || 1));
    var ring = document.createElement('div');
    ring.className = 'ring3d';
    cardEls.forEach(function (el, i) {
      el.classList.add('ring3d__card');
      // Inline (wint van .ab-feat__slide { position:relative } in about.css):
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = opts.cardW + 'px';
      if (opts.cardH) el.style.height = opts.cardH + 'px';
      el.style.transformOrigin = '50% 50% ' + radius + 'px';
      ring.appendChild(el);
    });
    stage.innerHTML = '';
    stage.appendChild(ring);

    var state = { rot: 0, vel: opts.introSpin || 0, target: null, last: NaN, hover: false, dragging: false, lastX: 0, moved: 0 };
    var auto = opts.autoSpin || 0;
    function render() {
      for (var i = 0; i < cardEls.length; i++)
        cardEls[i].style.transform = 'translate(-50%, -50%) rotateY(' + (i * angle + state.rot) + 'deg)';
    }
    render();
    function tick() {
      if (!state.dragging) {
        if (state.target !== null) {
          state.rot += (state.target - state.rot) * 0.12;
          if (Math.abs(state.target - state.rot) < 0.04) { state.rot = state.target; state.target = null; }
        } else {
          if (!state.hover) state.rot += auto;
          state.rot += state.vel; state.vel *= 0.92;
          if (Math.abs(state.vel) < 0.002) state.vel = 0;
        }
      }
      if (state.rot !== state.last) { render(); state.last = state.rot; }
      stage._raf = requestAnimationFrame(tick);
    }
    tick();
    var listeners = [];
    var on = function (t, ev, fn, o) { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); };
    var getX = function (e) { return e.touches ? e.touches[0].clientX : e.clientX; };
    on(stage, 'mousedown', function (e) { state.dragging = true; state.target = null; state.moved = 0; state.lastX = getX(e); state.vel = 0; stage.classList.add('is-grabbing'); });
    on(stage, 'touchstart', function (e) { state.dragging = true; state.target = null; state.moved = 0; state.lastX = getX(e); state.vel = 0; }, { passive: true });
    var move = function (e) { if (!state.dragging) return; var x = getX(e), dx = x - state.lastX, d = dx * 0.22; state.lastX = x; state.moved += Math.abs(dx); state.rot += d; state.vel = d; };
    on(window, 'mousemove', move);
    on(window, 'touchmove', move, { passive: true });
    var up = function () { if (!state.dragging) return; state.dragging = false; stage.classList.remove('is-grabbing'); };
    on(window, 'mouseup', up);
    on(window, 'touchend', up);
    on(stage, 'mouseenter', function () { state.hover = true; });
    on(stage, 'mouseleave', function () { state.hover = false; });
    on(stage, 'click', function (e) { if (state.moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    return {
      step: function (dir) { state.vel = 0; state.target = (state.target === null ? state.rot : state.target) + dir * angle; },
      destroy: function () { cancelAnimationFrame(stage._raf); listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); }
    };
  }

  var featRing = null;
  function buildFeatRing() {
    var vp = document.querySelector('[data-feat-viewport]');
    if (!vp) return;
    var slides = Array.prototype.slice.call(vp.querySelectorAll('.ab-feat__slide'));
    if (!slides.length) return;
    if (featRing) featRing.destroy();
    slides.forEach(function (s) {
      var v = s.querySelector('.ab-feat__video'); if (v) v.remove();  // iframes breken 3D-rotatie
      var img = s.querySelector('.ab-feat__bg'); if (img) img.loading = 'eager';  // ring = altijd "in beeld"
    });
    vp.className = 'ring-stage ab-feat__ring';                   // scroll-slider -> 3D-stage
    var w = vp.clientWidth || window.innerWidth;
    var cardW = Math.round(Math.max(380, Math.min(740, w * 0.5)));
    var cardH = Math.round(cardW * 0.56);
    featRing = createRing(vp, slides, { cardW: cardW, cardH: cardH, autoSpin: 0, introSpin: 0, spread: 1.08 });
    var prev = document.querySelector('[data-feat-prev]');
    var next = document.querySelector('[data-feat-next]');
    if (prev && !prev._wired) { prev._wired = 1; prev.addEventListener('click', function () { featRing && featRing.step(-1); }); }
    if (next && !next._wired) { next._wired = 1; next.addEventListener('click', function () { featRing && featRing.step(1); }); }
  }

  // Bouw de ring pas als de sectie in beeld komt (layout gegarandeerd settled) + herbouw bij resize.
  function setupFeatRing() {
    var vp = document.querySelector('[data-feat-viewport]');
    if (!vp) return;
    var built = false;
    var build = function () { built = true; buildFeatRing(); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); build(); }
      }, { rootMargin: '200px' });
      io.observe(vp);
    } else { build(); }
    var rt;
    window.addEventListener('resize', function () {
      if (!built) return;
      clearTimeout(rt);
      rt = setTimeout(buildFeatRing, 250);
    });
  }

  function init() {
    setupHeroParallax();
    setupHighlight();
    setupServices();
    setupReveals();
    setupFeatRing();
    setupCarousel('[data-story-viewport]', '.ab-story__card', '[data-story-prev]', '[data-story-next]');
    setupStoryFocus();
    setupServiceBg();
    setupVideoLightbox();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
