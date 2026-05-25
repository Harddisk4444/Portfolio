/**
 * Command-Block Terminal Console & Contact Scroll Component
 * Secure command parser with Easter Eggs. Contact form is purely client-side
 * (no actual email transmission — OPSEC maintained).
 */

import { GameManager, synth } from '../core/gameEngine';
import { sanitizeHTML, validateEmail } from '../core/security';

export class Terminal {
  private container: HTMLElement | null;
  private body: HTMLElement | null;
  private input: HTMLInputElement | null;
  private game: GameManager;

  constructor(containerId: string, bodyId: string, inputId: string, game: GameManager) {
    this.container = document.getElementById(containerId);
    this.body      = document.getElementById(bodyId);
    this.input     = document.getElementById(inputId) as HTMLInputElement | null;
    this.game      = game;

    if (!this.body || !this.input) {
      console.warn('[Terminal] Required elements not found — skipping init.');
      return;
    }

    this.setupKeyboardListener();
    this.setupContactForm();
  }

  // ── Keyboard command listener ─────────────────────────────────────────────
  private setupKeyboardListener() {
    this.input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const raw = this.input!.value.trim();
      this.input!.value = '';
      if (raw) this.executeCommand(raw);
    });

    // Click terminal body → focus input
    this.container?.addEventListener('click', () => this.input?.focus());
  }

  // ── Contact form — e.preventDefault() + client-side only (OPSEC safe) ────
  private setupContactForm() {
    const form    = document.getElementById('contact-scroll');
    const btnSend = document.getElementById('btn-scroll-submit');

    // Intercept form submit if it is a <form> element
    if (form instanceof HTMLFormElement) {
      form.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        this.submitScrollForm();
      });
    }

    // Also hook the explicit send button (works for <div>-based layout too)
    btnSend?.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      this.submitScrollForm();
    });
  }

  // ── Output helpers ────────────────────────────────────────────────────────
  private appendLine(html: string, colorClass = '') {
    if (!this.body) return;
    const line = document.createElement('div');
    line.className = `terminal-line${colorClass ? ' ' + colorClass : ''}`;
    line.innerHTML = html;
    this.body.appendChild(line);
    this.body.scrollTop = this.body.scrollHeight;
  }

  private blank() { this.appendLine('&nbsp;'); }

  // ── Command dispatcher ────────────────────────────────────────────────────
  private executeCommand(raw: string) {
    const cmd = raw.toLowerCase().trim();

    // Echo the user input
    this.appendLine(
      `<span style="color:var(--color-cyber-blue);font-weight:bold;">&gt;</span> ${sanitizeHTML(raw)}`
    );
    synth.playClick();

    switch (cmd) {

      // ── /help ──────────────────────────────────────────────────────────
      case '/help':
        this.appendLine('Available Commands:', 'text-yellow');
        this.blank();
        this.appendLine('  /whoami      — Display operator identification profile');
        this.appendLine('  /skills      — List currently equipped cyber weapons');
        this.appendLine('  /projects    — Enumerate completed & active missions');
        this.appendLine('  /contact     — Scroll to the encrypted contact manifest');
        this.appendLine('  /clear       — Purge terminal buffer logs');
        this.appendLine('  /hack        — Attempt grid overflow exploit [+100 XP]');
        this.appendLine('  /self-destruct — [CAUTION] Execute critical damage test');
        this.blank();
        break;

      // ── /whoami ────────────────────────────────────────────────────────
      case '/whoami':
        this.blank();
        this.appendLine('[ OPERATOR PROFILE ]', 'text-green');
        this.appendLine('Name    : Nattachai Atchariyakul');
        this.appendLine('Class   : Cyber Security Specialist &amp; Full-Stack Engineer');
        this.appendLine('Focus   : Threat Intelligence · Threat Hunting · Network Hardening · AI Prompting');
        this.appendLine('Contact : <span class="text-cyan">nattachaiatc@gmail.com</span>');
        this.appendLine('Status  : <span class="text-green">Available for consulting &amp; freelance missions</span>');
        this.blank();
        break;

      // ── /skills ────────────────────────────────────────────────────────
      case '/skills':
        this.blank();
        this.appendLine('[ EQUIPPED ARSENAL ]', 'text-yellow');
        this.appendLine('  👁️  Threat Intelligence Scope  — Level 95  (Enchanted V)');
        this.appendLine('  🏹  Obsidian Tracker Bow       — Level 92  (Netherite IV)');
        this.appendLine('  💻  Command Block Analyzer     — Level 94  (Emerald V)');
        this.appendLine('  🛡️  Secure Aegis Firewall      — Level 90  (Diamond V)');
        this.appendLine('  🪄  Gemini Command Wand        — Level 88  (Magical IV)');
        this.blank();
        break;

      // ── /projects ─────────────────────────────────────────────────────
      case '/projects':
        this.blank();
        this.appendLine('[ COMPLETED &amp; ACTIVE MISSIONS ]', 'text-yellow');
        this.blank();
        this.appendLine('★  PSRU CTF  <span class="text-green">[FLAGSHIP MISSION]</span>');
        this.appendLine('   Designed and operated Capture The Flag challenges for Pibulsongkram');
        this.appendLine('   Rajabhat University. Engineered custom OSINT, network forensics,');
        this.appendLine('   and binary exploitation scenarios targeting real-world attack chains.');
        this.blank();
        this.appendLine('■  Zero-Trust Gatekeeper  <span class="text-cyan">[COMPLETED]</span>');
        this.appendLine('   Go microservices API gateway + HashiCorp Vault zero-trust enforcement.');
        this.blank();
        this.appendLine('■  Redstone SecOps Pipeline  <span class="text-cyan">[COMPLETED]</span>');
        this.appendLine('   GitHub Actions CI/CD with SAST · SCA · dependency audits (Trivy, SonarQube).');
        this.blank();
        this.appendLine('■  Obsidian Cache Ledger  <span class="text-cyan">[COMPLETED]</span>');
        this.appendLine('   Python + Redis connection pool with token-bucket rate limiting under peak load.');
        this.blank();
        this.game.addXP(75); // Exploration reward
        break;

      // ── /contact ───────────────────────────────────────────────────────
      case '/contact':
        this.appendLine('[SYSTEM] Routing to Quest Manifest Scroll...', 'text-green');
        const scrollEl = document.getElementById('contact-scroll');
        if (scrollEl) {
          scrollEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            (document.getElementById('scroll-name') as HTMLInputElement | null)?.focus();
          }, 600);
        }
        break;

      // ── /clear ─────────────────────────────────────────────────────────
      case '/clear':
        if (this.body) this.body.innerHTML = '';
        break;

      // ── /hack Easter Egg ───────────────────────────────────────────────
      case '/hack':
        this.appendLine('[WARN] Overflowing memory matrix...', 'text-red');
        synth.playBreak();
        this.triggerMatrixGlitch();
        break;

      // ── /self-destruct ─────────────────────────────────────────────────
      case '/self-destruct':
        this.appendLine('[CAUTION] CRITICAL SCRIPT TRIPPED! -2 Hearts damage!', 'text-red');
        synth.playBreak();
        this.game.damage(2);
        break;

      // ── Unknown ────────────────────────────────────────────────────────
      default:
        this.appendLine(
          `[ERROR] Unknown command: "<span style="color:#ff4444;">${sanitizeHTML(raw)}</span>". Type /help for available commands.`
        );
    }
  }

  // ── Matrix glitch Easter Egg ──────────────────────────────────────────────
  private triggerMatrixGlitch() {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,20,0,0.95)',
      color: '#39FF14', fontFamily: 'monospace', fontSize: '22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '99999', textAlign: 'center', padding: '20px'
    });
    overlay.innerHTML = '<span style="animation:pulseGlow 0.1s infinite;">&gt; EXPLOIT SUCCESSFUL. XP BONUS ACQUIRED. &lt;</span>';
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      this.game.addXP(100);
      this.appendLine('Grid overflow complete! Reward: <span class="text-green">+100 XP</span>', 'text-green');
    }, 2000);
  }

  // ── Contact form submit (client-side only — no email sent) ────────────────
  private submitScrollForm() {
    const nameEl  = document.getElementById('scroll-name')    as HTMLInputElement  | null;
    const emailEl = document.getElementById('scroll-email')   as HTMLInputElement  | null;
    const msgEl   = document.getElementById('scroll-message') as HTMLTextAreaElement | null;

    if (!nameEl || !emailEl || !msgEl) return;

    const name  = nameEl.value.trim();
    const email = emailEl.value.trim();
    const msg   = msgEl.value.trim();

    // ── Validation — inline UI feedback, no alert() ────────────────────
    if (!name) {
      this.showScrollError('⚠️ Cryptic name field cannot be empty.');
      nameEl.focus();
      return;
    }
    if (!email || !validateEmail(email)) {
      this.showScrollError('⚠️ Invalid safe-delivery email coordinate.');
      emailEl.focus();
      return;
    }
    if (!msg) {
      this.showScrollError('⚠️ Transmission data field cannot be empty.');
      msgEl.focus();
      return;
    }

    // ── Sanitize ────────────────────────────────────────────────────────
    const cleanName  = sanitizeHTML(name);
    const cleanEmail = sanitizeHTML(email);
    const cleanMsg   = sanitizeHTML(msg);

    // ── Inline success output in terminal ───────────────────────────────
    synth.playLevelUp();
    this.appendLine('');
    this.appendLine('[ SECURE TRANSMISSION SUCCESSFUL ]', 'text-green');
    this.appendLine(`  Operator : ${cleanName}`);
    this.appendLine(`  Endpoint : ${cleanEmail}`);
    this.appendLine(`  Payload  : "${cleanMsg.substring(0, 80)}${cleanMsg.length > 80 ? '…' : ''}"`);
    this.appendLine('  Status   : <span class="text-green">Encrypted &amp; acknowledged. Mission recorded.</span>');
    this.blank();

    this.game.addXP(200);

    // Scroll terminal body into view
    this.body?.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Reset form
    nameEl.value  = '';
    emailEl.value = '';
    msgEl.value   = '';

    // Achievement toast
    const toaster = document.getElementById('advancement-toaster');
    if (toaster) {
      toaster.innerHTML = `
        <div class="advancement-icon">📡</div>
        <div class="advancement-text">
          <span class="advancement-challenge">Advancement Made!</span>
          <span class="advancement-title">Transmission Acknowledged! [+200 XP]</span>
        </div>
      `;
      toaster.classList.remove('hidden');
      setTimeout(() => toaster.classList.add('hidden'), 4000);
    }
  }

  // ── Inline scroll error (no alert — mobile-safe) ─────────────────────────
  private showScrollError(message: string) {
    synth.playBreak();

    // Find or create error line under the form
    let errEl = document.getElementById('scroll-error-line');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'scroll-error-line';
      errEl.style.cssText =
        'font-family:var(--font-title);font-size:9px;color:var(--color-redstone-red);' +
        'padding:8px 0 4px;text-align:center;';
      const scrollAction = document.querySelector('.scroll-action');
      scrollAction?.insertAdjacentElement('beforebegin', errEl);
    }

    errEl.textContent = message;
    errEl.style.display = 'block';

    // Auto-clear after 3 s
    setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 3000);
  }
}
