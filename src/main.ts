/**
 * ggsk.dev — Application Bootstrapper & Main Orchestrator
 * Initializes all components with full null-safe guards.
 * Self-healing: each component is isolated so one failure never cascades.
 */

import { CanvasGrid } from './components/CanvasGrid';
import { Inventory }  from './components/Inventory';
import { QuestBook }  from './components/QuestBook';
import { Terminal }   from './components/Terminal';
import { GameManager, synth } from './core/gameEngine';

function initApp() {
  // Guard against double-init (HMR / deferred re-execution)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any)['__ggsk_initialized']) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)['__ggsk_initialized'] = true;

  // ── 1. Voxel background canvas ─────────────────────────────────────────
  let canvasGrid: CanvasGrid | null = null;
  try {
    if (document.getElementById('voxel-canvas')) {
      canvasGrid = new CanvasGrid('voxel-canvas');
    }
  } catch (err) {
    console.error('[ggsk] CanvasGrid init failed:', err);
  }

  // ── 2. Core game state engine (hard dependency) ─────────────────────────
  let game: GameManager;
  try {
    game = new GameManager();
  } catch (err) {
    console.error('[ggsk] GameManager init failed — aborting bootstrap:', err);
    return;
  }

  // ── 3. Skills Inventory ─────────────────────────────────────────────────
  try {
    if (document.getElementById('skills-inventory')) {
      new Inventory('skills-inventory', game);
    }
  } catch (err) {
    console.error('[ggsk] Inventory init failed:', err);
  }

  // ── 4. Quest Log & Certificates Shelf ──────────────────────────────────
  try {
    if (document.getElementById('quests-list') && document.getElementById('certs-shelf')) {
      new QuestBook('quests-list', 'certs-shelf', 'advancement-toaster', game);
    }
  } catch (err) {
    console.error('[ggsk] QuestBook init failed:', err);
  }

  // ── 5. Command-Block Terminal & Contact Scroll ──────────────────────────
  try {
    if (document.getElementById('terminal-container')) {
      new Terminal('terminal-container', 'terminal-body', 'terminal-input', game);
    }
  } catch (err) {
    console.error('[ggsk] Terminal init failed:', err);
  }

  // ── 6. Persistent HUD (Hearts + XP bar) ────────────────────────────────
  try {
    const heartsEl   = document.getElementById('hud-hearts');
    const levelEl    = document.getElementById('xp-level-badge');
    const xpBarEl    = document.getElementById('xp-progress-bar');

    game.onStateChange(state => {
      // Hearts bar — 10 max
      if (heartsEl) {
        heartsEl.innerHTML = '';
        for (let i = 0; i < 10; i++) {
          const h = document.createElement('div');
          h.className = `mc-heart${i < state.health ? '' : ' empty'}`;
          heartsEl.appendChild(h);
        }
      }

      // Level badge
      if (levelEl) levelEl.textContent = `LVL ${state.level}`;

      // XP progress bar
      if (xpBarEl) {
        const needed  = state.level * 1000;
        const pct     = Math.min(100, (state.xp / needed) * 100);
        xpBarEl.style.width = `${pct}%`;
      }
    });
  } catch (err) {
    console.error('[ggsk] HUD binding failed:', err);
  }

  // ── 7. Navigation: smooth-scroll anchors + XP rewards ──────────────────
  try {
    // "Explore Portfolio" → #skills-section
    document.getElementById('menu-explore')?.addEventListener('click', () => {
      synth.playBreak();
      game.addXP(100);
      showToast('🌍', 'World Joined: ggsk.dev');
    });

    // "Enchanted Credentials" → #projects-section
    document.getElementById('menu-socials')?.addEventListener('click', () => {
      synth.playClick();
    });

    // "Command Block & Contact" → #terminal-section
    document.getElementById('menu-settings')?.addEventListener('click', () => {
      synth.playClick();
    });
  } catch (err) {
    console.error('[ggsk] Nav listeners failed:', err);
  }

  // ── 8. Audio toggle ─────────────────────────────────────────────────────
  try {
    let audioOn = true;
    const btnAudio = document.getElementById('btn-audio-toggle');

    const refreshAudioLabel = () => {
      if (!btnAudio) return;
      btnAudio.innerHTML = audioOn
        ? '<span class="icon-speaker">🔊</span> AUDIO: ON'
        : '<span class="icon-speaker">🔇</span> AUDIO: OFF';
    };

    btnAudio?.addEventListener('click', () => {
      audioOn = !audioOn;
      synth.toggle(audioOn);
      refreshAudioLabel();
      synth.playClick();
    });
  } catch (err) {
    console.error('[ggsk] Audio toggle failed:', err);
  }

  // ── 9. Scroll-down indicator click ─────────────────────────────────────
  try {
    document.querySelector('.scroll-down-indicator')?.addEventListener('click', () => {
      document.getElementById('skills-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  } catch (err) {
    console.error('[ggsk] Scroll indicator failed:', err);
  }

  // ── 10. Graceful shutdown ───────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    try { canvasGrid?.destroy(); } catch { /* noop */ }
  });
}

// ── Inline toast helper (used by nav click before QuestBook is guaranteed alive)
function showToast(icon: string, text: string) {
  const toaster = document.getElementById('advancement-toaster');
  if (!toaster) return;
  toaster.innerHTML = `
    <div class="advancement-icon">${icon}</div>
    <div class="advancement-text">
      <span class="advancement-challenge">Advancement Made!</span>
      <span class="advancement-title">${text}</span>
    </div>
  `;
  toaster.classList.remove('hidden');
  setTimeout(() => toaster.classList.add('hidden'), 4000);
}

// ── Bulletproof bootstrapper ────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // Already parsed (deferred script or module re-evaluation)
  initApp();
}
