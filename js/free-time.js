/* ============================================================
   FREE-TIME.JS - Logic for free-time.html
   ============================================================ */

let state = {
  ctx: null,
  mins: null,
  energy: null,
  currentSuggestions: [],
  currentIdx: 0,
  activeSection: 'islam',
  resources: {},
  addingFor: null,
};

const STORAGE_KEY = 'fto_state_v5';
const LEGACY_STORAGE_KEYS = ['fto_state_v4'];

document.addEventListener('DOMContentLoaded', () => {
  init();
});

// ---- CATEGORY META ----
const CATEGORY_META = {
  islam: { color: 'var(--c-islam)', short: 'IS', label: 'Islam' },
  swe: { color: 'var(--c-swe)', short: 'SE', label: 'SWE' },
  lang: { color: 'var(--c-lang)', short: 'LA', label: 'Languages' },
  ent: { color: 'var(--c-ent)', short: 'ET', label: 'Entertainment' },
};

const STARTER_LANGUAGE_RESOURCES = [
  { id: 'l1', name: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish', energy: 'medium', ctx: 'any', time: 10, level: 'B1', subdivision: 'English' },
  { id: 'l2', name: 'TED Talks', url: 'https://www.ted.com/talks', energy: 'medium', ctx: 'any', time: 15, level: 'B2', subdivision: 'English' },
  { id: 'l3', name: 'TV5Monde Apprendre', url: 'https://apprendre.tv5monde.com', energy: 'medium', ctx: 'home', time: 20, level: 'A2-B2', subdivision: 'French' },
  { id: 'l4', name: 'RFI Francais Facile', url: 'https://www.rfi.fr/fr/podcasts/journal-en-francais-facile/', energy: 'low', ctx: 'commute', time: 10, level: 'A2-B1', subdivision: 'French' },
  { id: 'l5', name: 'Italiano Automatico', url: 'https://www.youtube.com/@ItalianoAutomatico', energy: 'low', ctx: 'any', time: 15, level: 'B1-B2', subdivision: 'Italian' },
  { id: 'l6', name: 'Loecsen Italian Phrases', url: 'https://www.loecsen.com/en/learn-italian', energy: 'low', ctx: 'any', time: 8, level: 'A1', subdivision: 'Italian' },
  { id: 'l7', name: 'WaniKani', url: 'https://www.wanikani.com', energy: 'high', ctx: 'home', time: 10, level: 'N5-N4', subdivision: 'Japanese' },
  { id: 'l8', name: 'JapanesePod101', url: 'https://www.japanesepod101.com', energy: 'medium', ctx: 'commute', time: 15, level: 'N5-N3', subdivision: 'Japanese' },
  { id: 'l9', name: 'Arabic with Sam', url: 'https://www.youtube.com/@arabicwithsam', energy: 'medium', ctx: 'any', time: 15, level: 'A1-B1', subdivision: 'Arabic' },
  { id: 'l10', name: 'Mango Languages Arabic', url: 'https://mangolanguages.com', energy: 'medium', ctx: 'any', time: 15, level: 'A1-A2', subdivision: 'Arabic' },
  { id: 'l11', name: 'Deutsche Welle Learn German', url: 'https://www.dw.com/en/learn-german/s-2469', energy: 'medium', ctx: 'home', time: 20, level: 'A1-C1', subdivision: 'German' },
  { id: 'l12', name: 'Easy German', url: 'https://www.youtube.com/@EasyGerman', energy: 'low', ctx: 'any', time: 10, level: 'A2-B2', subdivision: 'German' },
];

// ---- DEFAULT RESOURCES ----
const defaultResources = {
  islam: [
    { id: 'd1', name: 'Quran.com', url: 'https://quran.com', energy: 'any', ctx: 'any', time: 5 },
    { id: 'd2', name: 'Bilal Assad (YouTube)', url: 'https://www.youtube.com/@BilalAssad', energy: 'low', ctx: 'any', time: 10 },
    { id: 'd3', name: 'Seerah - Omar Suleiman', url: 'https://www.youtube.com/@YaqeenInstitute', energy: 'medium', ctx: 'commute', time: 20 },
  ],
  swe: [
    { id: 'd4', name: 'LeetCode', url: 'https://leetcode.com', energy: 'high', ctx: 'any', time: 30 },
    { id: 'd5', name: 'The Odin Project', url: 'https://www.theodinproject.com', energy: 'high', ctx: 'home', time: 60 },
    { id: 'd6', name: 'CS50 Lecture', url: 'https://www.youtube.com/cs50', energy: 'medium', ctx: 'any', time: 20 },
  ],
  lang: STARTER_LANGUAGE_RESOURCES,
  ent: [
    { id: 'd14', name: 'Lex Fridman Podcast', url: 'https://lexfridman.com/podcast', energy: 'low', ctx: 'commute', time: 30, subdivision: 'Podcast' },
    { id: 'd15', name: 'Kurzgesagt (YouTube)', url: 'https://www.youtube.com/@kurzgesagt', energy: 'low', ctx: 'any', time: 10, subdivision: 'Video' },
    { id: 'd16', name: 'Chess.com', url: 'https://www.chess.com', energy: 'medium', ctx: 'any', time: 10, subdivision: 'Game' },
  ],
};

// ---- STATE PERSISTENCE ----
function getDefaultSnapshot() {
  return {
    ctx: null,
    mins: null,
    energy: null,
    activeSection: 'islam',
    resources: JSON.parse(JSON.stringify(defaultResources)),
  };
}

function normalizeSubdivisionValue(value) {
  return String(value || '').trim();
}

function normalizeStoredResources(resources) {
  const fallback = JSON.parse(JSON.stringify(defaultResources));
  const normalized = { ...fallback, ...(resources || {}) };

  ['islam', 'swe', 'lang', 'ent'].forEach((cat) => {
    normalized[cat] = (normalized[cat] || []).map((item) => {
      const next = { ...item };
      if (cat === 'ent' && !next.subdivision && next.entType) next.subdivision = next.entType;
      if (cat === 'lang' && !next.subdivision && next.langName) next.subdivision = next.langName;
      delete next.entType;
      delete next.langName;
      return next;
    });
  });

  return normalized;
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!raw) return getDefaultSnapshot();
    const saved = JSON.parse(raw);
    const fallback = getDefaultSnapshot();
    return {
      ...fallback,
      ...saved,
      resources: (saved.resources && typeof saved.resources === 'object')
        ? normalizeStoredResources(saved.resources)
        : fallback.resources,
    };
  } catch {
    return getDefaultSnapshot();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ctx: state.ctx,
    mins: state.mins,
    energy: state.energy,
    activeSection: state.activeSection,
    resources: state.resources,
  }));
}

// ---- HELPERS ----
function getCtxLabel(ctx) {
  return {
    home: 'Home',
    work: 'Work',
    commute: 'Commuting',
    outside: 'Outside',
    cafe: 'Cafe',
    travel: 'Traveling',
  }[ctx] || 'Anywhere';
}

function applySelection(selector, value, attrName) {
  document.querySelectorAll(selector).forEach((el) =>
    el.classList.toggle('active', String(el.dataset[attrName]) === String(value)));
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function slugify(value) {
  return normalizeSubdivisionValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getTopicSummary(item) {
  const meta = CATEGORY_META[item._cat] || CATEGORY_META.islam;
  const subdivision = normalizeSubdivisionValue(item.subdivision);
  return {
    topic: subdivision || meta.label,
    categoryLabel: subdivision && (item._cat === 'lang' || item._cat === 'ent')
      ? `${meta.label} · ${subdivision}`
      : meta.label,
    accent: meta.color,
    short: meta.short,
  };
}

// ---- SECTION TABS ----
function setActiveSection(tab, shouldSave = true) {
  document.querySelectorAll('.tab-btn').forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.res-section').forEach((section) => section.classList.remove('active'));
  const section = document.getElementById('section-' + tab);
  if (section) section.classList.add('active');
  state.activeSection = tab;
  if (shouldSave) persistState();
}

// ---- SUGGESTION ENGINE ----
function energyScore(resEnergy, userEnergy) {
  const map = { high: 3, medium: 2, low: 1, dead: 0 };
  if (resEnergy === 'any' || !resEnergy) return true;
  return (map[resEnergy] ?? 0) <= (map[userEnergy] ?? 2);
}

function ctxMatch(resCtx, userCtx) {
  return resCtx === 'any' || !resCtx || resCtx === userCtx;
}

function timeMatch(resTime, userMins) {
  if (!userMins) return true;
  return !resTime || resTime <= userMins;
}

function resourceFitScore(item) {
  const energyRank = { dead: 0, low: 1, medium: 2, high: 3 };
  let score = 0;

  if (state.energy) {
    if (item.energy === 'any' || !item.energy) {
      score += 1;
    } else if (energyScore(item.energy, state.energy)) {
      score += 4;
      score += 1 - Math.abs((energyRank[item.energy] ?? 1) - (energyRank[state.energy] ?? 1)) * 0.35;
    } else {
      score -= 6;
    }
  }

  if (state.ctx) {
    if (item.ctx === 'any' || !item.ctx) score += 0.5;
    else if (ctxMatch(item.ctx, state.ctx)) score += 3;
    else score -= 4;
  }

  if (state.mins) {
    if (!item.time) score += 0.5;
    else if (timeMatch(item.time, state.mins)) score += Math.max(1, 3 - ((state.mins - item.time) / Math.max(state.mins, 1)));
    else score -= Math.min(6, (item.time - state.mins) / 5);
  }

  if (item._cat === 'swe' && state.energy === 'high') score += 1.2;
  if (item._cat === 'islam' && (state.energy === 'medium' || state.energy === 'low')) score += 0.6;
  if (item._cat === 'ent' && (state.energy === 'low' || state.energy === 'dead')) score += 1;
  if (item._cat === 'lang' && state.mins && state.mins <= 15) score += 0.7;

  return score;
}

function getCandidates() {
  const allItems = [];
  Object.entries(state.resources).forEach(([cat, items]) => {
    items.forEach((item) => {
      allItems.push({ ...item, _cat: cat, _score: resourceFitScore(item) });
    });
  });
  return allItems
    .filter((item) => item._score > -2)
    .sort((a, b) => b._score - a._score);
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function regen() {
  const candidates = getCandidates();
  if (!candidates.length) {
    state.currentSuggestions = [];
  } else {
    const [best, ...rest] = candidates;
    state.currentSuggestions = [best, ...shuffleArray(rest)];
  }
  state.currentIdx = 0;
  renderSuggestion();
}

function shuffle() {
  if (!state.currentSuggestions.length) return;
  state.currentIdx = (state.currentIdx + 1) % state.currentSuggestions.length;
  renderSuggestion();
}

function renderSuggestion() {
  const out = document.getElementById('suggestion-output');
  if (!state.ctx && !state.energy && !state.mins) {
    out.innerHTML = `<div class="suggestion-card" style="min-height:120px">
      <div class="accent-line" style="background:var(--text-muted)"></div>
      <div class="empty-state"><div class="big">?</div>Select your context, time, and energy above</div>
    </div>`;
    return;
  }

  if (!state.currentSuggestions.length) {
    out.innerHTML = `<div class="suggestion-card" style="min-height:120px">
      <div class="accent-line" style="background:var(--text-muted)"></div>
      <div class="empty-state"><div class="big">0</div>No resources match right now. Add some below.</div>
    </div>`;
    return;
  }

  const resource = state.currentSuggestions[state.currentIdx];
  const topic = getTopicSummary(resource);
  const contextLabel = state.ctx ? getCtxLabel(state.ctx) : '';
  const timeLabel = state.mins ? (state.mins >= 999 ? 'Open-ended' : `${state.mins} min`) : '';
  const badge = [contextLabel, timeLabel].filter(Boolean).join(' | ');
  const topicLine = topic.topic && topic.topic !== resource.name
    ? `Best-fit topic right now: ${topic.topic}`
    : 'Best-fit pick for your current setup.';

  const resourceHtml = resource.url
    ? `<a class="s-resource" href="${resource.url}" target="_blank" rel="noopener" style="--accent:${topic.accent}">
        <div class="s-res-icon" style="font-size:16px">${topic.short}</div>
        <div class="s-res-info">
          <div class="s-res-name">${escHtml(resource.name)}</div>
          <div class="s-res-sub">${escHtml(topicLine)}</div>
        </div>
        <div class="s-res-arrow">Open -></div>
      </a>`
    : `<div class="s-resource">
        <div class="s-res-icon">${topic.short}</div>
        <div class="s-res-info">
          <div class="s-res-name">${escHtml(resource.name)}</div>
          <div class="s-res-sub">${escHtml(topicLine)}</div>
        </div>
      </div>`;

  out.innerHTML = `
    <div class="suggestion-card" style="--accent:${topic.accent}">
      <div class="accent-line"></div>
      <div class="s-tag">${escHtml(topic.categoryLabel)}</div>
      ${badge ? `<div class="s-context-badge">${badge}</div>` : ''}
      <div class="s-title">${escHtml(resource.name)}</div>
      <div class="s-desc">${getSuggestionDesc(state.energy, state.ctx, topic.topic)}</div>
      <div class="s-resources">${resourceHtml}</div>
      ${resource.time ? `<div class="s-duration">~${resource.time} min recommended</div>` : ''}
    </div>`;
}

function getSuggestionDesc(energy, ctx, topic) {
  const ePhrase = {
    high: 'You have good energy. This is a strong time to do something demanding.',
    medium: 'Steady energy. Good for practice, reading, or light focus.',
    low: 'Low energy. Lighter options make more sense right now.',
    dead: 'You are tired. Passive or very easy options are the better fit.',
  };
  const cPhrase = {
    commute: 'Audio or quick sessions fit commuting well.',
    work: 'This works as a productive break without too much switching cost.',
    outside: 'This is easy to do from your phone while away from a desk.',
    cafe: 'This fits a cafe session nicely.',
    home: 'Home gives this option the best chance of going well.',
    travel: 'Portable and low-friction is a good match while traveling.',
  };
  const tPhrase = topic ? `${topic} came out on top from your saved resources.` : '';
  return [ePhrase[energy], cPhrase[ctx], tPhrase].filter(Boolean).join(' ') || 'A good use of your free time.';
}

// ---- RESOURCE LISTS ----
function renderAllLists() {
  ['islam', 'swe', 'lang', 'ent'].forEach(renderList);
}

function renderList(cat) {
  const listEl = document.getElementById('list-' + cat);
  if (!listEl) return;

  const filtered = state.resources[cat] || [];

  if (!filtered.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:11px;letter-spacing:1px">No resources yet - add one below</div>';
    return;
  }

  listEl.innerHTML = filtered.map((item) => {
    const meta = CATEGORY_META[cat] || CATEGORY_META.islam;
    const details = [];
    if (item.time) details.push(`${item.time} min`);
    if (item.energy && item.energy !== 'any') details.push(item.energy);
    if (item.ctx && item.ctx !== 'any') details.push(getCtxLabel(item.ctx));
    if (item.level) details.push(String(item.level).toUpperCase());
    if (item.subdivision) details.push(item.subdivision);

    const openBtn = item.url
      ? `<a class="res-open-btn" href="${item.url}" target="_blank" rel="noopener">Open</a>`
      : '<span class="res-open-btn" style="opacity:0.3;cursor:default">No link</span>';

    return `<div class="res-item" data-id="${item.id}" data-cat="${cat}">
      <div class="res-item-dot" style="background:${meta.color}"></div>
      <div class="res-item-info">
        <div class="res-item-name">${escHtml(item.name)}</div>
        <div class="res-item-meta">${escHtml(details.join(' | ') || 'any')}</div>
      </div>
      <div class="res-item-actions">
        ${openBtn}
        <button class="res-del-btn" onclick="deleteResource('${cat}','${item.id}')">x</button>
      </div>
    </div>`;
  }).join('');
}

function deleteResource(cat, id) {
  state.resources[cat] = (state.resources[cat] || []).filter((item) => item.id !== id);
  persistState();
  renderList(cat);
  regen();
  showToast('Resource removed');
}

// ---- ADD MODAL ----
function openAddModal(cat) {
  state.addingFor = cat;
  document.getElementById('modalTitle').textContent = `Add ${(CATEGORY_META[cat]?.label || cat)} Resource`;
  document.getElementById('modalSub').textContent = 'Smart suggestions will use this based on your energy, context, and time.';
  ['resName', 'resUrl', 'resTime', 'resSubdivision'].forEach((id) => { document.getElementById(id).value = ''; });
  document.getElementById('resEnergy').value = 'any';
  document.getElementById('resCtx').value = 'any';

  const subdivisionField = document.getElementById('subdivisionField');
  const subdivisionLabel = document.getElementById('subdivisionLabel');
  if (subdivisionField) subdivisionField.style.display = (cat === 'ent' || cat === 'lang') ? '' : 'none';
  if (subdivisionLabel) {
    subdivisionLabel.textContent = cat === 'lang'
      ? 'Language / subdivision'
      : 'Entertainment type / subdivision';
  }

  document.getElementById('addOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('addOverlay').classList.remove('open');
}

function overlayClose(e) {
  if (e.target === document.getElementById('addOverlay')) closeModal();
}

function saveResource() {
  const name = document.getElementById('resName').value.trim();
  if (!name) {
    showToast('Please enter a name');
    return;
  }

  const cat = state.addingFor;
  const resource = {
    id: 'r' + Date.now(),
    name,
    url: document.getElementById('resUrl').value.trim() || null,
    energy: document.getElementById('resEnergy').value,
    time: parseInt(document.getElementById('resTime').value, 10) || null,
    ctx: document.getElementById('resCtx').value,
  };

  if (cat === 'ent' || cat === 'lang') {
    resource.subdivision = normalizeSubdivisionValue(document.getElementById('resSubdivision').value);
  }

  if (!state.resources[cat]) state.resources[cat] = [];
  state.resources[cat].unshift(resource);
  persistState();

  renderList(cat);
  regen();
  closeModal();
  showToast('Resource added');
}

// ---- INIT ----
function init() {
  const saved = loadSavedState();
  Object.assign(state, {
    ctx: saved.ctx,
    mins: saved.mins,
    energy: saved.energy,
    activeSection: saved.activeSection,
    resources: normalizeStoredResources(saved.resources),
  });

  applySelection('.ctx-btn', state.ctx, 'ctx');
  applySelection('.time-btn', state.mins, 'mins');
  applySelection('.e-btn', state.energy, 'energy');

  setActiveSection(state.activeSection, false);
  renderAllLists();
  regen();

  document.querySelectorAll('.ctx-btn').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.ctx-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.ctx = btn.dataset.ctx;
    regen();
    persistState();
  }));

  document.querySelectorAll('.time-btn').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.time-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.mins = parseInt(btn.dataset.mins, 10);
    regen();
    persistState();
  }));

  document.querySelectorAll('.e-btn').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.e-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.energy = btn.dataset.energy;
    regen();
    persistState();
  }));

  document.getElementById('sectionTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    setActiveSection(btn.dataset.tab);
  });

}
