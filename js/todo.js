/* ============================================================
   TODO.JS — Logic for todo.html
   ============================================================ */

// ---- STATE ----
let currentTab   = 'today';
let currentPrio  = 'low';
let currentSort  = 'manual';
let editingId    = null;
let editPrio     = 'low';
let alldayOpen   = true;
let dragSrc      = null;

// ---- STORAGE ----
const KEYS = {
  today:    'focus_today',
  tomorrow: 'focus_tomorrow',
  future:   'focus_future',
  allday:   'focus_allday',
};

function load(tab) {
  try { return JSON.parse(localStorage.getItem(KEYS[tab])) || []; }
  catch { return []; }
}
function save(tab, tasks) {
  localStorage.setItem(KEYS[tab], JSON.stringify(tasks));
}

// ---- DATE ----
function updateDate() {
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('dateLabel').textContent =
    new Date().toLocaleDateString(undefined, opts);
}

// ---- TAB ----
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('alldaySection').style.display =
    (tab === 'today') ? '' : 'none';
  const labels = { today: 'Today', tomorrow: 'Tomorrow', future: 'Future', allday: 'Fixed Daily' };
  document.getElementById('sectionLabel').textContent = labels[tab];
  renderTasks();
}

// ---- PRIORITY ----
function selectPrio(p) {
  currentPrio = p;
  document.querySelectorAll('#priorityRow .prio-chip').forEach(c =>
    c.classList.toggle('selected', c.dataset.prio === p));
}
function selectEditPrio(p) {
  editPrio = p;
  document.querySelectorAll('#editModal .prio-chip').forEach(c =>
    c.classList.toggle('selected', c.dataset.prio === p));
}

// ---- ADD ----
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function addTask() {
  const input = document.getElementById('addInput');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }
  const tasks = load(currentTab);
  tasks.unshift({ id: genId(), text, prio: currentPrio, done: false, ts: Date.now() });
  save(currentTab, tasks);
  input.value = '';
  input.focus();
  renderTasks();
  updateBadges();
}

function handleAddKey(e) { if (e.key === 'Enter') addTask(); }

// ---- TOGGLE DONE ----
function toggleDone(tab, id) {
  const tasks = load(tab);
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  save(tab, tasks);
  renderTasks();
  updateBadges();
  updateProgress();
}

// ---- DELETE ----
function deleteTask(tab, id) {
  save(tab, load(tab).filter(x => x.id !== id));
  renderTasks();
  updateBadges();
  updateProgress();
}

// ---- CLEAR DONE ----
function clearCompleted() {
  save(currentTab, load(currentTab).filter(x => !x.done));
  renderTasks();
  updateBadges();
  updateProgress();
}

// ---- EDIT MODAL ----
function openEdit(tab, id) {
  const t = load(tab).find(x => x.id === id);
  if (!t) return;
  editingId = id;
  editPrio  = t.prio || 'low';
  document.getElementById('editInput').value = t.text;
  document.querySelectorAll('#editModal .prio-chip').forEach(c =>
    c.classList.toggle('selected', c.dataset.prio === editPrio));
  document.getElementById('editModal').classList.add('open');
  setTimeout(() => document.getElementById('editInput').focus(), 220);
}
function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
  editingId = null;
}
function closeModal(e) {
  if (e.target === document.getElementById('editModal')) closeEditModal();
}
function handleEditKey(e) {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
}
function saveEdit() {
  const text = document.getElementById('editInput').value.trim();
  if (!text || !editingId) return;
  const tasks = load(currentTab);
  const t = tasks.find(x => x.id === editingId);
  if (t) { t.text = text; t.prio = editPrio; }
  save(currentTab, tasks);
  closeEditModal();
  renderTasks();
}

// ---- SORT ----
function setSort(s) {
  currentSort = s;
  document.querySelectorAll('.sort-chip').forEach(c =>
    c.classList.toggle('active', c.dataset.sort === s));
  renderTasks();
}
function sortedTasks(tasks) {
  if (currentSort === 'priority') {
    const order = { high: 0, mid: 1, low: 2 };
    return [...tasks].sort((a, b) => (order[a.prio] ?? 2) - (order[b.prio] ?? 2));
  }
  if (currentSort === 'time') {
    return [...tasks].sort((a, b) => a.ts - b.ts);
  }
  return tasks;
}

// ---- ALL DAY ----
function toggleAllday() {
  alldayOpen = !alldayOpen;
  document.getElementById('alldayBody').classList.toggle('collapsed', !alldayOpen);
  document.getElementById('alldayToggleIcon').innerHTML = alldayOpen ? '&#9650;' : '&#9660;';
}

function renderAllday() {
  const tasks = load('allday');
  const list  = document.getElementById('alldayList');
  document.getElementById('badge-allday').textContent = tasks.length;
  if (!tasks.length) {
    list.innerHTML = '<div style="color:var(--text-dim);font-size:0.75rem;padding:8px 0">No fixed tasks. Use the Fixed tab to add them.</div>';
    return;
  }
  list.innerHTML = tasks.map(t => `
    <div class="allday-item">
      <div class="task-check" onclick="toggleDoneAllday('${t.id}')">
        <svg width="10" height="8" viewBox="0 0 10 8">
          <polyline points="1,4 4,7 9,1" fill="none" stroke="#0e0e0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="allday-item-text${t.done ? ' done' : ''}">${escHtml(t.text)}</span>
    </div>
  `).join('');
}

function toggleDoneAllday(id) {
  const tasks = load('allday');
  const t = tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; save('allday', tasks); }
  renderAllday();
  updateProgress();
}

// ---- RENDER TASKS ----
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function renderTasks() {
  const tab = currentTab;
  const q   = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  let tasks = load(tab);
  if (q) tasks = tasks.filter(t => t.text.toLowerCase().includes(q));
  const sorted = sortedTasks(tasks);
  const list   = document.getElementById('taskList');

  if (!sorted.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-big">—</div>
        <p>${q ? 'Nothing found.' : 'All clear.'}</p>
      </div>`;
    updateStats(tasks);
    return;
  }

  list.innerHTML = sorted.map(t => `
    <div class="task-item${t.done ? ' completed' : ''}" data-prio="${t.prio || 'low'}" data-id="${t.id}" draggable="true">
      <div class="task-check" onclick="toggleDone('${tab}','${t.id}')" title="Toggle done">
        <svg width="10" height="8" viewBox="0 0 10 8">
          <polyline points="1,4 4,7 9,1" fill="none" stroke="#0e0e0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="task-body">
        <div class="task-text">${escHtml(t.text)}</div>
        <div class="task-meta">
          <span class="task-time">${fmtTime(t.ts)}</span>
          ${t.prio && t.prio !== 'low' ? `<span class="task-prio-label ${t.prio}">${t.prio}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn" onclick="openEdit('${tab}','${t.id}')" title="Edit">✎</button>
        <button class="task-action-btn delete" onclick="deleteTask('${tab}','${t.id}')" title="Delete">✕</button>
      </div>
    </div>
  `).join('');

  // Drag-and-drop (manual sort only)
  if (currentSort === 'manual') {
    list.querySelectorAll('.task-item').forEach(el => {
      el.addEventListener('dragstart', e => {
        dragSrc = el;
        setTimeout(() => el.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend',  () => el.classList.remove('dragging'));
      el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
      el.addEventListener('dragleave',() => el.classList.remove('drag-over'));
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('drag-over');
        if (!dragSrc || dragSrc === el) return;
        const allTasks = load(tab);
        const si = allTasks.findIndex(x => x.id === dragSrc.dataset.id);
        const di = allTasks.findIndex(x => x.id === el.dataset.id);
        if (si < 0 || di < 0) return;
        const [moved] = allTasks.splice(si, 1);
        allTasks.splice(di, 0, moved);
        save(tab, allTasks);
        renderTasks();
      });
    });
  }

  updateStats(tasks);
}

// ---- STATS / PROGRESS ----
function updateStats(tasks) {
  const done = tasks.filter(t => t.done).length;
  const left = tasks.filter(t => !t.done).length;
  document.getElementById('statDone').textContent  = done;
  document.getElementById('statLeft').textContent  = left;
  document.getElementById('statTotal').textContent = tasks.length;
  updateProgress();
}

function updateProgress() {
  const tasks  = load('today');
  const allday = load('allday');
  const all    = [...tasks, ...allday];
  const total  = all.length;
  const done   = all.filter(t => t.done).length;
  const pct    = total ? Math.round((done / total) * 100) : 0;
  const circ   = 138;
  document.getElementById('progressFill').style.strokeDashoffset = circ - (circ * pct / 100);
  document.getElementById('progressCount').textContent = pct + '%';
}

function updateBadges() {
  ['today', 'tomorrow', 'future', 'allday'].forEach(tab => {
    const undone = load(tab).filter(t => !t.done).length;
    document.getElementById('badge-' + tab).textContent = undone;
  });
}

// ---- MIDNIGHT ROLLOVER ----
function checkRollover() {
  const lastKey = 'focus_last_date';
  const today   = new Date().toDateString();
  const last    = localStorage.getItem(lastKey);
  if (last && last !== today) {
    const tomorrow = load('tomorrow');
    const todayTasks = load('today');
    save('today', [...tomorrow, ...todayTasks]);
    save('tomorrow', []);
    save('allday', load('allday').map(t => ({ ...t, done: false })));
  }
  localStorage.setItem(lastKey, today);
}

// ---- REMINDERS — HORIZONTAL SCROLL ----
const REMINDERS_KEY = 'focus_reminders';

function loadReminders() {
  try { return JSON.parse(localStorage.getItem(REMINDERS_KEY)) || []; }
  catch { return []; }
}
function saveReminders(r) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(r));
}

function renderReminders() {
  const reminders = loadReminders();
  const track     = document.getElementById('remindersTrack');
  const wrap      = document.getElementById('remindersTrackWrap');
  const countEl   = document.getElementById('remindersCount');

  if (countEl) countEl.textContent = reminders.length;

  if (!reminders.length) {
    track.innerHTML = '<div class="reminders-empty">No reminders yet.</div>';
    updateScrollHint(wrap, track);
    return;
  }

  track.innerHTML = reminders.map(r => `
    <div class="reminder-card" id="rem-${r.id}">
      <button class="reminder-dismiss" onclick="deleteReminder('${r.id}')" title="Dismiss">✕</button>
      <div class="reminder-card-text">${escHtml(r.text)}</div>
      <div class="reminder-card-time">${fmtTime(r.ts)}</div>
    </div>
  `).join('');

  // Update overflow/scroll hint after DOM paint
  requestAnimationFrame(() => updateScrollHint(wrap, track));
}

function updateScrollHint(wrap, track) {
  if (!wrap || !track) return;
  const hasOverflow = track.scrollWidth > track.clientWidth + 4;
  const atEnd       = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
  wrap.classList.toggle('has-overflow', hasOverflow);
  wrap.classList.toggle('at-end',       !hasOverflow || atEnd);
}

function toggleReminderInput() {
  const inline = document.getElementById('reminderAddInline');
  const isOpen = inline.classList.contains('open');
  if (isOpen) {
    closeReminderInput();
  } else {
    inline.classList.add('open');
    document.getElementById('remindersAddBtn').textContent = '− Cancel';
    setTimeout(() => document.getElementById('reminderInput').focus(), 50);
  }
}

function closeReminderInput() {
  const inline = document.getElementById('reminderAddInline');
  inline.classList.remove('open');
  document.getElementById('reminderInput').value = '';
  document.getElementById('remindersAddBtn').textContent = '+ Add';
}

function addReminder() {
  const input = document.getElementById('reminderInput');
  const text  = input.value.trim();
  if (!text) { input.focus(); return; }
  const reminders = loadReminders();
  reminders.unshift({ id: genId(), text, done: false, ts: Date.now() });
  saveReminders(reminders);
  closeReminderInput();
  renderReminders();
}

function deleteReminder(id) {
  const card = document.getElementById('rem-' + id);
  const doDelete = () => {
    saveReminders(loadReminders().filter(r => r.id !== id));
    renderReminders();
  };
  if (card) {
    card.classList.add('dismissing');
    card.addEventListener('animationend', doDelete, { once: true });
  } else {
    doDelete();
  }
}

function handleReminderKey(e) {
  if (e.key === 'Enter')  addReminder();
  if (e.key === 'Escape') closeReminderInput();
}

// ---- INIT ----
function init() {
  checkRollover();
  updateDate();
  updateBadges();
  renderReminders();
  renderAllday();
  renderTasks();
  updateProgress();

  // Scroll hint tracking
  const track = document.getElementById('remindersTrack');
  const wrap  = document.getElementById('remindersTrackWrap');
  if (track && wrap) {
    track.addEventListener('scroll', () => updateScrollHint(wrap, track));
    window.addEventListener('resize', () => updateScrollHint(wrap, track));
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
    }
    if (e.key === 'Escape') {
      document.getElementById('searchInput').value = '';
      document.getElementById('searchInput').blur();
      renderTasks();
    }
  });
}

init();
