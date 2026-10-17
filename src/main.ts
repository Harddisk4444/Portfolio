/**
 * ggsk.dev — bootstrapper.
 * All content is already in the static HTML; this script only adds behaviour.
 * Each widget is isolated so one failure never cascades.
 * The WebGL scene is not imported here: `scheduleSpiritScene` code-splits it.
 */

import { GameManager, synth } from './core/gameEngine';
import { bindHud } from './components/Hud';
import { SkillRings } from './components/SkillRings';
import { bindTrials } from './components/Trials';
import { bindArchive } from './components/Archive';
import { SpiritConsole } from './components/SpiritConsole';
import { initTiltCards } from './components/TiltCards';
import { showToast } from './components/toast';
import { scheduleSpiritScene } from './scene/loader';

const SOUND_KEY = 'ggsk_sound';

function safely(fn: () => void) {
  try {
    fn();
  } catch {
    // A broken widget must not take the rest of the page down.
  }
}

function byId<T extends HTMLElement>(id: string, type: new () => T): T | null {
  const el = document.getElementById(id);
  return el instanceof type ? el : null;
}

function bindSoundToggle() {
  const btn = byId('sound-toggle', HTMLButtonElement);
  const state = btn?.querySelector('.sound-toggle__state');
  if (!btn) return;
  const apply = (on: boolean) => {
    synth.setEnabled(on);
    btn.setAttribute('aria-pressed', String(on));
    if (state) state.textContent = on ? 'On' : 'Off';
  };
  try {
    if (localStorage.getItem(SOUND_KEY) === 'off') apply(false);
  } catch {
    // Storage unavailable: keep the default (on).
  }
  btn.addEventListener('click', () => {
    const on = !synth.isEnabled();
    apply(on);
    try {
      localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
    } catch {
      // Preference is kept for this visit only.
    }
    if (on) synth.playClick();
  });
}

function init() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const game = new GameManager();

  safely(() => bindHud(game));
  safely(() => {
    const list = document.querySelector<HTMLElement>('.skill-rings');
    const panel = byId('skill-detail', HTMLDivElement);
    if (list && panel) new SkillRings(list, panel, game);
  });
  safely(() => {
    const grid = byId('trial-grid', HTMLDivElement);
    if (grid) bindTrials(grid, game);
  });
  safely(() => {
    const shelf = document.querySelector<HTMLElement>('.slip-shelf');
    const lectern = byId('cert-detail-body', HTMLDivElement);
    if (shelf && lectern) bindArchive(shelf, lectern, game, reducedMotion);
  });
  safely(() => {
    const log = byId('terminal-log', HTMLDivElement);
    const form = byId('terminal-form', HTMLFormElement);
    const input = byId('terminal-input', HTMLInputElement);
    if (log && form && input) new SpiritConsole(log, form, input, game, reducedMotion);
  });
  safely(bindSoundToggle);
  safely(() => initTiltCards(reducedMotion));
  safely(() => {
    document.getElementById('nav-skills')?.addEventListener('click', () => {
      game.addXP(100);
      showToast('Martial soul awakened', 'Welcome to ggsk.dev · +100 XP');
    });
  });
  safely(() => scheduleSpiritScene(reducedMotion));
}

init();
