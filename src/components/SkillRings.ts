/**
 * Martial Soul skills — five spirit-ring buttons driving one detail panel.
 * Every detail view is already in the static HTML (stacked in one grid cell), so
 * switching views is a visibility toggle: no re-render, no layout shift on hover.
 */

import { SKILLS } from '../data/skills';
import { GameManager, synth } from '../core/gameEngine';

export class SkillRings {
  private current: string;

  constructor(private list: HTMLElement, private panel: HTMLElement, private game: GameManager) {
    this.current = list.querySelector<HTMLElement>('[aria-current="true"]')?.dataset.skill ?? SKILLS[0].id;
    this.panel.dataset.tier = this.tierOf(this.current);

    list.addEventListener('click', e => {
      const btn = this.buttonFrom(e.target);
      if (!btn?.dataset.skill) return;
      this.show(btn.dataset.skill);
      synth.playClick();
      this.game.addXP(50);
    });

    // Desktop hover and keyboard focus preview a ring without granting XP.
    list.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const id = this.buttonFrom(e.target)?.dataset.skill;
      if (id) this.show(id);
    });
    list.addEventListener('focusin', e => {
      const id = this.buttonFrom(e.target)?.dataset.skill;
      if (id) this.show(id);
    });
  }

  private buttonFrom(target: EventTarget | null): HTMLButtonElement | null {
    return target instanceof Element ? target.closest<HTMLButtonElement>('button[data-skill]') : null;
  }

  private tierOf(id: string): string {
    return SKILLS.find(s => s.id === id)?.ring ?? '';
  }

  private show(id: string) {
    if (id === this.current) return;
    this.current = id;
    this.list.querySelectorAll<HTMLButtonElement>('button[data-skill]').forEach(b => {
      if (b.dataset.skill === id) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    this.panel.querySelectorAll<HTMLElement>('[data-view]').forEach(v => {
      v.hidden = v.dataset.view !== id;
    });
    this.panel.dataset.tier = this.tierOf(id);
  }
}
