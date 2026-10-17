/**
 * 3D tilt + tracked aura light for every `[data-tilt]` card.
 * One delegated listener, one rAF write per frame, transform-only (no layout shift).
 * Mouse only: touch scrolling must never tilt cards; reduced motion disables it.
 */

export function initTiltCards(reducedMotion: MediaQueryList) {
  let active: HTMLElement | null = null;
  let raf = 0;
  let px = 0;
  let py = 0;

  const apply = () => {
    raf = 0;
    if (!active) return;
    const r = active.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (px - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (py - r.top) / r.height));
    active.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    active.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    active.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`);
    active.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`);
  };

  const release = (card: HTMLElement) => {
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  };

  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || reducedMotion.matches) return;
    const card = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-tilt]') : null;
    if (card !== active) {
      if (active) release(active);
      active = card;
    }
    if (!card) return;
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    if (active) release(active);
    active = null;
  });
}
