/**
 * Advancement toast — a polite live region, so screen readers hear it too.
 */

import { sanitizeHTML } from '../core/security';

let timer = 0;

export function showToast(title: string, detail: string) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = `
    <span class="toast__seal" aria-hidden="true"></span>
    <span class="toast__text">
      <span class="toast__title">${sanitizeHTML(title)}</span>
      <span class="toast__detail">${sanitizeHTML(detail)}</span>
    </span>`;
  el.classList.add('is-visible');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove('is-visible'), 4000);
}
