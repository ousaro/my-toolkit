/* ============================================================
   FREE-TIME.JS — Logic for free-time.html
   ============================================================ */

let state = {
  ctx:    null,
  mins:   null,
  energy: null,
  currentSuggestions: [],
  currentIdx: 0,
  activeSection: 'islam',
  activeEntTag: 'all',
  activeLangTag: 'all',
  activeLang: null,
  resources: {},
  timer: { total: 25 * 60, remaining: 25 * 60, running: false, interval: null },
  addingFor: null,
};

const STORAGE_KEY = 'fto_state_v4';

// ---- PASSWORD PROTECTION ----
const PASSWORD = 'ousaro2026'; // Change this to your desired password

function checkPassword() {
  const input = document.getElementById('password-input').value;
  if (input === PASSWORD) {
    document.getElementById('password-overlay').style.display = 'none';
  } else {
    alert('Incorrect password');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('password-submit').addEventListener('click', checkPassword);
  document.getElementById('password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
  init(); // Initialize the page after DOM is ready
});

// ---- CATEGORY META ----
const CATEGORY_META = {
  islam:  { color: 'var(--c-islam)',  short: 'IS', label: 'Islam' },
  swe:    { color: 'var(--c-swe)',    short: 'SE', label: 'SWE' },
  lang:   { color: 'var(--c-lang)',   short: 'LA', label: 'Language' },
  ent:    { color: 'var(--c-ent)',     short: 'ET', label: 'Entertainment' },
};

// ---- LANGUAGE DATA ----
const LANGUAGES = [
  {
    id: 'en',
    name: 'English',
    native: 'English',
    flag: '🇬🇧',
    color: '#4ecdc4',
    // recommended by context/energy/time combos
    bestFor: { energy: ['high','medium'], ctx: ['home','cafe','work'], minMins: 10 },
    resources: [
      { name: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish', icon: '📺', time: 10, energy: 'medium', ctx: 'any', level: 'B1' },
      { name: 'TED Talks', url: 'https://www.ted.com/talks', icon: '🎤', time: 15, energy: 'medium', ctx: 'any', level: 'B2' },
      { name: 'British Council', url: 'https://learnenglish.britishcouncil.org', icon: '🏫', time: 15, energy: 'medium', ctx: 'any', level: 'B1/B2' },
      { name: 'Anki Vocab Cards', url: 'https://apps.ankiweb.net', icon: '🃏', time: 5, energy: 'low', ctx: 'any', level: 'Any' },
      { name: 'Grammarly Blog (Writing)', url: 'https://www.grammarly.com/blog', icon: '✍️', time: 8, energy: 'low', ctx: 'any', level: 'B2' },
    ],
  },
  {
    id: 'fr',
    name: 'French',
    native: 'Français',
    flag: '🇫🇷',
    color: '#5ba3d9',
    bestFor: { energy: ['high','medium'], ctx: ['home','cafe'], minMins: 15 },
    resources: [
      { name: 'Duolingo French', url: 'https://www.duolingo.com', icon: '🦜', time: 5, energy: 'low', ctx: 'any', level: 'A1–B1' },
      { name: 'TV5Monde Apprendre', url: 'https://apprendre.tv5monde.com', icon: '📺', time: 20, energy: 'medium', ctx: 'home', level: 'A2–B2' },
      { name: 'RFI Français Facile', url: 'https://www.rfi.fr/fr/podcasts/journal-en-fran%C3%A7ais-facile/', icon: '🎙️', time: 10, energy: 'low', ctx: 'commute', level: 'A2–B1' },
      { name: 'Anki French Deck', url: 'https://apps.ankiweb.net', icon: '🃏', time: 5, energy: 'low', ctx: 'any', level: 'Any' },
      { name: 'Lingolia French Grammar', url: 'https://francais.lingolia.com', icon: '📖', time: 10, energy: 'medium', ctx: 'home', level: 'A2–B2' },
    ],
  },
  {
    id: 'it',
    name: 'Italian',
    native: 'Italiano',
    flag: '🇮🇹',
    color: '#e07a6e',
    bestFor: { energy: ['high','medium'], ctx: ['home','cafe'], minMins: 15 },
    resources: [
      { name: 'Duolingo Italian', url: 'https://www.duolingo.com', icon: '🦜', time: 5, energy: 'low', ctx: 'any', level: 'A1–B1' },
      { name: 'RAI Learn Italian', url: 'https://www.rai.it/dl/RaiTV/programmi/media/ContentItem-64af0b18-e81b-4d29-bef1-e13c24adb99c.html', icon: '📺', time: 20, energy: 'medium', ctx: 'home', level: 'A2–B1' },
      { name: 'Italiano Automatico (YT)', url: 'https://www.youtube.com/@ItalianoAutomatico', icon: '▶️', time: 15, energy: 'low', ctx: 'any', level: 'B1–B2' },
      { name: 'Loecsen Italian Phrases', url: 'https://www.loecsen.com/en/learn-italian', icon: '🗣️', time: 8, energy: 'low', ctx: 'any', level: 'A1' },
    ],
  },
  {
    id: 'jp',
    name: 'Japanese',
    native: '日本語',
    flag: '🇯🇵',
    color: '#ffb340',
    bestFor: { energy: ['high'], ctx: ['home'], minMins: 20 },
    resources: [
      { name: 'WaniKani (Kanji)', url: 'https://www.wanikani.com', icon: '🀄', time: 10, energy: 'high', ctx: 'home', level: 'N5–N4' },
      { name: 'Duolingo Japanese', url: 'https://www.duolingo.com', icon: '🦜', time: 5, energy: 'low', ctx: 'any', level: 'N5' },
      { name: 'JapanesePod101', url: 'https://www.japanesepod101.com', icon: '🎙️', time: 15, energy: 'medium', ctx: 'commute', level: 'N5–N3' },
      { name: 'Tofugu — Japanese Grammar', url: 'https://www.tofugu.com/japanese-grammar/', icon: '📖', time: 20, energy: 'high', ctx: 'home', level: 'N5–N4' },
    ],
  },
  {
    id: 'ar',
    name: 'Arabic',
    native: 'العربية',
    flag: '🇸🇦',
    color: '#72c472',
    bestFor: { energy: ['high','medium'], ctx: ['home','cafe'], minMins: 10 },
    resources: [
      { name: 'Duolingo Arabic', url: 'https://www.duolingo.com', icon: '🦜', time: 5, energy: 'low', ctx: 'any', level: 'A1' },
      { name: 'Arabic with Sam (YT)', url: 'https://www.youtube.com/@arabicwithsam', icon: '▶️', time: 15, energy: 'medium', ctx: 'any', level: 'A1–B1' },
      { name: "Lane's Lexicon", url: 'https://arabiclexicon.hawramani.com', icon: '📚', time: 20, energy: 'high', ctx: 'home', level: 'Advanced' },
      { name: 'Mango Languages — Arabic', url: 'https://mangolanguages.com', icon: '🥭', time: 15, energy: 'medium', ctx: 'any', level: 'A1–A2' },
    ],
  },
  {
    id: 'de',
    name: 'German',
    native: 'Deutsch',
    flag: '🇩🇪',
    color: '#c9a84c',
    bestFor: { energy: ['high','medium'], ctx: ['home','cafe'], minMins: 15 },
    resources: [
      { name: 'Duolingo German', url: 'https://www.duolingo.com', icon: '🦜', time: 5, energy: 'low', ctx: 'any', level: 'A1–B1' },
      { name: 'Deutsche Welle (DW)', url: 'https://www.dw.com/en/learn-german/s-2469', icon: '📻', time: 20, energy: 'medium', ctx: 'home', level: 'A1–C1' },
      { name: 'Easy German (YT)', url: 'https://www.youtube.com/@EasyGerman', icon: '▶️', time: 10, energy: 'low', ctx: 'any', level: 'A2–B2' },
    ],
  },
];

// ---- DEFAULT RESOURCES ----
const defaultResources = {
  islam: [
    { id: 'd1', name: 'Quran.com', url: 'https://quran.com', energy: 'any', ctx: 'any', time: 5 },
    { id: 'd2', name: 'Bilal Assad (YouTube)', url: 'https://www.youtube.com/@BilalAssad', energy: 'low', ctx: 'any', time: 10 },
    { id: 'd3', name: 'Seerah — Omar Suleiman', url: 'https://www.youtube.com/@YaqeenInstitute', energy: 'medium', ctx: 'commute', time: 20 },
  ],
  swe: [
    { id: 'd4', name: 'LeetCode', url: 'https://leetcode.com', energy: 'high', ctx: 'any', time: 30 },
    { id: 'd5', name: 'The Odin Project', url: 'https://www.theodinproject.com', energy: 'high', ctx: 'home', time: 60 },
    { id: 'd6', name: 'CS50 Lecture', url: 'https://www.youtube.com/cs50', energy: 'medium', ctx: 'any', time: 20 },
  ],
  lang: [],   // populated dynamically from LANGUAGES
  ent: [
    { id: 'd14', name: 'Lex Fridman Podcast', url: 'https://lexfridman.com/podcast', energy: 'low', ctx: 'commute', time: 30, entType: 'podcast' },
    { id: 'd15', name: 'Kurzgesagt (YouTube)', url: 'https://www.youtube.com/@kurzgesagt', energy: 'low', ctx: 'any', time: 10, entType: 'video' },
    { id: 'd16', name: 'Chess.com', url: 'https://www.chess.com', energy: 'medium', ctx: 'any', time: 10, entType: 'game' },
  ],
};

// ---- SMART LANG PICKER ----
/**
 * Score a language for the current state.
 * Returns a numeric score (higher = better fit).
 */
function scoreLang(lang) {
  let score = 0;
  const bf = lang.bestFor;
  if (state.energy && bf.energy.includes(state.energy)) score += 3;
  if (state.ctx && bf.ctx.includes(state.ctx)) score += 2;
  if (state.mins && state.mins >= bf.minMins) score += 1;
  // Penalty for mismatch
  if (state.energy === 'dead') score -= 5;
  if (state.energy === 'low' && lang.id === 'jp') score -= 2; // JP is demanding
  return score;
}

function getSmartLangPick() {
  if (!state.energy && !state.ctx && !state.mins) return null;
  const scored = LANGUAGES.map(l => ({ lang: l, score: scoreLang(l) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].lang : null;
}

function getFilteredLangResources(lang) {
  if (!lang) return [];
  const energyOrder = { high: 3, medium: 2, low: 1, dead: 0 };
  const userE = energyOrder[state.energy] ?? 2;
  return lang.resources.filter(r => {
    const resE = energyOrder[r.energy] ?? 0;
    const timeOk  = !state.mins || r.time <= state.mins;
    const energyOk = resE <= userE;
    const ctxOk   = r.ctx === 'any' || !state.ctx || r.ctx === state.ctx;
    return timeOk && energyOk && ctxOk;
  });
}

// ---- STATE PERSISTENCE ----
function getDefaultSnapshot() {
  return {
    ctx: null, mins: null, energy: null,
    activeSection: 'islam', activeEntTag: 'all', activeLangTag: 'all', activeLang: null,
    resources: JSON.parse(JSON.stringify(defaultResources)),
    timer: { total: 25 * 60, remaining: 25 * 60, running: false },
  };
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSnapshot();
    const saved = JSON.parse(raw);
    const fallback = getDefaultSnapshot();
    return {
      ...fallback, ...saved,
      resources: (saved.resources && typeof saved.resources === 'object')
        ? { ...fallback.resources, ...saved.resources }
        : fallback.resources,
      timer: { ...fallback.timer, ...(saved.timer || {}), running: false },
    };
  } catch { return getDefaultSnapshot(); }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ctx: state.ctx, mins: state.mins, energy: state.energy,
    activeSection: state.activeSection,
    activeEntTag: state.activeEntTag,
    activeLangTag: state.activeLangTag,
    activeLang: state.activeLang,
    resources: state.resources,
    timer: { total: state.timer.total, remaining: state.timer.remaining, running: false },
  }));
}

// ---- HELPERS ----
function getCtxLabel(ctx) {
  return { home:'Home', work:'Work', commute:'Commuting', outside:'Outside', cafe:'Cafe', travel:'Traveling' }[ctx] || 'Anywhere';
}

function applySelection(selector, value, attrName) {
  document.querySelectorAll(selector).forEach(el =>
    el.classList.toggle('active', String(el.dataset[attrName]) === String(value)));
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---- SECTION TABS ----
function setActiveSection(tab, shouldSave = true) {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.res-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById('section-' + tab);
  if (section) section.classList.add('active');
  state.activeSection = tab;
  if (shouldSave) persistState();
}

function setActiveEntTag(tag, shouldSave = true) {
  document.querySelectorAll('.ent-tag').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.etag === tag));
  state.activeEntTag = tag;
  renderList('ent');
  if (shouldSave) persistState();
}

function setActiveLangTag(tag, shouldSave = true) {
  document.querySelectorAll('.lang-tag').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.ltag === tag));
  state.activeLangTag = tag;
  renderList('lang');
  if (shouldSave) persistState();
}

// ---- LANGUAGE SECTION RENDER ----
function renderLangSection() {
  const smartPick = getSmartLangPick();
  const container = document.getElementById('lang-section-content');
  if (!container) return;

  // Smart suggestion banner
  let smartHtml = '';
  if (smartPick) {
    const filtered = getFilteredLangResources(smartPick);
    const resHtml = filtered.slice(0, 2).map(r => `
      <a class="lang-res-item" href="${r.url}" target="_blank" rel="noopener">
        <div class="lang-res-icon">${r.icon}</div>
        <div>
          <div class="lang-res-name">${escHtml(r.name)}</div>
          <div class="lang-res-meta">${r.level} · ~${r.time} min</div>
        </div>
        <div class="lang-res-badges">
          <span class="lang-badge lang-badge-time">${r.time}m</span>
        </div>
      </a>`).join('');

    smartHtml = `
      <div class="lang-smart-suggestion">
        <div class="lang-smart-label">${smartPick.flag} Best language for right now</div>
        <div class="lang-smart-title">${smartPick.name}</div>
        <div class="lang-smart-desc">Matches your energy &amp; context. ${resHtml ? 'Top resources:' : 'Explore resources below.'}</div>
        ${resHtml ? `<div class="lang-resources" style="margin-top:10px">${resHtml}</div>` : ''}
      </div>`;
  }

  // Language grid
  const gridHtml = LANGUAGES.map(l => `
    <div class="lang-card${state.activeLang === l.id ? ' active' : ''}"
         style="--lang-color:${l.color}"
         onclick="selectLang('${l.id}')">
      <div class="lang-flag">${l.flag}</div>
      <div class="lang-name">${l.name}</div>
      <div class="lang-native">${l.native}</div>
      <div class="lang-level">${state.activeLang === l.id ? '▼ browsing' : '→ browse'}</div>
    </div>`).join('');

  // Expanded resources for selected lang
  let expandedHtml = '';
  if (state.activeLang) {
    const lang = LANGUAGES.find(l => l.id === state.activeLang);
    if (lang) {
      const resList = lang.resources.map(r => `
        <a class="lang-res-item" href="${r.url}" target="_blank" rel="noopener">
          <div class="lang-res-icon">${r.icon}</div>
          <div>
            <div class="lang-res-name">${escHtml(r.name)}</div>
            <div class="lang-res-meta">${r.level}</div>
          </div>
          <div class="lang-res-badges">
            <span class="lang-badge lang-badge-time">${r.time}m</span>
            <span class="lang-badge lang-badge-energy">${r.energy}</span>
          </div>
        </a>`).join('');
      expandedHtml = `<div class="lang-resources">${resList}</div>`;
    }
  }

  container.innerHTML = smartHtml +
    `<div class="label" style="margin-bottom:10px">CHOOSE A LANGUAGE</div>` +
    `<div class="lang-grid">${gridHtml}</div>` +
    expandedHtml;
}

function selectLang(id) {
  state.activeLang = (state.activeLang === id) ? null : id;
  persistState();
  renderLangSection();
}

// ---- SUGGESTION ENGINE ----
function energyScore(resEnergy, userEnergy) {
  const map = { high: 3, medium: 2, low: 1, dead: 0 };
  if (resEnergy === 'any') return true;
  return (map[resEnergy] ?? 0) <= (map[userEnergy] ?? 2);
}
function ctxMatch(resCtx, userCtx) {
  return resCtx === 'any' || resCtx === userCtx;
}
function timeMatch(resTime, userMins) {
  if (!userMins) return true;
  return (resTime || 0) <= userMins;
}

function getCandidates() {
  const allItems = [];
  // From curated resource lists
  Object.entries(state.resources).forEach(([cat, items]) => {
    items.forEach(item => allItems.push({ ...item, _cat: cat }));
  });
  // Also fold in language resources as candidates
  LANGUAGES.forEach(lang => {
    lang.resources.forEach(r => {
      allItems.push({ ...r, id: `lang_${lang.id}_${r.name}`, _cat: 'lang', _langId: lang.id });
    });
  });

  return allItems.filter(item => {
    const energyOk = !state.energy || energyScore(item.energy, state.energy);
    const ctxOk    = !state.ctx    || ctxMatch(item.ctx, state.ctx);
    const timeOk   = !state.mins   || timeMatch(item.time || 0, state.mins);
    return energyOk && ctxOk && timeOk;
  });
}

function shuffleArray(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function regen() {
  state.currentSuggestions = shuffleArray(getCandidates());
  state.currentIdx = 0;
  renderSuggestion();
  // Also update language smart suggestion when params change
  if (state.activeSection === 'lang') renderLangSection();
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
  const isLang   = resource._cat === 'lang';
  const langObj  = isLang ? LANGUAGES.find(l => l.id === resource._langId) : null;
  const meta     = isLang
    ? { color: langObj?.color || 'var(--c-lang)', short: langObj?.flag || 'LA', label: `Language · ${langObj?.name || ''}` }
    : (CATEGORY_META[resource._cat] || { color: 'var(--c-islam)', short: 'IT', label: resource._cat });

  const contextLabel = state.ctx ? getCtxLabel(state.ctx) : '';
  const timeLabel    = state.mins ? (state.mins >= 999 ? 'Open-ended' : state.mins + ' min') : '';
  const badge        = [contextLabel, timeLabel].filter(Boolean).join(' | ');

  const resourceHtml = resource.url
    ? `<a class="s-resource" href="${resource.url}" target="_blank" rel="noopener" style="--accent:${meta.color}">
        <div class="s-res-icon" style="font-size:16px">${meta.short}</div>
        <div class="s-res-info">
          <div class="s-res-name">${escHtml(resource.name)}</div>
          <div class="s-res-sub">Tap to open</div>
        </div>
        <div class="s-res-arrow">Open →</div>
      </a>`
    : `<div class="s-resource">
        <div class="s-res-icon">${meta.short}</div>
        <div class="s-res-info">
          <div class="s-res-name">${escHtml(resource.name)}</div>
          <div class="s-res-sub">No link saved</div>
        </div>
      </div>`;

  out.innerHTML = `
    <div class="suggestion-card" style="--accent:${meta.color}">
      <div class="accent-line"></div>
      <div class="s-tag">${meta.label}</div>
      ${badge ? `<div class="s-context-badge">${badge}</div>` : ''}
      <div class="s-title">${escHtml(resource.name)}</div>
      <div class="s-desc">${getSuggestionDesc(state.energy, state.ctx)}</div>
      <div class="s-resources">${resourceHtml}</div>
      ${resource.time ? `<div class="s-duration">~${resource.time} min recommended</div>` : ''}
    </div>`;
}

function getSuggestionDesc(energy, ctx) {
  const ePhrase = {
    high:   'You have good energy — make it count.',
    medium: 'Steady energy. Great for focused reading or practice.',
    low:    'Low energy. Light content works well right now.',
    dead:   'You\'re tired. Passive listening or a quick review is ideal.',
  };
  const cPhrase = {
    commute: 'Perfect for commuting. Audio works especially well here.',
    work:    'A productive micro-break without switching contexts too hard.',
    outside: 'Works on mobile. No desk needed.',
    cafe:    'Great cafe activity. Settle in and dive in.',
    home:    'Best with full focus at home.',
    travel:  'Light and portable — great for long journeys.',
  };
  return [ePhrase[energy], cPhrase[ctx]].filter(Boolean).join(' ') || 'A great use of your free time.';
}

// ---- RESOURCE LISTS ----
function renderAllLists() {
  ['islam', 'swe', 'lang', 'ent'].forEach(renderList);
}

function renderList(cat) {
  const listEl = document.getElementById('list-' + cat);
  if (!listEl) return;

  if (cat === 'lang') {
    // Map language tags to language IDs
    const tagToId = { english: 'en', french: 'fr', italian: 'it', japanese: 'jp', arabic: 'ar', german: 'de' };
    const activeId = state.activeLangTag === 'all' ? null : tagToId[state.activeLangTag];
    
    let languages = LANGUAGES;
    if (activeId) {
      languages = languages.filter(l => l.id === activeId);
    }

    if (!languages.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:11px;letter-spacing:1px">No languages available</div>';
      return;
    }

    // Flatten all language resources into a single list
    const allResources = [];
    languages.forEach(lang => {
      lang.resources.forEach(res => {
        allResources.push({
          ...res,
          langId: lang.id,
          langName: lang.name,
          langColor: lang.color,
        });
      });
    });

    if (!allResources.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:11px;letter-spacing:1px">No resources yet — add one below</div>';
      return;
    }

    listEl.innerHTML = allResources.map(item => {
      const details = [];
      if (item.time) details.push(item.time + ' min');
      if (item.energy && item.energy !== 'any') details.push(item.energy);
      if (item.ctx && item.ctx !== 'any') details.push(getCtxLabel(item.ctx));
      if (item.level) details.push(item.level.toUpperCase());

      const openBtn = item.url
        ? `<a class="res-open-btn" href="${item.url}" target="_blank" rel="noopener">Open</a>`
        : `<span class="res-open-btn" style="opacity:0.3;cursor:default">No link</span>`;

      return `<div class="res-item" data-id="${item.name}" data-cat="lang">
        <div class="res-item-dot" style="background:${item.langColor}"></div>
        <div class="res-item-info">
          <div class="res-item-name">${escHtml(item.name)}</div>
          <div class="res-item-meta">${details.join(' | ') || 'any'}</div>
        </div>
        <div class="res-item-actions">
          ${openBtn}
        </div>
      </div>`;
    }).join('');
    return;
  }

  const items = state.resources[cat] || [];
  let filtered = items;
  if (cat === 'ent' && state.activeEntTag !== 'all') {
    filtered = items.filter(item => item.entType === state.activeEntTag);
  }

  if (!filtered.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:11px;letter-spacing:1px">No resources yet — add one below</div>';
    return;
  }

  listEl.innerHTML = filtered.map(item => {
    const meta    = CATEGORY_META[cat] || { color: 'var(--c-islam)' };
    const details = [];
    if (item.time)                      details.push(item.time + ' min');
    if (item.energy && item.energy !== 'any') details.push(item.energy);
    if (item.ctx && item.ctx !== 'any') details.push(getCtxLabel(item.ctx));
    if (item.level)                     details.push(item.level.toUpperCase());
    if (item.entType)                   details.push(item.entType);

    const openBtn = item.url
      ? `<a class="res-open-btn" href="${item.url}" target="_blank" rel="noopener">Open</a>`
      : `<span class="res-open-btn" style="opacity:0.3;cursor:default">No link</span>`;

    return `<div class="res-item" data-id="${item.id}" data-cat="${cat}">
      <div class="res-item-dot" style="background:${meta.color}"></div>
      <div class="res-item-info">
        <div class="res-item-name">${escHtml(item.name)}</div>
        <div class="res-item-meta">${details.join(' | ') || 'any'}</div>
      </div>
      <div class="res-item-actions">
        ${openBtn}
        <button class="res-del-btn" onclick="deleteResource('${cat}','${item.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

function deleteResource(cat, id) {
  state.resources[cat] = (state.resources[cat] || []).filter(item => item.id !== id);
  persistState();
  renderList(cat);
  regen();
  showToast('Resource removed');
}

// ---- ADD MODAL ----
function openAddModal(cat) {
  state.addingFor = cat;
  document.getElementById('modalTitle').textContent =
    'Add ' + (CATEGORY_META[cat]?.label || cat) + ' Resource';
  document.getElementById('modalSub').textContent =
    'Smart suggestions will use this based on your energy and location';
  ['resName','resUrl','resTime'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('resEnergy').value = 'any';
  document.getElementById('resCtx').value    = 'any';
  const entField = document.getElementById('entTypeField');
  const engField = document.getElementById('engLevelField');
  if (entField) entField.style.display = (cat === 'ent') ? '' : 'none';
  if (engField) engField.style.display = (cat === 'english') ? '' : 'none';
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
  if (!name) { showToast('Please enter a name'); return; }

  const cat = state.addingFor;
  const resource = {
    id: 'r' + Date.now(),
    name,
    url:    document.getElementById('resUrl').value.trim() || null,
    energy: document.getElementById('resEnergy').value,
    time:   parseInt(document.getElementById('resTime').value, 10) || null,
    ctx:    document.getElementById('resCtx').value,
  };

  const entField = document.getElementById('resEntType');
  const engField = document.getElementById('resEngLevel');
  if (cat === 'ent' && entField) resource.entType = entField.value;
  if (cat === 'english' && engField) resource.level = engField.value;

  if (!state.resources[cat]) state.resources[cat] = [];
  state.resources[cat].unshift(resource);
  persistState();
  renderList(cat);
  regen();
  closeModal();
  showToast('Resource added');
}

// ---- TIMER ----
function updateTimerDisplay() {
  const m = Math.floor(state.timer.remaining / 60).toString().padStart(2, '0');
  const s = (state.timer.remaining % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = m + ':' + s;
}
function updateTimerProgress() {
  const elapsed = state.timer.total - state.timer.remaining;
  const pct = state.timer.total > 0 ? (elapsed / state.timer.total) * 100 : 0;
  document.getElementById('progFill').style.width = pct + '%';
}
function setPreset(el, mins) {
  document.querySelectorAll('.preset').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  resetTimer(mins * 60);
}
function resetTimer(secs) {
  clearInterval(state.timer.interval);
  state.timer.running   = false;
  state.timer.total     = secs ?? state.timer.total;
  state.timer.remaining = state.timer.total;
  document.getElementById('startBtn').textContent = 'Start';
  document.getElementById('timerDisplay').className = 't-num idle';
  updateTimerDisplay();
  updateTimerProgress();
  persistState();
}
function toggleTimer() {
  if (state.timer.running) {
    clearInterval(state.timer.interval);
    state.timer.running = false;
    document.getElementById('startBtn').textContent = 'Resume';
    document.getElementById('timerDisplay').className = 't-num idle';
    persistState(); return;
  }
  state.timer.running = true;
  document.getElementById('startBtn').textContent = 'Pause';
  document.getElementById('timerDisplay').className = 't-num running';
  persistState();
  state.timer.interval = setInterval(() => {
    state.timer.remaining--;
    updateTimerDisplay();
    updateTimerProgress();
    persistState();
    if (state.timer.remaining <= 0) {
      clearInterval(state.timer.interval);
      state.timer.running   = false;
      state.timer.remaining = 0;
      document.getElementById('startBtn').textContent = 'Start';
      document.getElementById('timerDisplay').className = 't-num done';
      updateTimerDisplay(); updateTimerProgress();
      showToast('Session complete ✓');
      persistState();
    }
  }, 1000);
}

// ---- INIT ----
function init() {
  const saved = loadSavedState();
  Object.assign(state, {
    ctx: saved.ctx, mins: saved.mins, energy: saved.energy,
    activeSection: saved.activeSection,
    activeEntTag:  saved.activeEntTag,
    activeLangTag: saved.activeLangTag,
    activeLang:    saved.activeLang,
    resources:     saved.resources,
  });
  state.timer.total     = saved.timer.total;
  state.timer.remaining = saved.timer.remaining;
  state.timer.running   = false;

  applySelection('.ctx-btn',  state.ctx,    'ctx');
  applySelection('.time-btn', state.mins,   'mins');
  applySelection('.e-btn',    state.energy, 'energy');
  applySelection('.preset',   Math.round(state.timer.total / 60), 'mins');

  setActiveSection(state.activeSection, false);
  setActiveEntTag(state.activeEntTag, false);
  setActiveLangTag(state.activeLangTag, false);
  updateTimerDisplay();
  updateTimerProgress();
  renderAllLists();
  regen();

  // Context selectors
  document.querySelectorAll('.ctx-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.ctx-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.ctx = btn.dataset.ctx;
    regen(); persistState();
  }));

  document.querySelectorAll('.time-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mins = parseInt(btn.dataset.mins, 10);
    regen(); persistState();
  }));

  document.querySelectorAll('.e-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.e-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.energy = btn.dataset.energy;
    regen(); persistState();
  }));

  document.getElementById('sectionTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    setActiveSection(btn.dataset.tab);
  });

  document.getElementById('entTags')?.addEventListener('click', e => {
    const btn = e.target.closest('.ent-tag');
    if (!btn) return;
    setActiveEntTag(btn.dataset.etag);
  });

  document.getElementById('langTags')?.addEventListener('click', e => {
    const btn = e.target.closest('.lang-tag');
    if (!btn) return;
    setActiveLangTag(btn.dataset.ltag);
  });
}
