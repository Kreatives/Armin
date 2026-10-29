/* =========================================================
   Content editor — Supabase Auth + tekst-editor + media + cases.
   ========================================================= */
const cfg = window.CMS_CONFIG;
const TEXTS = cfg.tables.texts;
const CASES = cfg.tables.cases;
const MEDIA = cfg.tables.media;
const CASE_MEDIA = cfg.tables.caseMedia;
const BUCKET = cfg.bucket;
const M = window.CMS_MANIFEST;
const MEDIA_M = window.CMS_MEDIA;
let sb = null;

const $ = (sel) => document.querySelector(sel);
const loginBox = $('#login');
const appBox = $('#app');
const navEl = $('#nav');
const headEl = $('#main-head');
const panel = $('#panel');

const docCache = {};
let overrides = {};        // site_texts
let mediaOverrides = {};   // site_media
let activeTab = null;      // page id of 'cases'
const pending = new Map(); // niet-opgeslagen tekst-wijzigingen
let saveBar = null;

// ---------------------------------------------------------------------
//  Fouten altijd zichtbaar
// ---------------------------------------------------------------------
function fatal(msg) {
  if (loginBox) loginBox.hidden = false;
  if (appBox) appBox.hidden = true;
  const err = $('#login-error');
  if (err) err.textContent = msg;
  console.error('[admin]', msg);
}
window.addEventListener('error', (e) => fatal('Scriptfout: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => fatal('Fout: ' + (e.reason?.message || e.reason)));

(async function start() {
  try {
    const mod = await import('https://esm.sh/@supabase/supabase-js@2');
    sb = mod.createClient(cfg.url, cfg.anonKey);
  } catch (e) {
    fatal('Kon Supabase niet laden (internet/esm.sh geblokkeerd?): ' + (e?.message || e));
    return;
  }
  boot();
})();

// ---------------------------------------------------------------------
//  Auth
// ---------------------------------------------------------------------
let appStarted = false;

async function boot() {
  sb.auth.onAuthStateChange((_e, session) => {
    if (session) { revealApp(session.user); setTimeout(initApp, 0); }
    else { appStarted = false; showLogin(); }
  });
  const { data } = await sb.auth.getSession();
  if (!data.session) showLogin();
}

function showLogin() {
  appBox.hidden = true;
  loginBox.hidden = false;
  pending.clear();
  if (saveBar) saveBar.hidden = true;
}
function revealApp(user) {
  loginBox.hidden = true;
  appBox.hidden = false;
  $('#user-email').textContent = user?.email || '';
}
async function initApp() {
  if (appStarted) return;
  appStarted = true;
  try {
    await loadData();
    buildNav();
    selectTab(activeTab || M.pages[0].id);
  } catch (e) {
    appStarted = false;
    panel.innerHTML = `<div class="note">Kon de editor niet laden: ${e.message}</div>`;
  }
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#login-btn'), err = $('#login-error');
  err.textContent = '';
  if (!sb) { err.textContent = 'Nog bezig met laden, probeer het zo opnieuw.'; return; }
  btn.disabled = true; btn.textContent = 'Bezig…';
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('#login-email').value.trim(),
    password: $('#login-pass').value,
  });
  btn.disabled = false; btn.textContent = 'Inloggen';
  if (error) {
    err.textContent = /email not confirmed/i.test(error.message || '')
      ? 'Dit account is nog niet bevestigd. Maak de user aan met "Auto Confirm User" aan.'
      : 'Inloggen mislukt: ' + (error.message || 'onbekende fout');
    return;
  }
  if (data?.user) { revealApp(data.user); setTimeout(initApp, 0); }
});

$('#logout-btn').addEventListener('click', () => sb.auth.signOut());

// ---------------------------------------------------------------------
//  Data
// ---------------------------------------------------------------------
async function loadData() {
  const [t, md] = await Promise.all([
    sb.from(TEXTS).select('key,value'),
    sb.from(MEDIA).select('key,url'),
  ]);
  overrides = {};
  (t.data || []).forEach((r) => { overrides[r.key] = r.value; });
  mediaOverrides = {};
  (md.data || []).forEach((r) => { mediaOverrides[r.key] = r.url; });
}

async function getDoc(file) {
  if (docCache[file]) return docCache[file];
  const res = await fetch('../' + file, { cache: 'no-store' });
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  docCache[file] = doc;
  return doc;
}
async function baselineFor(field, file) {
  if (field.mode === 'virtual') return { text: field.default || '', found: true };
  const doc = await getDoc(file);
  let el = null;
  try { el = doc.querySelector(field.selector); } catch (_) {}
  if (!el) return { text: '', found: false };
  return { text: window.CMS.readField(el, field.mode), found: true };
}
async function hrefBaselineFor(field, file) {
  if (!field.href || !field.selector) return '';
  const doc = await getDoc(file);
  let el = null;
  try { el = doc.querySelector(field.selector); } catch (_) {}
  return el ? (el.getAttribute('href') || '') : '';
}

async function mediaBaseline(item, file) {
  const doc = await getDoc(file);
  let el = null;
  try { el = doc.querySelector(item.selector); } catch (_) {}
  if (!el) return null;
  return item.attr === 'src' ? (el.getAttribute('src') || '') : (el.getAttribute(item.attr) || '');
}

// Toon een pad correct in de editor (relatief pad -> één map omhoog).
const displaySrc = (v) => (!v ? '' : (/^https?:\/\//.test(v) || v.startsWith('data:')) ? v : '../' + v.replace(/^\.?\//, ''));

// ---------------------------------------------------------------------
//  Navigatie (sidebar)
// ---------------------------------------------------------------------
const ICONS = {
  page: '<svg class="nav__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>',
  grid: '<svg class="nav__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
};
function buildNav() {
  navEl.innerHTML = '';
  const g1 = document.createElement('div');
  g1.className = 'nav__group';
  g1.innerHTML = '<div class="nav__title">Pagina’s</div>';
  M.pages.forEach((p) => g1.appendChild(navItem(p.id, p.label, ICONS.page)));
  const g2 = document.createElement('div');
  g2.className = 'nav__group';
  g2.innerHTML = '<div class="nav__title">Content</div>';
  g2.appendChild(navItem('cases', 'Cases', ICONS.grid));
  g2.appendChild(navItem('popup', 'Cases-popup', ICONS.grid));
  navEl.append(g1, g2);
}
function navItem(id, label, ico) {
  const b = document.createElement('button');
  b.className = 'nav__item';
  b.dataset.id = id;
  b.innerHTML = ico + '<span>' + label + '</span>';
  b.addEventListener('click', () => selectTab(id));
  return b;
}
function highlightNav() {
  [...navEl.querySelectorAll('.nav__item')].forEach((b) => b.classList.toggle('is-active', b.dataset.id === activeTab));
}

function pageById(id) { return M.pages.find((p) => p.id === id); }

function previewUrl(id) {
  if (id === 'about') return '../about.html';
  if (id === 'case') return '../case.html';
  if (id === 'footer') return '../index.html#contact';
  return '../index.html';
}

function selectTab(id) {
  if (pending.size && !confirm('Je hebt niet-opgeslagen wijzigingen. Weggooien?')) return;
  pending.clear(); updateSaveBar();
  activeTab = id;
  highlightNav();
  renderHeader();
  renderBody();
}

function renderHeader() {
  headEl.innerHTML = '';
  const title = document.createElement('h1');
  title.className = 'head__title';
  const right = document.createElement('div');
  right.className = 'head__right';

  if (activeTab === 'cases') {
    title.textContent = 'Cases';
    const add = document.createElement('button');
    add.className = 'btn btn--primary btn--sm';
    add.textContent = '+ Nieuwe case';
    add.addEventListener('click', addCase);
    right.appendChild(add);
  } else if (activeTab === 'popup') {
    title.textContent = 'Cases-popup';
  } else {
    const page = pageById(activeTab);
    title.textContent = page.label;
    const prev = document.createElement('a');
    prev.className = 'btn btn--ghost btn--sm';
    prev.href = previewUrl(activeTab);
    prev.target = '_blank';
    prev.rel = 'noopener';
    prev.textContent = 'Bekijk pagina ↗';
    right.appendChild(prev);
  }
  headEl.append(title, right);
}

function renderBody() {
  if (activeTab === 'cases') return renderCases();
  if (activeTab === 'popup') return renderPopup();
  return renderTextPage(pageById(activeTab));
}

// ---------------------------------------------------------------------
//  Tekst-editor (met compacte groepen + inline media)
// ---------------------------------------------------------------------
async function renderTextPage(page) {
  panel.innerHTML = '<div class="loading">Teksten laden…</div>';
  const mediaItems = (MEDIA_M && MEDIA_M.pages[page.id]) ? MEDIA_M.pages[page.id].items : [];
  const frag = document.createDocumentFragment();
  if (page.note) {
    const n = document.createElement('div');
    n.className = 'note'; n.textContent = page.note;
    frag.appendChild(n);
  }
  for (const section of page.sections) {
    const sec = document.createElement('section');
    sec.className = 'section';
    const h = document.createElement('h2');
    h.className = 'section__title'; h.textContent = section.label;
    sec.appendChild(h);

    // Velden: opeenvolgende velden met dezelfde `group` -> één compacte kaart.
    const fields = section.fields;
    let i = 0;
    while (i < fields.length) {
      if (fields[i].group) {
        const g = fields[i].group, groupFields = [];
        while (i < fields.length && fields[i].group === g) { groupFields.push(fields[i]); i++; }
        sec.appendChild(await makeGroupCard(groupFields, page.file));
      } else {
        sec.appendChild(await makeRow(fields[i], page.file)); i++;
      }
    }

    // Inline media die bij deze sectie hoort.
    const secMedia = mediaItems.filter((m) => m.section === section.label);
    if (secMedia.length) {
      const mg = document.createElement('div');
      mg.className = 'media-grid media-grid--inline';
      for (const it of secMedia) mg.appendChild(await mediaCard(it, page.file));
      sec.appendChild(mg);
    }
    frag.appendChild(sec);
  }
  panel.innerHTML = '';
  panel.appendChild(frag);
}

// Bouwt het bewerk-widget (tekstveld + teller + status + herstel) en koppelt
// de wijzig-status aan de opslaan-balk. Hergebruikt door losse rijen én groepen.
function makeEditor(field, baseline, found) {
  const max = field.max || Math.max(baseline.length, 0);
  const value = (overrides[field.key] != null && overrides[field.key] !== '') ? overrides[field.key] : baseline;

  const wrap = document.createElement('div');
  wrap.className = 'editor';
  const area = document.createElement('textarea');
  area.className = 'field__area';
  area.rows = Math.min(7, Math.max(1, Math.ceil((value.length || 1) / 52)));
  area.value = value;
  if (!found) area.disabled = true;
  else if (max > 0) area.maxLength = max;

  const count = document.createElement('span');
  count.className = 'row__count';
  const foot = document.createElement('div');
  foot.className = 'row__foot';
  const status = document.createElement('span');
  status.className = 'row__status';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--ghost btn--sm';
  resetBtn.textContent = 'Herstel';
  foot.append(status, resetBtn);
  wrap.append(area, count, foot);

  const updateCount = () => {
    const len = area.value.length;
    count.textContent = found ? `${len} / ${max} tekens` : 'veld niet gevonden';
    count.classList.toggle('is-full', found && max > 0 && len >= max);
  };
  const savedValue = () => { const ov = overrides[field.key]; return (ov != null && ov !== '') ? ov : baseline; };
  const refreshState = () => {
    updateCount();
    if (found && area.value !== savedValue()) {
      pending.set(field.key, { value: area.value, baseline });
      status.textContent = 'Niet opgeslagen'; status.className = 'row__status is-dirty';
      wrap.classList.add('is-dirty');
    } else {
      pending.delete(field.key);
      status.textContent = ''; status.className = 'row__status';
      wrap.classList.remove('is-dirty');
    }
    updateSaveBar();
  };
  updateCount();
  area.addEventListener('input', refreshState);
  resetBtn.addEventListener('click', () => { area.value = baseline; refreshState(); });
  return { wrap, area };
}

// Extra invoer voor de URL (href) van een link-veld, gekoppeld aan de opslaan-balk.
function makeHrefEditor(field, hrefBaseline) {
  const hkey = field.key + '@href';
  const wrap = document.createElement('div');
  wrap.className = 'href-edit';
  const lab = document.createElement('div');
  lab.className = 'mini__label'; lab.textContent = 'Link (URL)';
  const input = document.createElement('input');
  input.className = 'field__input'; input.type = 'text'; input.placeholder = 'https://…';
  const saved = (overrides[hkey] != null && overrides[hkey] !== '') ? overrides[hkey] : hrefBaseline;
  input.value = saved || '';
  const savedVal = () => { const ov = overrides[hkey]; return (ov != null && ov !== '') ? ov : (hrefBaseline || ''); };
  input.addEventListener('input', () => {
    if (input.value !== savedVal()) pending.set(hkey, { value: input.value, baseline: hrefBaseline || '' });
    else pending.delete(hkey);
    updateSaveBar();
  });
  wrap.append(lab, input);
  return wrap;
}

// Losse rij: label + "Nu" links, invoer rechts (voor lange, op zichzelf staande teksten).
async function makeRow(field, file) {
  const { text: baseline, found } = await baselineFor(field, file);
  const row = document.createElement('div');
  row.className = 'row' + (found ? '' : ' row--missing');
  const side = document.createElement('div');
  side.className = 'row__side';
  const label = document.createElement('div');
  label.className = 'row__label'; label.textContent = field.label;
  const cur = document.createElement('p');
  cur.className = 'row__current';
  cur.innerHTML = '<b>Nu</b>';
  cur.appendChild(document.createTextNode(baseline || '—'));
  side.append(label, cur);
  const { wrap } = makeEditor(field, baseline, found);
  const main = document.createElement('div');
  main.className = 'row__main';
  main.appendChild(wrap);
  if (field.href) main.appendChild(makeHrefEditor(field, await hrefBaselineFor(field, file)));
  row.append(side, main);
  return row;
}

// Compacte groepskaart: kop + korte velden naast elkaar.
async function makeGroupCard(fields, file) {
  const card = document.createElement('div');
  card.className = 'group';
  const title = document.createElement('div');
  title.className = 'group__title'; title.textContent = fields[0].groupLabel || '';
  const grid = document.createElement('div');
  grid.className = 'group__fields';
  card.append(title, grid);
  for (const field of fields) {
    const { text: baseline, found } = await baselineFor(field, file);
    const mini = document.createElement('div');
    mini.className = 'mini' + (field.wide ? ' mini--wide' : '') + (found ? '' : ' mini--missing');
    const lab = document.createElement('div');
    lab.className = 'mini__label'; lab.textContent = field.label;
    const { wrap } = makeEditor(field, baseline, found);
    mini.append(lab, wrap);
    if (field.href) mini.appendChild(makeHrefEditor(field, await hrefBaselineFor(field, file)));
    grid.appendChild(mini);
  }
  return card;
}

// ---- Onderbalk (alleen teksten) ----
function ensureSaveBar() {
  if (saveBar) return saveBar;
  saveBar = document.createElement('div');
  saveBar.className = 'savebar'; saveBar.hidden = true;
  saveBar.innerHTML =
    '<span class="savebar__info" data-info></span>' +
    '<div class="savebar__actions">' +
      '<button class="btn btn--ghost" data-discard type="button">Ongedaan maken</button>' +
      '<button class="btn btn--primary" data-save type="button">Wijzigingen opslaan</button>' +
    '</div>';
  document.body.appendChild(saveBar);
  saveBar.querySelector('[data-save]').addEventListener('click', saveAll);
  saveBar.querySelector('[data-discard]').addEventListener('click', discardAll);
  return saveBar;
}
function updateSaveBar() {
  const bar = ensureSaveBar();
  const n = pending.size;
  bar.hidden = n === 0;
  if (n) bar.querySelector('[data-info]').textContent =
    n === 1 ? '1 niet-opgeslagen wijziging' : `${n} niet-opgeslagen wijzigingen`;
}
function discardAll() {
  pending.clear(); updateSaveBar();
  if (activeTab !== 'cases') renderTextPage(pageById(activeTab));
}
async function saveAll() {
  const items = [...pending.entries()];
  if (!items.length) return;
  const btn = ensureSaveBar().querySelector('[data-save]');
  btn.disabled = true; btn.textContent = 'Opslaan…';
  const toUpsert = [], toDelete = [];
  items.forEach(([key, { value, baseline }]) => {
    if (value === baseline || value.trim() === '') toDelete.push(key);
    else toUpsert.push({ key, value });
  });
  try {
    if (toUpsert.length) { const { error } = await sb.from(TEXTS).upsert(toUpsert, { onConflict: 'key' }); if (error) throw error; }
    if (toDelete.length) { const { error } = await sb.from(TEXTS).delete().in('key', toDelete); if (error) throw error; }
    toUpsert.forEach(({ key, value }) => { overrides[key] = value; });
    toDelete.forEach((key) => { delete overrides[key]; });
    pending.clear();
    toast('Wijzigingen opgeslagen ✓');
    renderTextPage(pageById(activeTab));
  } catch (e) {
    toast('Opslaan mislukt: ' + e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Wijzigingen opslaan';
    updateSaveBar();
  }
}

// ---------------------------------------------------------------------
//  Media
// ---------------------------------------------------------------------
async function mediaCard(item, file) {
  const baseline = await mediaBaseline(item, file);
  const override = mediaOverrides[item.key];
  const shown = override || baseline;

  const card = document.createElement('div');
  card.className = 'mediacard';

  const thumb = document.createElement('div');
  thumb.className = 'mediacard__thumb';
  const img = document.createElement('img');
  img.alt = ''; img.loading = 'lazy';
  img.src = displaySrc(shown);
  img.onerror = () => { thumb.textContent = 'Geen voorbeeld'; };
  thumb.appendChild(img);

  const body = document.createElement('div');
  body.className = 'mediacard__body';
  const label = document.createElement('div');
  label.className = 'mediacard__label'; label.textContent = item.label;
  const status = document.createElement('div');
  status.className = 'mediacard__status';
  if (override) status.textContent = 'Aangepast';

  const actions = document.createElement('div');
  actions.className = 'mediacard__actions';
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.hidden = true;
  const replaceBtn = document.createElement('button');
  replaceBtn.className = 'btn btn--primary btn--sm';
  replaceBtn.textContent = 'Vervang foto';
  replaceBtn.addEventListener('click', () => fileInput.click());
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--ghost btn--sm';
  resetBtn.textContent = 'Herstel';
  resetBtn.hidden = !override;

  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (f) uploadMedia(item, f, { img, status, resetBtn, replaceBtn });
    fileInput.value = '';
  });
  resetBtn.addEventListener('click', () => resetMedia(item, baseline, { img, status, resetBtn }));

  actions.append(replaceBtn, resetBtn, fileInput);
  body.append(label, status, actions);
  card.append(thumb, body);
  return card;
}

async function uploadMedia(item, file, els) {
  els.status.className = 'mediacard__status'; els.status.textContent = 'Uploaden…';
  els.replaceBtn.disabled = true;
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = item.key.replace(/[^a-z0-9]+/gi, '-') + '-' + Date.now() + '.' + ext;
    const up = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type || undefined });
    if (up.error) throw up.error;
    const url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const { error } = await sb.from(MEDIA).upsert({ key: item.key, url }, { onConflict: 'key' });
    if (error) throw error;
    mediaOverrides[item.key] = url;
    els.img.src = url;
    els.status.textContent = 'Vervangen ✓'; els.status.classList.add('is-ok');
    els.resetBtn.hidden = false;
    toast('Foto vervangen ✓');
  } catch (e) {
    els.status.textContent = 'Upload mislukt'; els.status.classList.add('is-error');
    toast('Upload mislukt: ' + e.message, true);
  } finally {
    els.replaceBtn.disabled = false;
  }
}

async function resetMedia(item, baseline, els) {
  els.status.className = 'mediacard__status'; els.status.textContent = 'Herstellen…';
  try {
    const { error } = await sb.from(MEDIA).delete().eq('key', item.key);
    if (error) throw error;
    delete mediaOverrides[item.key];
    els.img.src = displaySrc(baseline);
    els.status.textContent = ''; els.resetBtn.hidden = true;
    toast('Oorspronkelijke foto hersteld');
  } catch (e) {
    els.status.textContent = 'Herstellen mislukt'; els.status.classList.add('is-error');
    toast('Herstellen mislukt: ' + e.message, true);
  }
}

// ---------------------------------------------------------------------
//  Cases
// ---------------------------------------------------------------------
const SERVICE_CATS = ['Creative Strategy', 'Format & IP', 'Football & Culture', 'Creative Direction', 'Partnerships'];
const CASE_TEXT_FIELDS = [
  { k: 'title', label: 'Naam' },
  { k: 'sub', label: 'Subtitel (homepage-kaart)' },
  { k: 'client', label: 'Client' },
  { k: 'publisher', label: 'Publisher' },
  { k: 'agency_partner', label: 'Agency partner' },
  { k: 'project_type', label: 'Project type' },
  { k: 'role', label: 'Rol' },
  { k: 'intro', label: 'Intro', area: true, full: true },
  { k: 'body', label: 'Tekst (extra alinea’s, optioneel)', area: true, full: true },
];
let casesData = [];

async function renderCases() {
  panel.innerHTML = '<div class="loading">Cases laden…</div>';
  const { data, error } = await sb.from(CASES).select('*').order('sort_order', { ascending: true });
  if (error) { panel.innerHTML = `<div class="note">Kon cases niet laden: ${error.message}</div>`; return; }
  casesData = data || [];
  panel.innerHTML = '';
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = 'Logo kun je hier uploaden. Foto’s/video’s staan nog in assets/cases/<slug>/ (per-case uploaden volgt). "Soort dienst" bepaalt onder welke groep de case in de cases-popup valt.';
  panel.appendChild(note);
  casesData.forEach((c, i) => panel.appendChild(caseCard(c, i)));
}

function caseCard(c, index) {
  const card = document.createElement('div');
  card.className = 'case';
  const bar = document.createElement('div');
  bar.className = 'case__bar';
  const title = document.createElement('span');
  title.className = 'case__title'; title.textContent = c.title || c.slug;
  const slug = document.createElement('span');
  slug.className = 'case__slug'; slug.textContent = c.slug;
  const flags = document.createElement('span');
  flags.className = 'case__flags';
  const renderFlags = (o) => { flags.innerHTML =
    `<span class="flag ${o.highlighted ? 'on' : ''}">home</span>` +
    `<span class="flag ${o.in_popup ? 'on' : ''}">popup</span>` +
    `<span class="flag ${o.published ? 'on' : ''}">live</span>`; };
  renderFlags(c);
  const up = document.createElement('button');
  up.className = 'btn btn--ghost btn--sm'; up.textContent = '↑';
  up.addEventListener('click', (e) => { e.stopPropagation(); move(index, -1); });
  const down = document.createElement('button');
  down.className = 'btn btn--ghost btn--sm'; down.textContent = '↓';
  down.addEventListener('click', (e) => { e.stopPropagation(); move(index, 1); });
  bar.append(title, slug, flags, up, down);
  bar.addEventListener('click', () => card.classList.toggle('is-open'));

  const body = document.createElement('div');
  body.className = 'case__body';
  const inputs = {};
  CASE_TEXT_FIELDS.forEach((f) => {
    const wrap = document.createElement('label');
    wrap.className = 'field' + (f.full ? ' field--full' : '');
    const lab = document.createElement('span');
    lab.className = 'field__label'; lab.textContent = f.label;
    let input;
    if (f.area) { input = document.createElement('textarea'); input.className = 'field__area'; input.rows = f.k === 'intro' ? 4 : 3; }
    else { input = document.createElement('input'); input.className = 'field__input'; input.type = 'text'; }
    input.value = c[f.k] || '';
    inputs[f.k] = input;
    wrap.append(lab, input);
    body.appendChild(wrap);
  });

  // Logo-upload
  const logoWrap = document.createElement('div');
  logoWrap.className = 'field field--full';
  logoWrap.innerHTML = '<span class="field__label">Logo</span>';
  const logoRow = document.createElement('div');
  logoRow.className = 'logo-row';
  const logoThumb = document.createElement('div');
  logoThumb.className = 'logo-thumb';
  const logoImg = document.createElement('img');
  const diskLogo = diskLogoFor(c.slug);
  const effLogo = c.logo || diskLogo;
  if (effLogo) logoImg.src = displaySrc(effLogo); else logoThumb.classList.add('is-empty');
  logoThumb.appendChild(logoImg);
  const logoInput = document.createElement('input');
  logoInput.type = 'file'; logoInput.accept = 'image/*'; logoInput.hidden = true;
  const logoBtn = document.createElement('button');
  logoBtn.className = 'btn btn--sm'; logoBtn.type = 'button'; logoBtn.textContent = effLogo ? 'Vervang logo' : 'Upload logo';
  logoBtn.addEventListener('click', () => logoInput.click());
  const logoReset = document.createElement('button');
  logoReset.className = 'btn btn--ghost btn--sm'; logoReset.type = 'button'; logoReset.textContent = 'Herstel'; logoReset.hidden = !c.logo;
  logoReset.addEventListener('click', async () => {
    const { error } = await sb.from(CASES).update({ logo: null }).eq('id', c.id);
    if (error) { toast('Herstellen mislukt: ' + error.message, true); return; }
    c.logo = null;
    const dl = diskLogoFor(c.slug);
    if (dl) { logoImg.src = displaySrc(dl); logoThumb.classList.remove('is-empty'); }
    else { logoImg.removeAttribute('src'); logoThumb.classList.add('is-empty'); }
    logoBtn.textContent = dl ? 'Vervang logo' : 'Upload logo';
    logoReset.hidden = true;
    toast('Logo hersteld');
  });
  logoInput.addEventListener('change', () => {
    const file = logoInput.files[0];
    if (file) uploadCaseLogo(c, file, { logoImg, logoThumb, logoBtn, logoReset });
    logoInput.value = '';
  });
  logoRow.append(logoThumb, logoBtn, logoReset, logoInput);
  logoWrap.appendChild(logoRow);
  body.appendChild(logoWrap);

  // Media (foto's/video's) per case
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'field field--full';
  mediaWrap.innerHTML = '<span class="field__label">Media (foto’s / video’s)</span>';
  const mediaMount = document.createElement('div');
  mediaWrap.appendChild(mediaMount);
  body.appendChild(mediaWrap);
  renderCaseMediaSection(c.slug, mediaMount);

  // Soort dienst (multiselect uit vaste lijst)
  const catWrap = document.createElement('div');
  catWrap.className = 'field field--full';
  catWrap.innerHTML = '<span class="field__label">Soort dienst (voor de cases-popup)</span>';
  const catBox = document.createElement('div');
  catBox.className = 'catbox';
  const catInputs = {};
  SERVICE_CATS.forEach((cat) => {
    const l = document.createElement('label');
    l.className = 'chip-check';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = (c.service_category || []).includes(cat);
    catInputs[cat] = cb;
    const sp = document.createElement('span'); sp.textContent = cat;
    l.append(cb, sp); catBox.appendChild(l);
  });
  catWrap.appendChild(catBox);
  body.appendChild(catWrap);

  // Services (meerdere vrije tags)
  const svcWrap = document.createElement('div');
  svcWrap.className = 'field field--full';
  svcWrap.innerHTML = '<span class="field__label">Services (meerdere — Enter of komma om toe te voegen)</span>';
  const tags = makeTagEditor(c.services_list || []);
  svcWrap.appendChild(tags.el);
  body.appendChild(svcWrap);

  // Acties
  const actions = document.createElement('div');
  actions.className = 'case__actions';
  const toggles = document.createElement('div');
  toggles.className = 'case__toggles';
  const hl = toggle('Op homepage', c.highlighted);
  const pop = toggle('In popup', c.in_popup);
  const pub = toggle('Live op site', c.published);
  toggles.append(hl.el, pop.el, pub.el);
  const save = document.createElement('button');
  save.className = 'btn btn--primary btn--sm'; save.textContent = 'Opslaan';
  const del = document.createElement('button');
  del.className = 'btn btn--ghost btn--sm btn--danger'; del.textContent = 'Verwijderen';
  actions.append(toggles, save, del);
  body.appendChild(actions);
  card.append(bar, body);

  save.addEventListener('click', async () => {
    save.disabled = true; save.textContent = 'Opslaan…';
    const cats = SERVICE_CATS.filter((cat) => catInputs[cat].checked);
    const patch = {};
    CASE_TEXT_FIELDS.forEach((f) => { patch[f.k] = inputs[f.k].value.trim(); });
    patch.service_category = cats;
    patch.services = cats[0] || '';          // string voor de overlay-groepering
    patch.services_list = tags.getValues();
    patch.highlighted = hl.input.checked;
    patch.in_popup = pop.input.checked;
    patch.published = pub.input.checked;
    const { error } = await sb.from(CASES).update(patch).eq('id', c.id);
    save.disabled = false; save.textContent = 'Opslaan';
    if (error) { toast('Opslaan mislukt: ' + error.message, true); return; }
    toast('Case opgeslagen ✓');
    Object.assign(c, patch);
    title.textContent = patch.title || c.slug; renderFlags(c);
  });
  del.addEventListener('click', async () => {
    if (!confirm(`Case "${c.title || c.slug}" definitief verwijderen?`)) return;
    const { error } = await sb.from(CASES).delete().eq('id', c.id);
    if (error) { toast('Verwijderen mislukt: ' + error.message, true); return; }
    toast('Case verwijderd'); renderCases();
  });
  return card;
}

async function uploadCaseLogo(c, file, els) {
  els.logoBtn.disabled = true; els.logoBtn.textContent = 'Uploaden…';
  try {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = 'case-logo-' + c.slug + '-' + Date.now() + '.' + ext;
    const up = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type || undefined });
    if (up.error) throw up.error;
    const url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const { error } = await sb.from(CASES).update({ logo: url }).eq('id', c.id);
    if (error) throw error;
    c.logo = url; els.logoImg.src = url; els.logoThumb.classList.remove('is-empty');
    els.logoBtn.textContent = 'Vervang logo';
    if (els.logoReset) els.logoReset.hidden = false;
    toast('Logo geüpload ✓');
  } catch (e) {
    els.logoBtn.textContent = 'Upload logo';
    toast('Logo uploaden mislukt: ' + e.message, true);
  } finally {
    els.logoBtn.disabled = false;
  }
}

// Schijf-logo van een case (uit cases.js baseline), indien aanwezig.
function diskLogoFor(slug) {
  const base = (window.CASES || []).find((c) => c.slug === slug);
  return base && base.logo ? base.logo : null;
}

// --- Per-case media ----------------------------------------------------
// Schijf-media van een case (uit cases.js baseline): cover + overige media.
function diskMediaFor(slug) {
  const base = (window.CASES || []).find((c) => c.slug === slug);
  if (!base) return [];
  const list = [];
  if (base.cover && base.cover.src) list.push({ src: base.cover.src, portrait: !!base.cover.portrait });
  (base.media || []).forEach((m) => list.push({ src: m.src, portrait: !!m.portrait }));
  return list.map((m) => ({ ...m, kind: /\.mp4$/i.test(m.src) ? 'video' : 'image' }));
}

function detectPortraitKind(file) {
  const kind = (file.type || '').startsWith('video') ? 'video' : 'image';
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const done = (portrait) => { URL.revokeObjectURL(url); resolve({ portrait, kind }); };
    if (kind === 'video') {
      const v = document.createElement('video');
      v.onloadedmetadata = () => done(v.videoHeight > v.videoWidth);
      v.onerror = () => done(false); v.src = url;
    } else {
      const img = new Image();
      img.onload = () => done(img.naturalHeight > img.naturalWidth);
      img.onerror = () => done(false); img.src = url;
    }
  });
}

function mediaThumbEl(item) {
  const thumb = document.createElement('div');
  thumb.className = 'cmedia__thumb' + (item.portrait ? ' is-portrait' : '');
  const src = displaySrc(item.src || item.url);
  if ((item.kind || '') === 'video') {
    const v = document.createElement('video');
    v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    thumb.appendChild(v);
  } else {
    const img = document.createElement('img'); img.src = src; img.loading = 'lazy';
    thumb.appendChild(img);
  }
  return thumb;
}

async function renderCaseMediaSection(slug, mount) {
  mount.innerHTML = '<div class="loading" style="padding:10px 0">Media laden…</div>';
  const { data, error } = await sb.from(CASE_MEDIA).select('*').eq('slug', slug).order('sort_order', { ascending: true });
  if (error) { mount.innerHTML = `<div class="note">Kon media niet laden: ${error.message}</div>`; return; }
  const rows = data || [];
  const disk = diskMediaFor(slug);
  mount.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'media-grid media-grid--inline';

  if (rows.length) {
    rows.forEach((m, i) => {
      const card = document.createElement('div');
      card.className = 'cmedia';
      card.appendChild(mediaThumbEl(m));
      const bar = document.createElement('div');
      bar.className = 'cmedia__bar';
      const up = document.createElement('button'); up.className = 'btn btn--ghost btn--sm'; up.textContent = '↑';
      const down = document.createElement('button'); down.className = 'btn btn--ghost btn--sm'; down.textContent = '↓';
      const del = document.createElement('button'); del.className = 'btn btn--ghost btn--sm btn--danger'; del.textContent = 'Verwijder';
      up.addEventListener('click', () => moveCaseMedia(rows, i, -1, slug, mount));
      down.addEventListener('click', () => moveCaseMedia(rows, i, 1, slug, mount));
      del.addEventListener('click', async () => {
        if (!confirm('Deze media verwijderen?')) return;
        const { error: e } = await sb.from(CASE_MEDIA).delete().eq('id', m.id);
        if (e) { toast('Verwijderen mislukt: ' + e.message, true); return; }
        renderCaseMediaSection(slug, mount);
      });
      bar.append(up, down, del);
      card.appendChild(bar);
      grid.appendChild(card);
    });
    mount.appendChild(grid);
  } else if (disk.length) {
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = 'Deze media staat nu op schijf. Klik "Overnemen" om ze in het CMS te kunnen herordenen, verwijderen en aanvullen.';
    mount.appendChild(note);
    disk.forEach((m) => { const card = document.createElement('div'); card.className = 'cmedia'; card.appendChild(mediaThumbEl(m)); grid.appendChild(card); });
    mount.appendChild(grid);
  } else {
    const p = document.createElement('p');
    p.className = 'row__current'; p.textContent = 'Nog geen media.';
    mount.appendChild(p);
  }

  // Acties
  const actions = document.createElement('div');
  actions.className = 'cmedia__actions';
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*,video/*'; fileInput.hidden = true;
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--primary btn--sm'; addBtn.type = 'button'; addBtn.textContent = '+ Media toevoegen';
  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) addCaseMedia(slug, file, rows, disk, mount, addBtn);
    fileInput.value = '';
  });
  actions.append(addBtn, fileInput);
  if (!rows.length && disk.length) {
    const take = document.createElement('button');
    take.className = 'btn btn--sm'; take.type = 'button'; take.textContent = 'Overnemen om te bewerken';
    take.addEventListener('click', async () => {
      take.disabled = true; take.textContent = 'Bezig…';
      try { await importDiskMedia(slug, disk); renderCaseMediaSection(slug, mount); }
      catch (e) { take.disabled = false; take.textContent = 'Overnemen om te bewerken'; toast('Overnemen mislukt: ' + e.message, true); }
    });
    actions.appendChild(take);
  }
  mount.appendChild(actions);
}

async function importDiskMedia(slug, disk) {
  const rows = disk.map((m, i) => ({ slug, url: m.src, kind: m.kind, portrait: m.portrait, sort_order: i }));
  const { error } = await sb.from(CASE_MEDIA).insert(rows);
  if (error) throw error;
}

async function addCaseMedia(slug, file, rows, disk, mount, btn) {
  btn.disabled = true; btn.textContent = 'Uploaden…';
  try {
    // Eerst schijf-media overnemen zodat die niet verdwijnt.
    let base = rows;
    if (!rows.length && disk.length) { await importDiskMedia(slug, disk); base = disk.map((_, i) => ({ sort_order: i })); }
    const maxOrder = base.reduce((m, r) => Math.max(m, r.sort_order || 0), -1);
    const { portrait, kind } = await detectPortraitKind(file);
    const ext = (file.name.split('.').pop() || (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = 'case-media-' + slug + '-' + Date.now() + '.' + ext;
    const up = await sb.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type || undefined });
    if (up.error) throw up.error;
    const url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const { error } = await sb.from(CASE_MEDIA).insert({ slug, url, kind, portrait, sort_order: maxOrder + 1 });
    if (error) throw error;
    toast('Media toegevoegd ✓');
    renderCaseMediaSection(slug, mount);
  } catch (e) {
    toast('Toevoegen mislukt: ' + e.message, true);
    btn.disabled = false; btn.textContent = '+ Media toevoegen';
  }
}

async function moveCaseMedia(rows, index, dir, slug, mount) {
  const j = index + dir;
  if (j < 0 || j >= rows.length) return;
  const a = rows[index], b = rows[j];
  await Promise.all([
    sb.from(CASE_MEDIA).update({ sort_order: b.sort_order }).eq('id', a.id),
    sb.from(CASE_MEDIA).update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);
  renderCaseMediaSection(slug, mount);
}

// Eenvoudige tag-editor (chips + invoer).
function makeTagEditor(initial) {
  const el = document.createElement('div');
  el.className = 'chips';
  const values = [...(initial || [])];
  const input = document.createElement('input');
  input.className = 'chips__input'; input.type = 'text'; input.placeholder = 'Service toevoegen…';

  function draw() {
    [...el.querySelectorAll('.chip')].forEach((x) => x.remove());
    values.forEach((v, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = v;
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'chip__x'; x.textContent = '×';
      x.addEventListener('click', () => { values.splice(i, 1); draw(); });
      chip.appendChild(x);
      el.insertBefore(chip, input);
    });
  }
  function add(raw) {
    raw.split(',').map((s) => s.trim()).filter(Boolean).forEach((v) => { if (!values.includes(v)) values.push(v); });
    input.value = ''; draw();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); }
    else if (e.key === 'Backspace' && !input.value && values.length) { values.pop(); draw(); }
  });
  input.addEventListener('blur', () => { if (input.value.trim()) add(input.value); });
  el.appendChild(input);
  draw();
  return { el, getValues: () => values.slice() };
}

// ---------------------------------------------------------------------
//  Cases-popup (curatie per soort dienst)
// ---------------------------------------------------------------------
async function renderPopup() {
  panel.innerHTML = '<div class="loading">Laden…</div>';
  const { data, error } = await sb.from(CASES).select('*').order('sort_order', { ascending: true });
  if (error) { panel.innerHTML = `<div class="note">Kon cases niet laden: ${error.message}</div>`; return; }
  const cases = data || [];
  panel.innerHTML = '';
  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = 'Vink aan welke cases in de cases-popup (overlay) verschijnen, gegroepeerd per soort dienst. Soort dienst stel je per case in onder "Cases".';
  panel.appendChild(note);

  const groups = SERVICE_CATS.map((cat) => ({ cat, items: cases.filter((c) => (c.service_category || []).includes(cat)) }));
  const ungrouped = cases.filter((c) => !(c.service_category || []).length);
  if (ungrouped.length) groups.push({ cat: 'Zonder soort dienst', items: ungrouped });

  groups.forEach((g) => {
    const sec = document.createElement('section');
    sec.className = 'section';
    const h = document.createElement('h2');
    h.className = 'section__title'; h.textContent = g.cat;
    sec.appendChild(h);
    if (!g.items.length) {
      const p = document.createElement('p');
      p.className = 'row__current'; p.style.padding = '2px 2px 6px'; p.textContent = 'Geen cases.';
      sec.appendChild(p);
    }
    g.items.forEach((c) => sec.appendChild(popupRow(c)));
    panel.appendChild(sec);
  });
}

function popupRow(c) {
  const row = document.createElement('div');
  row.className = 'poprow';
  const name = document.createElement('span');
  name.className = 'poprow__name'; name.textContent = c.title || c.slug;
  const t = toggle('In popup', c.in_popup);
  t.input.addEventListener('change', async () => {
    const { error } = await sb.from(CASES).update({ in_popup: t.input.checked }).eq('id', c.id);
    if (error) { toast('Opslaan mislukt: ' + error.message, true); t.input.checked = !t.input.checked; return; }
    c.in_popup = t.input.checked;
    toast(t.input.checked ? 'Toegevoegd aan popup' : 'Verwijderd uit popup');
  });
  row.append(name, t.el);
  return row;
}

function toggle(label, checked) {
  const el = document.createElement('label');
  el.className = 'toggle';
  const input = document.createElement('input');
  input.type = 'checkbox'; input.checked = !!checked;
  const span = document.createElement('span'); span.textContent = label;
  el.append(input, span);
  return { el, input };
}
async function move(index, dir) {
  const j = index + dir;
  if (j < 0 || j >= casesData.length) return;
  const a = casesData[index], b = casesData[j];
  await Promise.all([
    sb.from(CASES).update({ sort_order: b.sort_order }).eq('id', a.id),
    sb.from(CASES).update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);
  renderCases();
}
async function addCase() {
  const slug = prompt('Slug voor de nieuwe case (uniek, kleine letters, bv. "nieuwe-case"):');
  if (!slug) return;
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const maxOrder = casesData.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
  const { error } = await sb.from(CASES).insert({ slug: clean, title: clean, sort_order: maxOrder + 1, highlighted: true, published: true });
  if (error) { toast('Aanmaken mislukt: ' + error.message, true); return; }
  toast('Case aangemaakt ✓');
  if (activeTab !== 'cases') selectTab('cases'); else renderCases();
}

// ---------------------------------------------------------------------
//  Toast
// ---------------------------------------------------------------------
let toastTimer;
function toast(msg, isError) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' is-error' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}
