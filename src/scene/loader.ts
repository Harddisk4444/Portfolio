/**
 * Decides *when* the WebGL scene may load.
 *
 * The hero ships as static HTML + animated CSS rings, so first paint never waits for WebGL.
 * WebGL setup (context + shaders) costs a long main-thread task, so it is never done
 * during page load: the visitor's first pointer / touch / wheel / scroll / key
 * interaction (after `load`) arms it, and the work itself runs in the next idle period
 * (`requestIdleCallback`, `setTimeout` 1500 ms fallback), never inside the input handler.
 */

import type { SpiritScene } from './SpiritScene';

const TRIGGERS = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'] as const;

export function scheduleSpiritScene(reducedMotion: MediaQueryList): void {
  const host = document.getElementById('top');
  const canvas = document.getElementById('spirit-canvas');
  const anchor = document.getElementById('hero-visual');
  if (!host || !(canvas instanceof HTMLCanvasElement) || !anchor) return;
  if (typeof WebGL2RenderingContext === 'undefined') return; // the CSS rings stay

  let armed = false;
  let scene: SpiritScene | null = null;

  const load = () => {
    import('./SpiritScene')
      .then(({ createSpiritScene }) => createSpiritScene({
        host,
        canvas,
        anchor,
        reducedMotion,
        onReady: () => host.classList.add('scene-ready'),
        onLost: () => host.classList.remove('scene-ready')
      }))
      .then(created => {
        scene = created;
      })
      .catch(() => {
        // No usable WebGL2 (or the chunk failed to load): the static CSS rings remain.
      });
  };

  const arm = () => {
    if (armed) return;
    armed = true;
    TRIGGERS.forEach(t => window.removeEventListener(t, arm));
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 1500 });
    else setTimeout(load, 1500);
  };

  const listen = () => TRIGGERS.forEach(t => window.addEventListener(t, arm, { passive: true }));
  if (document.readyState === 'complete') listen();
  else window.addEventListener('load', listen, { once: true });

  // Free every GPU object when the page is really going away (not on a bfcache freeze).
  window.addEventListener('pagehide', e => {
    if (e.persisted) return;
    scene?.dispose();
    scene = null;
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      scene?.dispose();
      host.classList.remove('scene-ready');
    });
  }
}
