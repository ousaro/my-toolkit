/* ============================================================
   SHARED.JS — Utilities used across all pages
   ============================================================ */

/** Show a toast notification */
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

/** Mark the correct nav link as active based on current page */
function initNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav-link').forEach(link => {
    const href = link.getAttribute('href').replace('./', '');
    link.classList.toggle('active', href === current);
  });
}

document.addEventListener('DOMContentLoaded', initNav);
