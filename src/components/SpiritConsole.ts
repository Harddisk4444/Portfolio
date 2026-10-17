/**
 * Spirit Console (command terminal) & Spirit Message scroll (contact form).
 * The contact form is client-side only: nothing is transmitted (OPSEC, as before).
 */

import { SKILLS } from '../data/skills';
import { TRIALS } from '../data/trials';
import { ringLabel } from '../data/rings';
import { GameManager, synth } from '../core/gameEngine';
import { sanitizeHTML, validateEmail } from '../core/security';
import { showToast } from './toast';

type Tone = 'jade' | 'gold' | 'red' | 'purple' | 'dim' | '';

export class SpiritConsole {
  private log: HTMLElement;
  private input: HTMLInputElement;

  constructor(log: HTMLElement, form: HTMLFormElement, input: HTMLInputElement, private game: GameManager, private reducedMotion: MediaQueryList) {
    this.log = log;
    this.input = input;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const raw = this.input.value.trim();
      this.input.value = '';
      if (raw) this.execute(raw);
    });

    const contact = document.getElementById('contact-form');
    if (contact instanceof HTMLFormElement) {
      contact.addEventListener('submit', e => {
        e.preventDefault();
        this.sendMessage(contact);
      });
    }
  }

  // ── Output ──────────────────────────────────────────────────────────────────
  private line(html: string, tone: Tone = '') {
    const p = document.createElement('p');
    p.className = tone ? `t-line t-${tone}` : 't-line';
    p.innerHTML = html || '&nbsp;';
    this.log.appendChild(p);
    this.log.scrollTop = this.log.scrollHeight;
  }

  private blank() {
    this.line('');
  }

  // ── Commands ────────────────────────────────────────────────────────────────
  private execute(raw: string) {
    const cmd = raw.toLowerCase().replace(/^\/?/, '/');
    this.line(`<span class="t-caret">❯</span> ${sanitizeHTML(raw)}`, 'dim');
    synth.playClick();

    switch (cmd) {
      case '/help':
        this.line('Incantations:', 'gold');
        this.line('  /whoami         Spirit master profile');
        this.line('  /skills         Martial soul and spirit rings');
        this.line('  /projects       Completed and active trials');
        this.line('  /contact        Open the spirit message scroll');
        this.line('  /clear          Clear the console');
        this.line('  /hack           Soul burst [+100 XP]');
        this.line('  /meditate       Restore 2 vitality');
        this.line('  /self-destruct  [CAUTION] Lose 2 vitality');
        break;

      case '/whoami':
        this.line('[ SPIRIT MASTER PROFILE ]', 'jade');
        this.line('Name    : Nattachai Atchariyakul');
        this.line('Class   : Cyber Security Specialist &amp; Full-Stack Engineer');
        this.line('Focus   : Threat Intelligence · Threat Hunting · Network Hardening · AI Prompting');
        this.line('Contact : <span class="t-jade">nattachaiatc@gmail.com</span>');
        this.line('Status  : <span class="t-jade">Available for consulting &amp; freelance missions</span>');
        break;

      case '/skills':
        this.line('[ MARTIAL SOUL · SPIRIT RINGS ]', 'gold');
        SKILLS.forEach(s => {
          this.line(`  ${sanitizeHTML(s.discipline.padEnd(33))} Lv ${s.level}  <span class="t-${s.ring}">${sanitizeHTML(ringLabel(s.ring))}</span>  — ${sanitizeHTML(s.name)}`);
        });
        break;

      case '/projects':
        this.line('[ COMPLETED &amp; ACTIVE TRIALS ]', 'gold');
        this.blank();
        this.line('★  PSRU CTF  <span class="t-jade">[FLAGSHIP TRIAL]</span>');
        this.line('   Designed and operated Capture The Flag challenges for Pibulsongkram');
        this.line('   Rajabhat University. Engineered custom OSINT, network forensics,');
        this.line('   and binary exploitation scenarios targeting real-world attack chains.');
        TRIALS.forEach(t => {
          this.blank();
          this.line(`■  ${sanitizeHTML(t.title)}  <span class="t-purple">[${t.tech.map(sanitizeHTML).join(' · ')}]</span>`);
          this.line(`   ${sanitizeHTML(t.description)}`, 'dim');
        });
        this.game.addXP(75);
        break;

      case '/contact': {
        this.line('Unrolling the spirit message scroll…', 'jade');
        const scroll = document.getElementById('contact-form');
        scroll?.scrollIntoView({ behavior: this.reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
        window.setTimeout(() => document.getElementById('contact-name')?.focus({ preventScroll: true }), 600);
        break;
      }

      case '/clear':
        this.log.innerHTML = '';
        break;

      case '/hack':
        this.line('[WARN] Spirit rings resonating beyond their limit…', 'red');
        this.soulBurst();
        break;

      case '/meditate':
        this.game.heal(2);
        this.line('You breathe in the Qi of heaven and earth. +2 vitality.', 'jade');
        break;

      case '/self-destruct':
        this.line('[CAUTION] Soul backlash! -2 vitality.', 'red');
        this.game.damage(2);
        break;

      default:
        this.line(`[ERROR] Unknown incantation: "<span class="t-red">${sanitizeHTML(raw)}</span>". Type /help.`);
    }
  }

  private soulBurst() {
    synth.playBurst();
    window.dispatchEvent(new CustomEvent('spirit:pulse'));
    const overlay = document.createElement('div');
    overlay.className = 'burst';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<p class="burst__text">Soul Burst<br><span>Spirit rings resonate · +100 XP</span></p>';
    document.body.appendChild(overlay);
    window.setTimeout(() => {
      overlay.remove();
      this.game.addXP(100);
      this.line('Resonance complete. Reward: <span class="t-jade">+100 XP</span>', 'jade');
    }, this.reducedMotion.matches ? 300 : 1800);
  }

  // ── Contact scroll (client-side only) ───────────────────────────────────────
  private sendMessage(form: HTMLFormElement) {
    const name = form.elements.namedItem('name') as HTMLInputElement;
    const email = form.elements.namedItem('email') as HTMLInputElement;
    const message = form.elements.namedItem('message') as HTMLTextAreaElement;
    const error = document.getElementById('contact-error');

    const fail = (text: string, field: HTMLElement) => {
      synth.playBurst();
      if (error) {
        error.textContent = text;
        error.hidden = false;
      }
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    };
    [name, email, message].forEach(f => f.removeAttribute('aria-invalid'));

    if (!name.value.trim()) {
      fail('Please write your name.', name);
      return;
    }
    if (!validateEmail(email.value.trim())) {
      fail('Please enter a valid email address.', email);
      return;
    }
    if (!message.value.trim()) {
      fail('Please write a message.', message);
      return;
    }
    if (error) error.hidden = true;

    const cleanName = sanitizeHTML(name.value.trim());
    const cleanEmail = sanitizeHTML(email.value.trim());
    const cleanMsg = sanitizeHTML(message.value.trim());

    synth.playLevelUp();
    this.blank();
    this.line('[ SPIRIT MESSAGE SEALED ]', 'jade');
    this.line(`  Sender   : ${cleanName}`);
    this.line(`  Reply to : ${cleanEmail}`);
    this.line(`  Message  : "${cleanMsg.substring(0, 80)}${cleanMsg.length > 80 ? '…' : ''}"`);
    this.line('  Status   : <span class="t-jade">Sealed &amp; acknowledged. Mission recorded.</span>');
    this.game.addXP(200);
    form.reset();
    showToast('Spirit message sealed', '+200 XP');
  }
}
