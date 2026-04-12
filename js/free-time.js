/* ============================================================
   FREE-TIME.JS - Logic for free-time.html
   ============================================================ */

let state = {
  activeSection: 'islam',
  activeSubcategory: 'General',
  resources: {},
  searchQuery: '',
  customCategories: {},
  subcategories: {},
};

const STORAGE_KEY = 'fto_state_v8'; // Fresh start - no built-in categories
const LEGACY_STORAGE_KEYS = ['fto_state_v7', 'fto_state_v6', 'fto_state_v5', 'fto_state_v4'];

document.addEventListener('DOMContentLoaded', () => {
  init();
});

// ---- CATEGORY META ----
const CATEGORY_META = {};

const STARTER_LANGUAGE_RESOURCES = [];

// ---- DEFAULT RESOURCES ----
const defaultResources = {
  islam: [],
  swe: [],
  lang: [],
  ent: [],
};

// ---- STATE PERSISTENCE ----
function getDefaultSnapshot() {
  return {
    activeSection: null,
    activeSubcategory: 'General',
    resources: {},
    searchQuery: '',
    customCategories: {},
    subcategories: {},
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
      // Remove old fields
      delete next.energy;
      delete next.ctx;
      delete next.time;
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
      customCategories: saved.customCategories || {},
      subcategories: saved.subcategories || {},
    };
  } catch {
    return getDefaultSnapshot();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    activeSection: state.activeSection,
    activeSubcategory: state.activeSubcategory,
    resources: state.resources,
    searchQuery: state.searchQuery,
    customCategories: state.customCategories,
    subcategories: state.subcategories,
  }));
}

// ---- HELPERS ----
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

// ---- SEARCH AND FILTER ----
function filterResources(resources, query) {
  if (!query.trim()) return resources;
  const lowerQuery = query.toLowerCase();
  return resources.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    (item.subdivision && item.subdivision.toLowerCase().includes(lowerQuery))
  );
}

// ---- SECTION TABS ----
function setActiveSection(tab, shouldSave = true) {
  if (!tab) return;
  document.querySelectorAll('.tab-btn').forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.res-section').forEach((section) => section.classList.remove('active'));
  const section = document.getElementById('section-' + tab);
  if (section) section.classList.add('active');
  state.activeSection = tab;
  state.activeSubcategory = 'General';
  if (shouldSave) persistState();
  renderResources();
}

// ---- RESOURCE RENDERING ----
function getAvailableSubcategories(category) {
  const fromState = (state.subcategories[category] || []).map(normalizeSubdivisionValue);
  const fromItems = (state.resources[category] || [])
    .map(item => normalizeSubdivisionValue(item.subdivision))
    .filter(Boolean);
  const all = new Set([...fromState, ...fromItems]);
  if (!all.has('General')) all.add('General');
  return [...all].sort();
}

function renderResources() {
  if (!state.activeSection) return;
  const section = state.activeSection;
  const resources = state.resources[section] || [];
  let filtered = filterResources(resources, state.searchQuery);
  const activeSub = state.activeSubcategory || 'General';
  if (activeSub !== 'General') {
    filtered = filtered.filter(item => normalizeSubdivisionValue(item.subdivision) === activeSub);
  }
  const listEl = document.getElementById('list-' + section);
  if (!listEl) return;

  renderSubcategoryButtons(section);

  const visibleSubs = activeSub === 'General'
    ? getAvailableSubcategories(section)
    : [activeSub];

  const groups = visibleSubs.map(sub => ({
    name: sub,
    items: filtered.filter(item => (normalizeSubdivisionValue(item.subdivision) || 'General') === sub),
  }));

  const html = groups.map(group => {
    const subHeader = group.name !== 'General' ? `<div class="subcategory-header">${escHtml(group.name)}</div>` : '';
    const itemsHtml = group.items.map(item => {
      const topic = getTopicSummary({ ...item, _cat: section });
      const url = item.url ? `href="${escHtml(item.url)}" target="_blank" rel="noopener"` : '';
      const openBtn = item.url
        ? `<a class="res-open-btn" ${url}>Open ↗</a>`
        : `<span class="res-open-btn" style="opacity:0.5; cursor:not-allowed;">No URL</span>`;

      return `<div class="res-item">
        <div class="res-item-dot" style="background:${topic.accent}"></div>
        <div class="res-item-info">
          <div class="res-item-name">${escHtml(item.name)}</div>
          <div class="res-item-meta">${escHtml(topic.topic)}</div>
        </div>
        <div class="res-item-actions">
          ${openBtn}
          <button class="res-del-btn" onclick="deleteResource('${item.id}', '${section}')">×</button>
        </div>
      </div>`;
    }).join('');

    if (!itemsHtml) {
      if (group.name === 'General') {
        return `<div class="subcategory-header">${escHtml(group.name)}</div><div class="empty-subcategory">No items in this section yet.</div>`;
      }
      return '';
    }

    return subHeader + itemsHtml;
  }).join('');

  listEl.innerHTML = html;

  if (filtered.length === 0 && resources.length > 0) {
    listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No resources match your search.</div>';
  } else if (resources.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No resources yet. Add some below!</div>';
  }
}

// ---- MODAL FUNCTIONS ----
function openAddModal(category) {
  state.addingFor = category;
  const meta = CATEGORY_META[category];
  document.getElementById('modalTitle').textContent = `Add ${meta.label} Resource`;
  document.getElementById('modalSub').textContent = `This will be added to your ${meta.label.toLowerCase()} collection.`;

  document.getElementById('resName').value = '';
  document.getElementById('resUrl').value = '';
  const select = document.getElementById('resSubcategory');
  select.innerHTML = getAvailableSubcategories(category)
    .map((sub) => `<option value="${escHtml(sub)}">${escHtml(sub)}</option>`)
    .join('');
  select.value = 'General';

  document.getElementById('addOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('addOverlay').classList.remove('open');
  state.addingFor = null;
}

function overlayClose(event) {
  if (event.target.id === 'addOverlay') closeModal();
  if (event.target.id === 'addCategoryOverlay') closeCategoryModal();
}

function saveResource() {
  const name = document.getElementById('resName').value.trim();
  const url = document.getElementById('resUrl').value.trim();
  const subcategory = document.getElementById('resSubcategory').value;
  if (!name) {
    showToast('Please enter a name');
    return;
  }

  const category = state.addingFor;
  if (!state.resources[category]) state.resources[category] = [];

  const newItem = {
    id: Date.now().toString(),
    name,
    url: url || null,
    subdivision: subcategory === 'General' ? null : subcategory,
  };

  state.resources[category].push(newItem);
  persistState();
  renderResources();
  closeModal();
  showToast('Resource added!');
}

function openAddCategoryModal() {
  document.getElementById('categoryName').value = '';
  document.getElementById('addCategoryOverlay').classList.add('open');
}

function closeCategoryModal() {
  document.getElementById('addCategoryOverlay').classList.remove('open');
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  if (!name) {
    showToast('Please enter a category name');
    return;
  }

  const slug = slugify(name);
  if (CATEGORY_META[slug]) {
    showToast('Category already exists');
    return;
  }

  const meta = {
    color: 'var(--accent)', // Default color
    short: name.substring(0, 2).toUpperCase(),
    label: name,
  };

  // Add to meta
  CATEGORY_META[slug] = meta;
  state.customCategories[slug] = meta;

  addCategoryTab(slug, name);

  // Initialize resources and subcategories
  if (!state.resources[slug]) state.resources[slug] = [];
  if (!state.subcategories[slug]) state.subcategories[slug] = [];

  persistState();
  closeCategoryModal();
  showToast('Category added!');
}

function addSubcategory(category, name) {
  const value = normalizeSubdivisionValue(name);
  if (!value) return;
  if (!state.subcategories[category]) state.subcategories[category] = [];
  if (state.subcategories[category].includes(value)) {
    showToast('Subcategory already exists');
    return;
  }
  state.subcategories[category].push(value);
  persistState();
  renderResources();
  showToast('Subcategory added!');
}

function setActiveSubcategory(category, subcategory) {
  state.activeSubcategory = subcategory || 'General';
  persistState();
  renderSubcategoryButtons(category);
  renderResources();
}

function renderSubcategoryButtons(category) {
  const row = document.getElementById('subcats-' + category);
  if (!row) return;
  const available = getAvailableSubcategories(category);
  row.innerHTML = available.map((sub) => `
    <div class="subcat-btn-wrapper">
      <button class="subcat-btn ${state.activeSubcategory === sub ? 'active' : ''}"
        type="button"
        data-category="${escHtml(category)}"
        data-sub="${escHtml(sub)}">
        ${escHtml(sub)}
      </button>
      ${sub !== 'General' ? `<button class="subcat-del-btn" type="button" data-category="${escHtml(category)}" data-sub="${escHtml(sub)}" title="Delete">×</button>` : ''}
    </div>
  `).join('');
}

function deleteResource(id, category) {
  state.resources[category] = state.resources[category].filter(item => item.id !== id);
  persistState();
  renderResources();
  showToast('Resource deleted');
}

function deleteSubcategory(category, subcategory) {
  if (subcategory === 'General') {
    showToast('Cannot delete General');
    return;
  }
  if (!confirm(`Delete \"${subcategory}\" and all its resources?`)) return;
  
  // Remove subcategory from list
  if (!state.subcategories[category]) state.subcategories[category] = [];
  state.subcategories[category] = state.subcategories[category].filter(s => s !== subcategory);
  
  // Delete all resources in this subcategory
  if (state.resources[category]) {
    state.resources[category] = state.resources[category].filter(item => 
      normalizeSubdivisionValue(item.subdivision) !== subcategory
    );
  }
  
  if (state.activeSubcategory === subcategory) {
    state.activeSubcategory = 'General';
  }
  persistState();
  renderResources();
  showToast('Subcategory and its resources deleted');
}

function deleteCategory(slug) {
  if (!CATEGORY_META[slug]) {
    showToast('Category not found');
    return;
  }
  const label = CATEGORY_META[slug].label;
  if (!confirm(`Delete "${label}" and all its resources?`)) return;
  
  delete CATEGORY_META[slug];
  delete state.customCategories[slug];
  delete state.resources[slug];
  delete state.subcategories[slug];
  
  const tabWrapper = document.querySelector(`button[data-tab="${slug}"]`)?.closest('div');
  if (tabWrapper) tabWrapper.remove();
  const section = document.getElementById('section-' + slug);
  if (section) section.remove();
  
  if (state.activeSection === slug) {
    state.activeSection = 'islam';
  }
  persistState();
  setActiveSection(state.activeSection, false);
  showToast(`${label} deleted`);
}

// ---- SEARCH ----
function handleSearch() {
  const query = document.getElementById('searchInput').value;
  state.searchQuery = query;
  renderResources();
}

function handleSubcategoryActions(event) {
  const addButton = event.target.closest('.subcat-add-btn');
  if (addButton) {
    const manager = addButton.closest('.subcat-inline');
    const input = manager.querySelector('.subcat-input');
    addSubcategory(manager.dataset.category, input.value);
    input.value = '';
    return;
  }

  const filterButton = event.target.closest('.subcat-btn');
  if (filterButton) {
    setActiveSubcategory(filterButton.dataset.category, filterButton.dataset.sub);
    return;
  }

  const delButton = event.target.closest('.subcat-del-btn');
  if (delButton) {
    deleteSubcategory(delButton.dataset.category, delButton.dataset.sub);
    return;
  }

  const catDelButton = event.target.closest('.tab-del-btn');
  if (catDelButton) {
    deleteCategory(catDelButton.dataset.tab);
  }
}

// ---- TOAST ----
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---- INIT ----
function init() {
  const saved = loadSavedState();
  state = { ...state, ...saved };

  // Restore custom categories
  Object.entries(state.customCategories).forEach(([slug, meta]) => {
    CATEGORY_META[slug] = meta;
    addCategoryTab(slug, meta.label);
  });

  // Set up event listeners
  document.getElementById('sectionTabs')?.addEventListener('click', (event) => {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    setActiveSection(btn.dataset.tab);
  });

  document.getElementById('searchInput')?.addEventListener('input', handleSearch);
  document.querySelector('.app')?.addEventListener('click', handleSubcategoryActions);
  document.getElementById('sections-container')?.addEventListener('click', handleSubcategoryActions);

  // Initial render - only if there are categories
  if (state.activeSection && Object.keys(CATEGORY_META).length > 0) {
    setActiveSection(state.activeSection, false);
  }
}

function addCategoryTab(slug, label) {
  const tabsEl = document.getElementById('sectionTabs');
  const newTab = document.createElement('button');
  newTab.className = 'tab-btn';
  newTab.dataset.tab = slug;
  newTab.textContent = label;
  const tabWrapper = document.createElement('div');
  tabWrapper.style.display = 'flex';
  tabWrapper.style.alignItems = 'center';
  tabWrapper.style.gap = '4px';
  tabWrapper.appendChild(newTab);
  
  const delBtn = document.createElement('button');
  delBtn.className = 'tab-del-btn';
  delBtn.dataset.tab = slug;
  delBtn.textContent = '×';
  delBtn.title = 'Delete category';
  tabWrapper.appendChild(delBtn);
  
  tabsEl.insertBefore(tabWrapper, document.querySelector('.add-category-btn'));

  // Add section
  const containerEl = document.getElementById('sections-container');
  const newSection = document.createElement('div');
  newSection.className = 'res-section';
  newSection.id = 'section-' + slug;
  newSection.innerHTML = `
    <div class="section-toolbar">
      <div class="subcat-row" id="subcats-${slug}"></div>
      <div class="subcat-inline" data-category="${slug}">
        <input class="subcat-input" type="text" placeholder="Create new subcategory">
        <button class="subcat-add-btn">Add</button>
      </div>
    </div>
    <div class="res-list" id="list-${slug}"></div>
    <button class="add-res-btn" onclick="openAddModal('${slug}')">+ Add ${label} Resource</button>
  `;
  containerEl.appendChild(newSection);
  
  // Set as active if it's the first one
  if (!state.activeSection) {
    setActiveSection(slug, false);
  }
}

