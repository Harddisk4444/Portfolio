/**
 * ggsk.dev Application Bootstrapper & Main Orchestrator
 * Connects Canvas background, game state manager, HUD overlay, and modules.
 */

import { CanvasGrid } from './components/CanvasGrid';
import { Inventory } from './components/Inventory';
import { QuestBook } from './components/QuestBook';
import { Terminal } from './components/Terminal';
import { GameManager, synth } from './core/gameEngine';

function initApp() {
  // Prevent double initialization
  if ((window as any).__ggsk_initialized) return;
  (window as any).__ggsk_initialized = true;

  // 1. Initialize Canvas Background
  let canvasGrid: CanvasGrid | null = null;
  try {
    canvasGrid = new CanvasGrid('voxel-canvas');
  } catch (err) {
    console.error("[ggsk] CanvasGrid initialization failed:", err);
  }

  // 2. Initialize Game Engine
  let game: GameManager;
  try {
    game = new GameManager();
  } catch (err) {
    console.error("[ggsk] GameManager initialization failed:", err);
    return; // Core game engine is a strict dependency
  }

  // 3. Initialize Core UI Components with Zero-Cascading Failures
  let inventory: Inventory | null = null;
  try {
    inventory = new Inventory('skills-inventory', game);
  } catch (err) {
    console.error("[ggsk] Inventory initialization failed:", err);
  }

  try {
    new QuestBook(
      'quests-list',
      'certs-shelf',
      'advancement-toaster',
      game
    );
  } catch (err) {
    console.error("[ggsk] QuestBook initialization failed:", err);
  }
  
  try {
    new Terminal(
      'terminal-container',
      'terminal-body',
      'terminal-input',
      game
    );
  } catch (err) {
    console.error("[ggsk] Terminal initialization failed:", err);
  }

  // 4. Connect Game State to Persistent HUD UI
  try {
    const heartsContainer = document.getElementById('hud-hearts') as HTMLDivElement;
    const levelBadge = document.getElementById('xp-level-badge') as HTMLDivElement;
    const xpProgressBar = document.getElementById('xp-progress-bar') as HTMLDivElement;

    game.onStateChange((state) => {
      // Update Hearts Bar (10 hearts total)
      if (heartsContainer) {
        heartsContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
          const heart = document.createElement('div');
          heart.className = `mc-heart ${i < state.health ? '' : 'empty'}`;
          heartsContainer.appendChild(heart);
        }
      }

      // Update XP & Levels
      if (levelBadge) {
        levelBadge.textContent = `LVL ${state.level}`;
      }
      if (xpProgressBar) {
        const xpNeeded = state.level * 1000;
        const progressPercent = Math.min(100, (state.xp / xpNeeded) * 100);
        xpProgressBar.style.width = `${progressPercent}%`;
      }
    });
  } catch (err) {
    console.error("[ggsk] HUD connection failed:", err);
  }

  // 5. Setup Menu Navigation & General Interactive Events
  
  // Explore Portfolio button - Smooth scroll & block breaking sound
  try {
    const btnExplore = document.getElementById('menu-explore') as HTMLAnchorElement;
    btnExplore?.addEventListener('click', () => {
      synth.playBreak();
      
      // Grant XP for starting adventure
      game.addXP(100);

      // Trigger special welcome achievement toast
      const toaster = document.getElementById('advancement-toaster');
      if (toaster) {
        toaster.innerHTML = `
          <div class="advancement-icon">🌍</div>
          <div class="advancement-text">
            <span class="advancement-challenge">Advancement Made!</span>
            <span class="advancement-title">World Joined: ggsk.dev</span>
          </div>
        `;
        toaster.classList.remove('hidden');
        setTimeout(() => {
          toaster.classList.add('hidden');
        }, 4000);
      }
    });
  } catch (err) {
    console.error("[ggsk] Explore button listener failed:", err);
  }

  // Socials / Enchanted Credentials button - click sound
  try {
    const btnSocials = document.getElementById('menu-socials') as HTMLAnchorElement;
    btnSocials?.addEventListener('click', () => {
      synth.playClick();
    });
  } catch (err) {
    console.error("[ggsk] Socials button listener failed:", err);
  }

  // Command Block / Contact button - click sound
  try {
    const btnSettings = document.getElementById('menu-settings') as HTMLAnchorElement;
    btnSettings?.addEventListener('click', () => {
      synth.playClick();
    });
  } catch (err) {
    console.error("[ggsk] Settings button listener failed:", err);
  }

  // Audio Toggle & Accessibility Settings
  try {
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    let audioOn = true;

    const updateAudioState = (active: boolean) => {
      audioOn = active;
      synth.toggle(audioOn);
      if (btnAudioToggle) {
        btnAudioToggle.innerHTML = audioOn 
          ? '<span class="icon-speaker">🔊</span> AUDIO: ON' 
          : '<span class="icon-speaker">🔇</span> AUDIO: OFF';
      }
    };

    btnAudioToggle?.addEventListener('click', () => {
      updateAudioState(!audioOn);
      synth.playClick();
    });
  } catch (err) {
    console.error("[ggsk] Audio toggle listener failed:", err);
  }

  // Hot-reload/unload safety
  window.addEventListener('beforeunload', () => {
    if (canvasGrid) canvasGrid.destroy();
    if (inventory) inventory.destroy();
  });
}

// Bulletproof app bootstrapper for deferred modules
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
