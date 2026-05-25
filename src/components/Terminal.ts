/**
 * Command-Block Terminal Console & Contact Scroll Component
 * Zero-Dependency secure parser supporting Easter Eggs and interactive transmission scrolls.
 */

import { GameManager, synth } from '../core/gameEngine';
import { sanitizeHTML, validateEmail } from '../core/security';

export class Terminal {
  private container: HTMLDivElement;
  private body: HTMLDivElement;
  private input: HTMLInputElement;
  private modalContainer: HTMLDivElement;
  private game: GameManager;

  constructor(containerId: string, bodyId: string, inputId: string, modalId: string, game: GameManager) {
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.body = document.getElementById(bodyId) as HTMLDivElement;
    this.input = document.getElementById(inputId) as HTMLInputElement;
    this.modalContainer = document.getElementById(modalId) as HTMLDivElement;
    this.game = game;

    this.setupListeners();
  }

  private setupListeners() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = this.input.value.trim();
        this.input.value = '';
        if (command) {
          this.executeCommand(command);
        }
      }
    });

    // Support clicking container to focus input
    this.container.addEventListener('click', () => {
      this.input.focus();
    });
  }

  private appendLine(text: string, colorClass: string = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${colorClass}`;
    line.innerHTML = text; // Assumed secured or pre-escaped
    this.body.appendChild(line);
    
    // Auto Scroll to bottom
    this.body.scrollTop = this.body.scrollHeight;
  }

  private executeCommand(rawCmd: string) {
    const cleanCmd = rawCmd.toLowerCase();
    this.appendLine(`<span style="color: var(--color-cyber-blue); font-weight:bold;">&gt;</span> ${sanitizeHTML(rawCmd)}`);
    synth.playClick();

    switch (cleanCmd) {
      case '/help':
        this.appendLine('Available Commands:', 'text-yellow');
        this.appendLine('  /about    - Inspect DevSecOps background profile');
        this.appendLine('  /skills   - Check currently equipped skill weapons');
        this.appendLine('  /quests   - View outstanding professional projects');
        this.appendLine('  /contact  - Summon the encrypted contact scroll sheet');
        this.appendLine('  /hack     - Attempt matrix grid overflow exploit');
        this.appendLine('  /clear    - Purge terminal buffer logs');
        this.appendLine('  /self-destruct - [CAUTION] Execute critical test script');
        break;

      case '/clear':
        this.body.innerHTML = '';
        break;

      case '/about':
        this.appendLine('Nattachai Atchariyakul | Cyber Security Specialist & Full Stack Engineer', 'text-green');
        this.appendLine('Vulnerability assessor, threat hunter, and full-stack software engineer at the National Cyber Security Agency (NCSA) of Thailand. Champion of DevSecOps pipelines and robust defensive architectures.');
        this.appendLine('Core Focus: Threat Intelligence, proactive threat hunting, networks hardening, and secure API microservices orchestration.');
        break;

      case '/skills':
        this.appendLine('Equipped Technical Arsenals:', 'text-yellow');
        this.appendLine('  - Threat Intelligence Scope (Enchanted V - Surveillance)');
        this.appendLine('  - Obsidian Tracker Bow (Netherite IV - Threat Hunting)');
        this.appendLine('  - Command Block Analyzer (Emerald V - Threat Analysis)');
        this.appendLine('  - Secure Aegis Firewall (Diamond V - Perimeter Defense)');
        this.appendLine('  - Gemini Command Wand (Magical IV - AI Prompting)');
        break;

      case '/quests':
        this.appendLine('Outstanding Quests (Active Projects):', 'text-yellow');
        this.appendLine('  - Quest 1: Zero-Trust Gatekeeper (Status: Completed)');
        this.appendLine('  - Quest 2: Redstone SecOps Pipeline (Status: Completed)');
        this.appendLine('  - Quest 3: Obsidian Cache Ledger (Status: Completed)');
        break;

      case '/contact':
        this.appendLine('[SYSTEM] Summoning Scroll of Encryption...', 'text-green');
        setTimeout(() => {
          this.openContactScroll();
        }, 500);
        break;

      case '/hack':
        this.appendLine('[WARN] Overflowing memory matrix systems...', 'text-red');
        synth.playBreak();
        this.triggerMatrixGitch();
        break;

      case '/self-destruct':
        this.appendLine('[CAUTION] TRIPPED EXPLOSIVE TEST! -2 Hearts Damage!', 'text-red');
        this.game.damage(2); // Inflict HUD damage!
        break;

      default:
        this.appendLine(`[ERROR] Command "${sanitizeHTML(rawCmd)}" not found. Type "/help" for commands.`, 'text-red');
    }
  }

  private triggerMatrixGitch() {
    const glitchOverlay = document.createElement('div');
    glitchOverlay.style.position = 'fixed';
    glitchOverlay.style.top = '0';
    glitchOverlay.style.left = '0';
    glitchOverlay.style.width = '100vw';
    glitchOverlay.style.height = '100vh';
    glitchOverlay.style.backgroundColor = 'rgba(0, 20, 0, 0.95)';
    glitchOverlay.style.color = '#39FF14';
    glitchOverlay.style.fontFamily = 'monospace';
    glitchOverlay.style.fontSize = '24px';
    glitchOverlay.style.display = 'flex';
    glitchOverlay.style.alignItems = 'center';
    glitchOverlay.style.justifyContent = 'center';
    glitchOverlay.style.zIndex = '99999';
    glitchOverlay.innerHTML = '<span style="animation: pulseGlow 0.1s infinite;">&gt; EXPLOIT SUCCESSFUL. XP BONUS ACQUIRED. &lt;</span>';
    
    document.body.appendChild(glitchOverlay);
    
    setTimeout(() => {
      glitchOverlay.remove();
      this.game.addXP(100); // Reward XP
      this.appendLine('Grid overflow complete! Reward: +100 XP gained.', 'text-green');
    }, 2000);
  }

  private openContactScroll() {
    this.modalContainer.innerHTML = `
      <div class="book-modal" style="background-color: #f1ebd4; border: 10px solid #8c6b4f; height: 500px; width: 440px; color: #2d261e;">
        <span class="book-modal-close" id="btn-scroll-close" style="color: #8c6b4f;">&times;</span>
        
        <div class="book-pages-container" style="display:flex; flex-direction:column; gap:12px;">
          <div class="book-title" style="color: #8c2d19; font-size:16px;">QUEST SCROLL: CONTACT SHEET</div>
          
          <label style="font-family: var(--font-title); font-size:10px; margin-top:5px;">Your Cryptic Name:</label>
          <input type="text" id="scroll-name" style="background: rgba(0,0,0,0.05); border: 2px solid #8c6b4f; font-family: var(--font-body); font-size:18px; padding: 4px;" autocomplete="off">
          
          <label style="font-family: var(--font-title); font-size:10px;">Safe Delivery Mail:</label>
          <input type="email" id="scroll-email" style="background: rgba(0,0,0,0.05); border: 2px solid #8c6b4f; font-family: var(--font-body); font-size:18px; padding: 4px;" autocomplete="off">
          
          <label style="font-family: var(--font-title); font-size:10px;">Secure Transmission Data:</label>
          <textarea id="scroll-message" rows="4" style="background: rgba(0,0,0,0.05); border: 2px solid #8c6b4f; font-family: var(--font-body); font-size:18px; padding: 4px; resize:none;"></textarea>
        </div>
        
        <div class="book-footer">
          <div></div>
          <button id="btn-scroll-submit" class="btn-minecraft" style="width: auto; font-size: 10px; padding: 8px 16px;">SEND SCROLL</button>
        </div>
      </div>
    `;

    this.modalContainer.classList.remove('hidden');

    document.getElementById('btn-scroll-close')?.addEventListener('click', () => {
      synth.playClick();
      this.modalContainer.classList.add('hidden');
    });

    document.getElementById('btn-scroll-submit')?.addEventListener('click', () => {
      this.submitScrollForm();
    });
  }

  private submitScrollForm() {
    const nameEl = document.getElementById('scroll-name') as HTMLInputElement;
    const emailEl = document.getElementById('scroll-email') as HTMLInputElement;
    const msgEl = document.getElementById('scroll-message') as HTMLTextAreaElement;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const message = msgEl.value.trim();

    if (!name || !email || !message) {
      synth.playBreak();
      alert('All slots must be filled in the manifest scroll!');
      return;
    }

    if (!validateEmail(email)) {
      synth.playBreak();
      alert('Invalid safe delivery email coordinate!');
      return;
    }

    // Secure inputs
    const cleanName = sanitizeHTML(name);
    const cleanEmail = sanitizeHTML(email);
    const cleanMsg = sanitizeHTML(message);

    synth.playLevelUp();
    this.modalContainer.classList.add('hidden');
    this.appendLine(`[SUCCESS] Transmission from ${cleanName} sent to origin! Coordinates: ${cleanEmail}<br>Message: "${cleanMsg}"`, 'text-green');
    
    // Reward XP!
    this.game.addXP(200);

    // Show achievement toast
    const toaster = document.getElementById('advancement-toaster') as HTMLDivElement;
    if (toaster) {
      toaster.innerHTML = `
        <div class="advancement-icon">📧</div>
        <div class="advancement-text">
          <span class="advancement-challenge">Advancement Made!</span>
          <span class="advancement-title">Transmission Sent! [+200 XP]</span>
        </div>
      `;
      toaster.classList.remove('hidden');
      setTimeout(() => {
        toaster.classList.add('hidden');
      }, 4000);
    }
  }
}
