// Site-wide progressive enhancement (§3.4). Loaded as a deferred module.
// Budget: all site-wide JS ≤ 5 KB gzipped (checked by scripts/verify-dist.mjs).
// Nothing here is required to read or use the site.

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionSwitch = document.getElementById('motion-pause') as HTMLInputElement | null;

const motionOff = () => reducedMotion.matches || root.dataset.motion === 'paused' || Boolean(motionSwitch?.checked);

// ---- "Pause animations": sync with the pre-paint state and persist changes ----
if (motionSwitch) {
  if (root.dataset.motion === 'paused') motionSwitch.checked = true;
  motionSwitch.addEventListener('change', () => {
    const paused = motionSwitch.checked;
    if (paused) root.dataset.motion = 'paused';
    else delete root.dataset.motion;
    try {
      if (paused) localStorage.setItem('motion', 'paused');
      else localStorage.removeItem('motion');
    } catch {
      // Storage blocked: the switch still works for this page view.
    }
  });
}

// ---- Mouse-tracking spotlight on cards (fine pointers only) ----
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let card: HTMLElement | null = null;
  let x = 0;
  let y = 0;
  let frame = 0;
  const leave = () => {
    card?.removeAttribute('data-spot');
    card = null;
  };
  document.addEventListener(
    'pointermove',
    (event) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>('.card') ?? null;
      if (target !== card) {
        leave();
        card = target;
      }
      if (!card) return;
      x = event.clientX;
      y = event.clientY;
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        // CSSOM custom properties: no style attribute in the HTML, CSP-safe.
        card.style.setProperty('--spot-x', `${x - rect.left}px`);
        card.style.setProperty('--spot-y', `${y - rect.top}px`);
        card.setAttribute('data-spot', '');
      });
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', leave);
}

// ---- Entrance reveal: only content below the fold; visible by default ----
if (!motionOff() && 'IntersectionObserver' in window) {
  const pending = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  const observer = new IntersectionObserver(
    (entries) => {
      let batch = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        if (batch > 0) el.classList.add(`reveal-d${Math.min(batch, 5)}`);
        el.classList.add('reveal-in');
        el.classList.remove('reveal-pending');
        batch++;
      }
    },
    { threshold: 0.15 },
  );
  for (const el of pending) {
    el.classList.add('reveal-pending');
    observer.observe(el);
  }
}

// ---- Mobile menu: Esc, outside click and link click close it ----
for (const menu of document.querySelectorAll<HTMLDetailsElement>('details[data-menu]')) {
  const toggle = menu.querySelector('summary');
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      toggle?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
  });
  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) menu.open = false;
  });
}
