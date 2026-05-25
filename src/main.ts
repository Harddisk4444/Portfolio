/**
 * ggsk.dev Application Bootstrapper & Main Orchestrator
 * Connects Canvas background, game state manager, HUD overlay, and modules.
 */

import { CanvasGrid } from './components/CanvasGrid';
import { Inventory } from './components/Inventory';
import { QuestBook } from './components/QuestBook';
import { Terminal } from './components/Terminal';
import { GameManager, synth } from './core/gameEngine';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas Background
  let canvasGrid: CanvasGrid | null = null;
  try {
    canvasGrid = new CanvasGrid('voxel-canvas');
  } catch {
    // WebGL/Canvas2D error protection
  }

  // 2. Initialize Game Engine
  const game = new GameManager();

  // 3. Initialize Core UI Components
  const inventory = new Inventory('skills-inventory', game);
  new QuestBook(
    'quests-list',
    'certs-shelf',
    'modal-container',
    'advancement-toaster',
    game
  );
  
  // Initialize Terminal console
  new Terminal(
    'terminal-container',
    'terminal-body',
    'terminal-input',
    'modal-container',
    game
  );

  // 4. Connect Game State to Persistent HUD UI
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

  // 5. Setup Menu Navigation & General Interactive Events
  
  // Explore Portfolio button - Minecraft world-loading transition
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

  // Socials & Contact Menu button - Opens the direct transmission scroll
  const btnSocials = document.getElementById('menu-socials');
  btnSocials?.addEventListener('click', () => {
    synth.playClick();
    // Simulate terminal call to sumon contact scroll
    const terminalInput = document.getElementById('terminal-input') as HTMLInputElement;
    if (terminalInput) {
      terminalInput.value = '/contact';
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      terminalInput.dispatchEvent(enterEvent);
      
      const target = document.getElementById('terminal-section');
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Audio Toggle & Accessibility Settings Menu Button
  const btnSettings = document.getElementById('menu-settings');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  let audioOn = true;

  function updateAudioState(active: boolean) {
    audioOn = active;
    synth.toggle(audioOn);
    if (btnAudioToggle) {
      btnAudioToggle.innerHTML = audioOn 
        ? '<span class="icon-speaker">🔊</span> AUDIO: ON' 
        : '<span class="icon-speaker">🔇</span> AUDIO: OFF';
    }
  }

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

  // Hot-reload/unload safety
  window.addEventListener('beforeunload', () => {
    if (canvasGrid) canvasGrid.destroy();
    inventory.destroy();
  });
});
