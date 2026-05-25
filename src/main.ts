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
      'modal-container',
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
      'modal-container',
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
  
  // Explore Portfolio button - Minecraft world-loading transition
  try {
    const btnExplore = document.getElementById('menu-explore') as HTMLButtonElement;
    const portfolioWorld = document.getElementById('portfolio-world');
    const hudWorld = document.getElementById('hud-world');

    btnExplore?.addEventListener('click', () => {
      // Play block breaking sound representing world initialization
      synth.playBreak();
      
      // Animate button text representing classic load state
      btnExplore.disabled = true;
      btnExplore.textContent = "Generating World...";
      
      setTimeout(() => {
        // Reveal game world
        portfolioWorld?.classList.remove('hidden-world');
        hudWorld?.classList.remove('hidden-world');
        
        // Satisfying ding
        synth.playLevelUp();
        
        // Smooth scroll to the main skills section
        const target = document.getElementById('skills-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Reset button
        btnExplore.disabled = false;
        btnExplore.textContent = "Explore Portfolio";
        
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
      }, 1000);
    });
  } catch (err) {
    console.error("[ggsk] Explore button click listener registration failed:", err);
  }

  // Socials & Contact Menu button - Opens the direct transmission scroll
  try {
    const btnSocials = document.getElementById('menu-socials');
    const portfolioWorld = document.getElementById('portfolio-world');
    const hudWorld = document.getElementById('hud-world');

    btnSocials?.addEventListener('click', () => {
      synth.playClick();
      
      // If the world is hidden, reveal it first so that the terminal section becomes visible and focusable
      if (portfolioWorld?.classList.contains('hidden-world')) {
        portfolioWorld.classList.remove('hidden-world');
        hudWorld?.classList.remove('hidden-world');
      }

      // Simulate terminal call to summon contact scroll
      const terminalInput = document.getElementById('terminal-input') as HTMLInputElement;
      if (terminalInput) {
        terminalInput.value = '/contact';
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        terminalInput.dispatchEvent(enterEvent);
        
        setTimeout(() => {
          const target = document.getElementById('terminal-section');
          target?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    });
  } catch (err) {
    console.error("[ggsk] Socials button click listener registration failed:", err);
  }

  // Audio Toggle & Accessibility Settings Menu Button
  try {
    const btnSettings = document.getElementById('menu-settings');
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

    btnSettings?.addEventListener('click', () => {
      synth.playClick();
      // Highlight audio accessibility controls
      btnAudioToggle?.focus();
      btnAudioToggle?.classList.add('pulse-highlight');
      setTimeout(() => {
        btnAudioToggle?.classList.remove('pulse-highlight');
      }, 1500);
    });

    btnAudioToggle?.addEventListener('click', () => {
      updateAudioState(!audioOn);
      synth.playClick();
    });
  } catch (err) {
    console.error("[ggsk] Settings button click listener registration failed:", err);
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
