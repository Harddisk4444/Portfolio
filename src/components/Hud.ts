/**
 * Persistent HUD: Soul Power level, XP to the next ring, earned rings and vitality.
 * Widths are fixed in CSS, so state restored from storage never shifts layout.
 */

import { GameManager, MAX_HEALTH, xpForLevel } from '../core/gameEngine';

// Rings are earned in the canonical order of a soul master's progression.
const RING_ORDER = ['r10', 'r100', 'r100', 'r1k', 'r1k', 'r10k', 'r10k', 'r100k', 'r1m'];

export function bindHud(game: GameManager) {
  const level = document.getElementById('hud-level');
  const xpBar = document.getElementById('hud-xp');
  const xpFill = document.getElementById('hud-xp-fill');
  const rings = document.getElementById('hud-rings');
  const beads = document.getElementById('hud-beads');
  const vitality = document.getElementById('hud-vitality-text');

  game.onStateChange(state => {
    const needed = xpForLevel(state.level);
    if (level) level.textContent = String(state.level);
    if (xpBar) {
      xpBar.setAttribute('aria-valuemax', String(needed));
      xpBar.setAttribute('aria-valuenow', String(state.xp));
      xpBar.setAttribute('aria-valuetext', `${state.xp} of ${needed} XP`);
    }
    if (xpFill) xpFill.style.transform = `scaleX(${Math.min(1, state.xp / needed).toFixed(3)})`;

    if (rings) {
      const earned = Math.min(RING_ORDER.length, state.level - 1);
      rings.innerHTML = RING_ORDER.slice(0, earned).map(t => `<span class="hud__ring tier-${t}"></span>`).join('');
    }
    if (beads) {
      beads.querySelectorAll('span').forEach((bead, i) => bead.classList.toggle('is-empty', i >= state.health));
    }
    if (vitality) vitality.textContent = `${state.health} of ${MAX_HEALTH}`;
  });
}
