/**
 * Soul Trials (projects). Clearing a trial grants Soul Power once per visitor.
 */

import { TRIALS } from '../data/trials';
import { GameManager, synth } from '../core/gameEngine';
import { showToast } from './toast';

export function bindTrials(root: HTMLElement, game: GameManager) {
  root.addEventListener('click', e => {
    const btn = e.target instanceof Element ? e.target.closest<HTMLButtonElement>('[data-claim]') : null;
    const trial = TRIALS.find(t => t.id === btn?.dataset.claim);
    if (!trial) return;
    if (game.completeQuest(trial.id)) {
      showToast('Trial cleared', `${trial.title} · +${trial.rewardXP} XP`);
    } else {
      synth.playClick();
    }
  });

  game.onStateChange(state => {
    TRIALS.forEach(trial => {
      const done = state.completedQuests.includes(trial.id);
      const card = root.querySelector<HTMLElement>(`[data-trial="${trial.id}"]`);
      const status = root.querySelector<HTMLElement>(`[data-status="${trial.id}"]`);
      const claim = root.querySelector<HTMLButtonElement>(`[data-claim="${trial.id}"]`);
      card?.classList.toggle('is-cleared', done);
      if (status) status.textContent = done ? 'Trial cleared' : 'Active trial';
      if (claim) claim.textContent = done ? 'Soul power absorbed ✓' : `Clear trial · +${trial.rewardXP} XP`;
    });
  });
}
