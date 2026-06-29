/* ============================================================
   Betterhomes Dubai — Main JS (shared across all pages)
   ============================================================ */

/* --- Nav scroll behaviour --------------------------------- */
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  if (nav.classList.contains('nav--solid')) return;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* --- Hamburger menu --------------------------------------- */
(function () {
  const burger = document.querySelector('.nav__hamburger');
  const mobile = document.querySelector('.nav__mobile');
  if (!burger || !mobile) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobile.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !mobile.contains(e.target)) {
      burger.classList.remove('open');
      mobile.classList.remove('open');
    }
  });
})();

/* --- Active nav link -------------------------------------- */
(function () {
  const links = document.querySelectorAll('.nav__link');
  const path = window.location.pathname;
  links.forEach(l => {
    const href = l.getAttribute('href');
    if (
      (href === 'index.html' && (path === '/' || path.endsWith('index.html') || path === '')) ||
      (href !== 'index.html' && href && path.includes(href.replace('.html', '')))
    ) {
      l.classList.add('active');
    }
  });
})();

/* --- Saved count badge ------------------------------------ */
function updateSavedBadge() {
  const saved = getSaved();
  const counts = document.querySelectorAll('.nav__saved-count');
  counts.forEach(el => {
    el.textContent = saved.length;
    el.classList.toggle('visible', saved.length > 0);
  });
}

/* --- localStorage helpers --------------------------------- */
function getSaved() {
  try { return JSON.parse(localStorage.getItem('bh_saved') || '[]'); }
  catch { return []; }
}
function setSaved(arr) {
  localStorage.setItem('bh_saved', JSON.stringify(arr));
}
function toggleSaved(id) {
  const saved = getSaved();
  const idx = saved.indexOf(id);
  if (idx === -1) { saved.push(id); setSaved(saved); return true; }
  saved.splice(idx, 1); setSaved(saved); return false;
}
function isSaved(id) { return getSaved().includes(id); }

/* --- Compare helpers -------------------------------------- */
function getCompare() {
  try { return JSON.parse(localStorage.getItem('bh_compare') || '[]'); }
  catch { return []; }
}
function setCompare(arr) {
  localStorage.setItem('bh_compare', JSON.stringify(arr.slice(0, 4)));
}
function addToCompare(id) {
  const list = getCompare();
  if (list.includes(id)) return false;
  if (list.length >= 4) { showToast('Maximum 4 properties can be compared at once.'); return false; }
  list.push(id);
  setCompare(list);
  return true;
}

/* --- Toast ------------------------------------------------ */
let toastTimer;
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* --- Scroll-reveal cards ---------------------------------- */
function initCardReveal() {
  const cards = document.querySelectorAll('.property-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = (entry.target.dataset.delay || 0);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((card, i) => {
    card.dataset.delay = i * 100;
    obs.observe(card);
  });
}

/* --- Render a property card ------------------------------- */
function renderCard(prop, options = {}) {
  const saved = isSaved(prop.id);
  const badgeHtml = prop.badge
    ? `<span class="property-card__badge${prop.badgeType === 'gold' ? ' property-card__badge--gold' : ''}">${prop.badge}</span>`
    : '';

  return `
    <div class="property-card" data-id="${prop.id}">
      <div class="property-card__image">
        <img src="${prop.image}" alt="${prop.project} — ${prop.bedsLabel}" loading="lazy">
        ${badgeHtml}
        <button class="property-card__save${saved ? ' saved' : ''}" data-id="${prop.id}" aria-label="Save property" title="Save to Favourites">
          ${saved ? '♥' : '♡'}
        </button>
      </div>
      <div class="property-card__body">
        <div class="property-card__project">${prop.project}</div>
        <h3 class="property-card__title">${prop.bedsLabel} ${prop.type} — Floor ${prop.floor}</h3>
        <div class="property-card__meta">
          <span class="property-card__meta-item">🛏 ${prop.beds === 0 ? 'Studio' : prop.beds + ' Bed'}</span>
          <span class="property-card__meta-item">📐 ${prop.size.toLocaleString()} sqft</span>
          <span class="property-card__meta-item">📍 ${prop.location}</span>
        </div>
        <div class="property-card__price">
          ${formatPrice(prop.price)}
          <span>/ AED ${prop.pricePerSqft.toLocaleString()} per sqft</span>
        </div>
        <div class="property-card__actions">
          <button class="btn btn--ghost btn--sm compare-btn" data-id="${prop.id}">⊞ Compare</button>
          <a href="#" class="btn btn--primary btn--sm">Enquire</a>
        </div>
      </div>
    </div>`;
}

/* --- Save button handlers --------------------------------- */
function bindSaveButtons(container) {
  (container || document).querySelectorAll('.property-card__save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const nowSaved = toggleSaved(id);
      btn.textContent = nowSaved ? '♥' : '♡';
      btn.classList.toggle('saved', nowSaved);
      btn.classList.add('pulse');
      btn.addEventListener('animationend', () => btn.classList.remove('pulse'), { once: true });
      showToast(nowSaved ? 'Added to Saved ♥' : 'Removed from Saved');
      updateSavedBadge();
      if (typeof onSaveToggle === 'function') onSaveToggle(id, nowSaved);
    });
  });
}

/* --- Compare button handlers ------------------------------ */
function bindCompareButtons(container) {
  (container || document).querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const added = addToCompare(id);
      if (added) {
        showToast('Added to Compare — visit the Compare page to view.');
      }
    });
  });
}

/* --- Init ------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  updateSavedBadge();
  initCardReveal();
});
