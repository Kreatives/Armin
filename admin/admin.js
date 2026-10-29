/* =========================================================
   Content editor — Supabase Auth + tekst-editor + cases-CMS.
   ========================================================= */
const cfg = window.CMS_CONFIG;
const TEXTS = cfg.tables.texts;
const CASES = cfg.tables.cases;
const M = window.CMS_MANIFEST;
let sb = null;             // wordt gezet zodra Supabase geladen is

// --- DOM-shortcuts -----------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const loginBox = $('#login');
const appBox = $('#app');
const panel = $('#panel');
const tabsEl = $('#tabs');

// Cache van opgehaalde pagina-HTML (voor de originele teksten).
const docCache = {};
let overrides = {};        // { key: value } uit site_texts
let activeTab = null;
const pending = new Map(); // key -> { value, baseline } : niet-opgeslagen tekst-wijzigingen
let saveBar = null;

// --- Fouten altijd zichtbaar maken (nooit een blanco scherm) -----------
function fatal(msg) {
  if (loginBox) loginBox.hidden = false;
  if (appBox) appBox.hidden = true;
  const err = $('#login-error');
  if (err) err.textContent = msg;
  console.error('[admin]', msg);
}
window.addEventListener('error', (e) => fatal('Scriptfout: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => fatal('Fout: ' + (e.reason?.message || e.reason)));

// --- Supabase laden en starten -----------------------------------------
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

// =====================================================================
//  Auth
// =====================================================================
let appStarted = false;

async function boot() {
  // Belangrijk: binnen onAuthStateChange GEEN supabase-queries await'en
  // (dat kan vastlopen door de interne auth-lock). We tonen hier alleen de
  // juiste weergave en starten het dataladen los via setTimeout.
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
  if (appStarted) return;          // voorkom dubbel laden
  appStarted = true;
  try {
    await loadData();
    buildTabs();
    selectTab(activeTab || M.pages[0].id);
  } catch (e) {
    appStarted = false;
    panel.innerHTML = `<div class="note">Kon de editor niet laden: ${e.message}</div>`;
  }
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#login-btn');
  const err = $('#login-error');
  err.textContent = '';
  if (!sb) { err.textContent = 'Nog bezig met laden, probeer het zo opnieuw.'; return; }
  btn.disabled = true; btn.textContent = 'Bezig…';
  const { data, error } = await sb.auth.signInWithPassword({
    email: $('#login-email').value.trim(),
    password: $('#login-pass').value,
  });
  btn.disabled = false; btn.textContent = 'Inloggen';
  if (error) {
    err.textContent = error.message && /email not confirmed/i.test(error.message)
      ? 'Dit account is nog niet bevestigd. Maak de user aan met "Auto Confirm User" aan, of bevestig het in Supabase.'
      : 'Inloggen mislukt: ' + (error.message || 'onbekende fout');
    return;
  }
  // Direct tonen (niet alleen leunen op het auth-event).
  if (data?.user) { revealApp(data.user); setTimeout(initApp, 0); }
});

$('#logout-btn').addEventListener('click', () => sb.auth.signOut());

// =====================================================================
//  Data
// =====================================================================
async function loadData() {
  const { data, error } = await sb.from(TEXTS).select('key,value');
  overrides = {};
  if (!error && data) data.forEach((r) => { overrides[r.key] = r.value; });
}

// Haal (en cache) de live pagina-HTML op om de originele teksten te lezen.
async function getDoc(file) {
  if (docCache[file]) return docCache[file];
  const res = await fetch('../' + file, { cache: 'no-store' });
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  docCache[file] = doc;
  return doc;
}

// Originele tekst + of het veld gevonden is.
async function baselineFor(field, file) {
  if (field.mode === 'virtual') return { text: field.default || '', found: true };
  const doc = await getDoc(file);
  let el = null;
  try { el = doc.querySelector(field.selector); } catch (_) { /* ongeldige selector */ }
  if (!el) return { text: '', found: false };
  return { text: window.CMS.readField(el, field.mode), found: true };
}

// =====================================================================
//  Tabs
// =====================================================================
function buildTabs() {
  tabsEl.innerHTML = '';
  M.pages.forEach((p) => tabsEl.appendChild(makeTab(p.id, p.label)));
  tabsEl.appendChild(makeTab('cases', 'Cases'));
}
function makeTab(id, label) {
  const b = document.createElement('button');
  b.className = 'tab';
  b.textContent = label;
  b.dataset.id = id;
  b.addEventListener('click', () => selectTab(id));
  return b;
}
function selectTab(id) {
  if (pending.size && !confirm('Je hebt niet-opgeslagen wijzigingen. Weggooien?')) return;
  pending.clear();
  updateSaveBar();
  activeTab = id;
  [...tabsEl.children].forEach((t) => t.classList.toggle('is-active', t.dataset.id === id));
  if (id === 'cases') renderCases();
  else renderTextPage(M.pages.find((p) => p.id === id));
}

// =====================================================================
//  Tekst-editor
// =====================================================================
async function renderTextPage(page) {
  panel.innerHTML = '<div class="loading">Teksten laden…</div>';
  const frag = document.createDocumentFragment();

  if (page.note) {
    const n = document.createElement('div');
    n.className = 'note';
    n.textContent = page.note;
    frag.appendChild(n);
  }

  for (const section of page.sections) {
    const sec = document.createElement('section');
    sec.className = 'section';
    const h = document.createElement('h2');
    h.className = 'section__title';
    h.textContent = section.label;
    sec.appendChild(h);
    for (const field of section.fields) {
      sec.appendChild(await makeRow(field, page.file));
    }
    frag.appendChild(sec);
  }

  panel.innerHTML = '';
  panel.appendChild(frag);
}

async function makeRow(field, file) {
  const { text: baseline, found } = await baselineFor(field, file);
  const current = overrides[field.key];
  const value = (current != null && current !== '') ? current : baseline;
  const max = field.max || Math.max(baseline.length, 0);

  const row = document.createElement('div');
  row.className = 'row' + (found ? '' : ' row--missing');

  const head = document.createElement('div');
  head.className = 'row__head';
  const label = document.createElement('span');
  label.className = 'row__label';
  label.textContent = field.label;
  const count = document.createElement('span');
  count.className = 'row__count';
  head.append(label, count);

  const cur = document.createElement('p');
  cur.className = 'row__current';
  cur.innerHTML = '<b>Nu:</b> ';
  cur.appendChild(document.createTextNode(baseline || '—'));

  const area = document.createElement('textarea');
  area.className = 'field__area';
  area.rows = Math.min(6, Math.max(1, Math.ceil((value.length || 1) / 60)));
  area.value = value;
  if (!found) { area.disabled = true; }
  else if (max > 0) { area.maxLength = max; }

  const foot = document.createElement('div');
  foot.className = 'row__foot';
  const status = document.createElement('span');
  status.className = 'row__status';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--ghost btn--sm';
  resetBtn.textContent = 'Herstel origineel';
  foot.append(status, resetBtn);

  const updateCount = () => {
    const len = area.value.length;
    count.textContent = found ? `${len} / ${max}` : 'veld niet gevonden';
    count.classList.toggle('is-full', found && max > 0 && len >= max);
  };

  // De huidige opgeslagen waarde (override of origineel).
  const savedValue = () => {
    const ov = overrides[field.key];
    return (ov != null && ov !== '') ? ov : baseline;
  };

  const refreshState = () => {
    updateCount();
    const changed = found && area.value !== savedValue();
    if (changed) {
      pending.set(field.key, { value: area.value, baseline });
      status.textContent = 'Niet opgeslagen';
      status.className = 'row__status is-dirty';
      row.classList.add('row--dirty');
    } else {
      pending.delete(field.key);
      status.textContent = '';
      status.className = 'row__status';
      row.classList.remove('row--dirty');
    }
    updateSaveBar();
  };

  updateCount();
  area.addEventListener('input', refreshState);
  resetBtn.addEventListener('click', () => { area.value = baseline; refreshState(); });

  row.append(head, cur, area, foot);
  return row;
}

// --- Onderbalk: expliciet opslaan ------------------------------------
function ensureSaveBar() {
  if (saveBar) return saveBar;
  saveBar = document.createElement('div');
  saveBar.className = 'savebar';
  saveBar.hidden = true;
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
  pending.clear();
  updateSaveBar();
  if (activeTab && activeTab !== 'cases') renderTextPage(M.pages.find((p) => p.id === activeTab));
}

async function saveAll() {
  const items = [...pending.entries()];
  if (!items.length) return;
  const bar = ensureSaveBar();
  const btn = bar.querySelector('[data-save]');
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
    renderTextPage(M.pages.find((p) => p.id === activeTab));
  } catch (e) {
    toast('Opslaan mislukt: ' + e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Wijzigingen opslaan';
    updateSaveBar();
  }
}

// =====================================================================
//  Cases-CMS
// =====================================================================
const CASE_FIELDS = [
  { k: 'title', label: 'Titel' },
  { k: 'brand', label: 'Merk (hoofdletters)' },
  { k: 'sub', label: 'Subtitel' },
  { k: 'tags', label: 'Tags (komma-gescheiden)' },
  { k: 'client', label: 'Client' },
  { k: 'date', label: 'Jaar' },
  { k: 'role', label: 'Rol' },
  { k: 'services', label: 'Services' },
  { k: 'summary', label: 'Samenvatting', full: true, area: true },
];

let casesData = [];

async function renderCases() {
  panel.innerHTML = '<div class="loading">Cases laden…</div>';
  const { data, error } = await sb.from(CASES).select('*').order('sort_order', { ascending: true });
  if (error) { panel.innerHTML = `<div class="note">Kon cases niet laden: ${error.message}</div>`; return; }
  casesData = data || [];

  panel.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'cases__head';
  head.innerHTML = '<h2 class="section__title" style="margin:0">Cases</h2>';
  const add = document.createElement('button');
  add.className = 'btn btn--primary';
  add.textContent = '+ Nieuwe case';
  add.addEventListener('click', addCase);
  head.appendChild(add);
  panel.appendChild(head);

  const note = document.createElement('div');
  note.className = 'note';
  note.textContent = 'Media (foto’s/video’s) staan in de map assets/cases/<slug>/ en worden via de slug gekoppeld. "Highlighted" bepaalt of de case op de homepage verschijnt.';
  panel.appendChild(note);

  casesData.forEach((c, i) => panel.appendChild(caseCard(c, i)));
}

function caseCard(c, index) {
  const card = document.createElement('div');
  card.className = 'case';

  // --- Balk ---
  const bar = document.createElement('div');
  bar.className = 'case__bar';
  const title = document.createElement('span');
  title.className = 'case__title';
  title.textContent = c.title || c.slug;
  const slug = document.createElement('span');
  slug.className = 'case__slug';
  slug.textContent = c.slug;
  const flags = document.createElement('span');
  flags.className = 'case__flags';
  flags.innerHTML =
    `<span class="flag ${c.highlighted ? 'on' : ''}">home</span>` +
    `<span class="flag ${c.published ? 'on' : ''}">live</span>`;

  const up = document.createElement('button');
  up.className = 'btn btn--ghost btn--sm'; up.textContent = '▲'; up.title = 'Omhoog';
  up.addEventListener('click', (e) => { e.stopPropagation(); move(index, -1); });
  const down = document.createElement('button');
  down.className = 'btn btn--ghost btn--sm'; down.textContent = '▼'; down.title = 'Omlaag';
  down.addEventListener('click', (e) => { e.stopPropagation(); move(index, 1); });

  bar.append(title, slug, flags, up, down);
  bar.addEventListener('click', () => card.classList.toggle('is-open'));

  // --- Body ---
  const body = document.createElement('div');
  body.className = 'case__body';
  const inputs = {};

  CASE_FIELDS.forEach((f) => {
    const wrap = document.createElement('label');
    wrap.className = 'field' + (f.full ? ' field--full' : '');
    const lab = document.createElement('span');
    lab.className = 'field__label';
    lab.textContent = f.label;
    let input;
    if (f.area) { input = document.createElement('textarea'); input.className = 'field__area'; input.rows = 3; }
    else { input = document.createElement('input'); input.className = 'field__input'; input.type = 'text'; }
    input.value = f.k === 'tags' ? (c.tags || []).join(', ') : (c[f.k] || '');
    inputs[f.k] = input;
    wrap.append(lab, input);
    body.appendChild(wrap);
  });

  // Toggles + acties
  const actions = document.createElement('div');
  actions.className = 'case__actions';
  const toggles = document.createElement('div');
  toggles.className = 'case__toggles';
  const hl = toggle('Op homepage', c.highlighted);
  const pub = toggle('Live op site', c.published);
  toggles.append(hl.el, pub.el);

  const save = document.createElement('button');
  save.className = 'btn btn--primary btn--sm';
  save.textContent = 'Opslaan';
  const del = document.createElement('button');
  del.className = 'btn btn--ghost btn--sm btn--danger';
  del.textContent = 'Verwijderen';

  actions.append(toggles, save, del);
  body.appendChild(actions);
  card.append(bar, body);

  save.addEventListener('click', async () => {
    save.disabled = true; save.textContent = 'Opslaan…';
    const patch = {
      title: inputs.title.value.trim(),
      brand: inputs.brand.value.trim(),
      sub: inputs.sub.value.trim(),
      tags: inputs.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
      client: inputs.client.value.trim(),
      date: inputs.date.value.trim(),
      role: inputs.role.value.trim(),
      services: inputs.services.value.trim(),
      summary: inputs.summary.value.trim(),
      highlighted: hl.input.checked,
      published: pub.input.checked,
    };
    const { error } = await sb.from(CASES).update(patch).eq('id', c.id);
    save.disabled = false; save.textContent = 'Opslaan';
    if (error) { toast('Opslaan mislukt: ' + error.message, true); return; }
    toast('Case opgeslagen ✓');
    Object.assign(c, patch);
    title.textContent = patch.title || c.slug;
    flags.innerHTML =
      `<span class="flag ${patch.highlighted ? 'on' : ''}">home</span>` +
      `<span class="flag ${patch.published ? 'on' : ''}">live</span>`;
  });

  del.addEventListener('click', async () => {
    if (!confirm(`Case "${c.title || c.slug}" definitief verwijderen?`)) return;
    const { error } = await sb.from(CASES).delete().eq('id', c.id);
    if (error) { toast('Verwijderen mislukt: ' + error.message, true); return; }
    toast('Case verwijderd');
    renderCases();
  });

  return card;
}

function toggle(label, checked) {
  const el = document.createElement('label');
  el.className = 'toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  const span = document.createElement('span');
  span.textContent = label;
  el.append(input, span);
  return { el, input };
}

async function move(index, dir) {
  const j = index + dir;
  if (j < 0 || j >= casesData.length) return;
  const a = casesData[index], b = casesData[j];
  const ao = a.sort_order, bo = b.sort_order;
  await Promise.all([
    sb.from(CASES).update({ sort_order: bo }).eq('id', a.id),
    sb.from(CASES).update({ sort_order: ao }).eq('id', b.id),
  ]);
  renderCases();
}

async function addCase() {
  const slug = prompt('Slug voor de nieuwe case (uniek, kleine letters, bv. "nieuwe-case"):');
  if (!slug) return;
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const maxOrder = casesData.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
  const { error } = await sb.from(CASES).insert({
    slug: clean, title: clean, sort_order: maxOrder + 1, highlighted: true, published: true,
  });
  if (error) { toast('Aanmaken mislukt: ' + error.message, true); return; }
  toast('Case aangemaakt ✓');
  renderCases();
}

// =====================================================================
//  Toast
// =====================================================================
let toastTimer;
function toast(msg, isError) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' is-error' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}
