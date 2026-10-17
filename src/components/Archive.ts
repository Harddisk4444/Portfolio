/**
 * Spirit Bone Archive — a shelf of jade slips (certificates) and one reading lectern.
 */

import { CERTS } from '../data/certs';
import { renderCertDetail } from '../render/markup';
import { GameManager, synth } from '../core/gameEngine';
import { showToast } from './toast';

export function bindArchive(shelf: HTMLElement, lecternBody: HTMLElement, game: GameManager, reducedMotion: MediaQueryList) {
  let activeId = shelf.querySelector<HTMLElement>('[aria-current="true"]')?.dataset.cert ?? null;
  const narrow = window.matchMedia('(max-width: 959px)');

  shelf.addEventListener('click', e => {
    const btn = e.target instanceof Element ? e.target.closest<HTMLButtonElement>('button[data-cert]') : null;
    const cert = CERTS.find(c => c.id === btn?.dataset.cert);
    if (!btn || !cert) return;
    synth.playClick();

    if (cert.id !== activeId) {
      const previous = activeId ? shelf.querySelector<HTMLElement>(`[data-cert="${activeId}"]`) : null;
      previous?.classList.remove('is-open');
      previous?.removeAttribute('aria-current');
      btn.classList.add('is-open');
      btn.setAttribute('aria-current', 'true');
      lecternBody.innerHTML = renderCertDetail(cert);
      activeId = cert.id;
      // On one-column layouts the lectern sits below the shelf: bring it into view.
      if (narrow.matches) {
        lecternBody.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
      }
    }

    if (game.readCert(cert.id)) showToast('Credential discovered', cert.title);
  });
}
