/* Scroll-reveal + counter animations. Same `[data-reveal]` contract the
   original site used, re-run after every client-side render. */
import { $$, prefersReducedMotion } from './dom.js';

const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }),
  { threshold: 0.12 }
);

const counterObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterObserver.unobserve(entry.target);
      animateCounter(entry.target);
    }),
  { threshold: 0.6 }
);

function animateCounter(el) {
  const end = Number(el.dataset.count) || 0;
  if (prefersReducedMotion()) {
    el.textContent = end.toLocaleString('en-IN');
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / 1600, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(end * eased).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Observe any freshly rendered reveal/counter targets. */
export function observeReveals(root = document) {
  if (prefersReducedMotion()) {
    $$('[data-reveal]:not(.revealed)', root).forEach((el) => el.classList.add('revealed'));
  } else {
    $$('[data-reveal]:not(.revealed)', root).forEach((el) => revealObserver.observe(el));
  }
  $$('.counter', root).forEach((el) => counterObserver.observe(el));
}
