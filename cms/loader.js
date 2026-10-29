/* =========================================================
   Runtime-loader — haalt teksten + cases uit Supabase en past ze toe,
   en start daarna pas het hoofd-script van de pagina.

   Afhankelijkheden (als klassieke scripts hiervoor geladen):
     cms/config.js  -> window.CMS_CONFIG
     cms/shared.js  -> window.CMS.applyField
     cms/manifest.js-> window.CMS_MANIFEST
     cases.js       -> window.CASES  (baseline incl. media)
   ========================================================= */
const cfg = window.CMS_CONFIG;

// --- Welke pagina draaien we? -----------------------------------------
const path = location.pathname;
const PAGE = path.endsWith('about.html') ? 'about'
           : path.endsWith('case.html')  ? 'case'
           : 'home';

// --- Data ophalen met time-out (site breekt nooit op trage/offline DB) --
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), ms)),
  ]);
}

async function fetchData() {
  // Supabase-client pas hier laden, zodat een geblokkeerde CDN de site niet breekt.
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const sb = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } });
  const [texts, cases, media, caseMedia] = await Promise.all([
    sb.from(cfg.tables.texts).select('key,value'),
    sb.from(cfg.tables.cases).select('*').eq('published', true).order('sort_order', { ascending: true }),
    sb.from(cfg.tables.media).select('key,url'),
    sb.from(cfg.tables.caseMedia).select('slug,url,kind,portrait,sort_order').order('sort_order', { ascending: true }),
  ]);
  return { texts: texts.data || [], cases: cases.data || [], media: media.data || [], caseMedia: caseMedia.data || [] };
}

// --- Media-overrides toepassen (foto's die in de pagina zitten) --------
function applyMedia(rows) {
  if (!rows.length || !window.CMS_MEDIA) return;
  const map = {};
  rows.forEach((r) => { if (r.url) map[r.key] = r.url; });
  (window.CMS_MEDIA.allItems || []).forEach((it) => {
    if (!(it.key in map)) return;
    try {
      const el = document.querySelector(it.selector);
      if (!el) return;
      if (it.attr === 'src') el.src = map[it.key];
      else el.setAttribute(it.attr, map[it.key]);
    } catch (_) { /* negeren */ }
  });
}

// --- Teksten toepassen -------------------------------------------------
function applyTexts(rows) {
  const map = {};
  rows.forEach((r) => { if (r.value != null && String(r.value).trim() !== '') map[r.key] = r.value; });
  window.CMS_TEXT = map; // case.html leest hier de gedeelde case-teksten uit

  (window.CMS_MANIFEST.allFields || []).forEach((fld) => {
    if (fld.mode === 'virtual' || !fld.selector) return;       // door JS gegenereerd
    const hasText = fld.key in map;
    const hrefKey = fld.key + '@href';
    const hasHref = fld.href && (hrefKey in map);
    if (!hasText && !hasHref) return;                          // geen override -> origineel blijft
    try {
      const el = document.querySelector(fld.selector);
      if (!el) return;
      if (hasText) window.CMS.applyField(el, map[fld.key], fld.mode);
      if (hasHref) el.setAttribute('href', map[hrefKey]);
    } catch (_) { /* ongeldige selector: negeren, origineel blijft staan */ }
  });
}

// --- Cases samenvoegen met de baseline-media (per slug) ----------------
function mergeCases(dbCases, caseMediaRows) {
  if (!dbCases.length) return;                 // niets in DB (of time-out): baseline blijft
  const baseline = {};
  (window.CASES || []).forEach((c) => { baseline[c.slug] = c; });
  const FALLBACK_COVER = { src: 'assets/video/showreel.mp4', portrait: false };
  const FALLBACK_POSTER = 'assets/video/showreel-poster.webp';

  // CMS-media per slug (indien aanwezig overschrijft dit de schijf-media).
  const cmBySlug = {};
  (caseMediaRows || []).forEach((m) => { (cmBySlug[m.slug] = cmBySlug[m.slug] || []).push(m); });

  const merged = dbCases.map((c) => {
    const base = baseline[c.slug] || {};
    const cm = cmBySlug[c.slug];
    let cover, thumb, media;
    if (cm && cm.length) {
      const items = cm.map((m) => ({ src: m.url, portrait: !!m.portrait, kind: m.kind }));
      cover = items[0];
      media = items.slice(1);
      const firstImg = items.find((it) => it.kind !== 'video');
      thumb = firstImg ? firstImg.src : (base.thumb || FALLBACK_POSTER);
    } else {
      cover = base.cover || FALLBACK_COVER;
      thumb = base.thumb || FALLBACK_POSTER;
      media = base.media || [];
    }
    return {
      slug: c.slug,
      brand: c.brand || base.brand || c.title || '',
      title: c.title || base.title || '',
      sub: c.sub || base.sub || '',
      tags: Array.isArray(c.tags) ? c.tags : (base.tags || []),
      client: c.client || base.client || '',
      date: c.date || base.date || '',
      role: c.role || base.role || '',
      services: c.services || base.services || '',
      summary: c.summary || base.summary || '',
      // Rijkere per-case velden (brief)
      intro: c.intro || '',
      body: c.body || '',
      publisher: c.publisher || '',
      agency_partner: c.agency_partner || '',
      project_type: c.project_type || '',
      service_category: Array.isArray(c.service_category) ? c.service_category : [],
      services_list: Array.isArray(c.services_list) ? c.services_list : [],
      highlighted: c.highlighted !== false,
      in_popup: c.in_popup !== false,
      // media: CMS-media indien aanwezig, anders de baseline op schijf
      cover: cover,
      thumb: thumb,
      logo: c.logo || base.logo || null,
      media: media,
    };
  });

  // Homepage toont de highlighted cases; case-detail gebruikt alle gepubliceerde.
  window.CASES = PAGE === 'home' ? merged.filter((c) => c.highlighted) : merged;
}

// --- Hoofd-script van de pagina starten --------------------------------
function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = resolve;
    document.body.appendChild(s);
  });
}

async function startPage() {
  if (PAGE === 'about') return loadScript('about.js?v=5');
  if (PAGE === 'case')  return typeof window.renderCase === 'function' ? window.renderCase() : null;
  return loadScript('script.js'); // home
}

// --- Orkestratie -------------------------------------------------------
(async function () {
  try {
    const res = await withTimeout(fetchData(), cfg.fetchTimeoutMs);
    if (res && !res.__timeout) {
      applyTexts(res.texts);
      applyMedia(res.media);
      mergeCases(res.cases, res.caseMedia);
    } else {
      window.CMS_TEXT = window.CMS_TEXT || {};
    }
  } catch (e) {
    window.CMS_TEXT = window.CMS_TEXT || {};
    console.warn('[CMS] data ophalen mislukt, originele teksten blijven staan.', e);
  }
  await startPage();
})();
