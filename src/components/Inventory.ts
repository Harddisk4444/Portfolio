/**
 * Minecraft Skills Inventory Component
 * Renders the authentic 3×9 HUD grid with inline expandable detail panel.
 * Mobile-safe: click/touch → panel update (no floating tooltip, no modal).
 */

import { GameManager, synth } from '../core/gameEngine';
import { sanitizeHTML } from '../core/security';

interface SkillItem {
  id: string;
  name: string;
  level: number;
  quality: string;
  type: string;
  icon: string;
  stats: string[];
  enchantments: string[];
  description: string;
}

// ── Authentic Skills Database ─────────────────────────────────────────────────
const SKILLS_DB: SkillItem[] = [
  {
    id: 'threat_intel',
    name: 'Threat Intelligence Scope',
    level: 95,
    quality: 'Enchanted Grade',
    type: 'Magical Artifact',
    icon: '👁️',
    stats: ['+95% IoC Detection Rate', '+93% Threat Feed Integration'],
    enchantments: ['Active Surveillance V', 'Adversary Profiling IV'],
    description: 'A glowing cyber lens that scans global threat feeds, identifying adversary campaigns and indicators before intrusion attempts reach the perimeter.'
  },
  {
    id: 'threat_hunting',
    name: 'Obsidian Tracker Bow',
    level: 92,
    quality: 'Netherite Grade',
    type: 'Ranged Weapon',
    icon: '🏹',
    stats: ['+92% Stealth Threat Tracking', '+90% Post-Breach Detection'],
    enchantments: ['MITRE ATT&CK Alignment V', 'Anomaly Identification IV'],
    description: 'Fires tracking beacons into system processes, isolating stealthy persistent threats that bypass standard perimeter walls and evade signature-based detection.'
  },
  {
    id: 'threat_analysis',
    name: 'Command Block Analyzer',
    level: 94,
    quality: 'Emerald Grade',
    type: 'Intelligence Tool',
    icon: '💻',
    stats: ['+94% Malware Behaviour Extraction', '+95% Attack Vector Profiling'],
    enchantments: ['Reverse Engineering V', 'Secure Sandbox IV'],
    description: 'A powerful logic terminal that extracts behavioral vectors and reverse-engineers binary payloads inside a secured sandbox without risking live system integrity.'
  },
  {
    id: 'networks',
    name: 'Secure Aegis Firewall',
    level: 90,
    quality: 'Diamond Grade',
    type: 'Defense Shield',
    icon: '🛡️',
    stats: ['+90% Perimeter Defense Coverage', '+95% Encrypted Flow Tracking'],
    enchantments: ['Stateful Packet Inspection V', 'DNSSEC Fortification IV'],
    description: 'A pristine grid barrier that inspects stateful packets in real-time, blocks anomalous traffic, and enforces secure network topologies across all subnets.'
  },
  {
    id: 'ai_prompt',
    name: 'Gemini Command Wand',
    level: 88,
    quality: 'Magical Artifact',
    type: 'Spell Wand',
    icon: '🪄',
    stats: ['+88% Dynamic LLM Prompting Accuracy', '+92% Context Extraction'],
    enchantments: ['Few-Shot Orchestration V', 'System Role Guardrails IV'],
    description: 'A mystical wand that commands large language models, crafting optimized prompt frames, context flows, and guardrail boundaries for secure AI-assisted operations.'
  }
];

// ── Component ─────────────────────────────────────────────────────────────────
export class Inventory {
  private container: HTMLDivElement;
  private detailsPanel: HTMLElement | null;
  private game: GameManager;

  constructor(containerId: string, game: GameManager) {
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.detailsPanel = document.getElementById('skills-details-panel');
    this.game = game;

    if (!this.container) {
      console.warn('[Inventory] Container element not found:', containerId);
      return;
    }

    this.render();
  }

  private render() {
    this.container.innerHTML = '';

    // 3 rows × 9 columns = 27 slots; 5 are populated with skills
    const TOTAL_SLOTS = 27;
    let firstSlot: HTMLElement | null = null;
    let firstItem: SkillItem | null = null;

    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('role', 'gridcell');

      const item = SKILLS_DB[i];

      if (item) {
        slot.innerHTML = `<span style="font-size: 28px; user-select: none;" aria-hidden="true">${item.icon}</span>`;
        slot.setAttribute('aria-label', `${item.name} — Level ${item.level}`);
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('id', `slot-${item.id}`);

        // Capture for auto-select
        if (i === 0) { firstSlot = slot; firstItem = item; }

        // Click — mobile & desktop
        slot.addEventListener('click', () => {
          synth.playClick();
          this.game.addXP(50);
          this.showSkillDetails(item, slot);
        });

        // Hover — desktop only (does not fire on touch devices)
        slot.addEventListener('mouseenter', () => {
          this.showSkillDetails(item, slot);
        });

        // Keyboard accessibility (Enter / Space)
        slot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            synth.playClick();
            this.game.addXP(50);
            this.showSkillDetails(item, slot);
          }
        });
      } else {
        slot.setAttribute('aria-label', 'Empty Inventory Slot');
        slot.style.cursor = 'default';
      }

      this.container.appendChild(slot);
    }

    // Pre-populate panel with first skill on load
    if (firstSlot && firstItem) {
      this.showSkillDetails(firstItem, firstSlot);
    }
  }

  private showSkillDetails(item: SkillItem, activeSlot: HTMLElement) {
    if (!this.detailsPanel) return;

    // Highlight selected slot
    this.container.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('active-slot'));
    activeSlot.classList.add('active-slot');

    const enchantmentsHTML = item.enchantments
      .map(e => `<div style="color:#55ff55;font-size:16px;margin-bottom:3px;">• ${sanitizeHTML(e)}</div>`)
      .join('');

    const statsHTML = item.stats
      .map(s => `<div style="color:#55ffff;font-size:16px;margin-bottom:3px;">✦ ${sanitizeHTML(s)}</div>`)
      .join('');

    const levelPct = Math.min(100, Math.round((item.level / 99) * 100));

    this.detailsPanel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px dashed var(--color-obsidian-border);padding-bottom:10px;margin-bottom:12px;">
        <span style="font-family:var(--font-title);font-size:14px;color:#a984e5;text-shadow:2px 2px 0 #000;">${sanitizeHTML(item.name)}</span>
        <span style="font-size:26px;" aria-hidden="true">${item.icon}</span>
      </div>
      <div style="color:#9e7d62;font-size:10px;margin-bottom:12px;font-family:var(--font-title);text-transform:uppercase;letter-spacing:1px;">
        ${sanitizeHTML(item.type)} · ${sanitizeHTML(item.quality)}
      </div>
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
          <span style="color:var(--color-mc-text-yellow);font-family:var(--font-title);font-size:10px;">POWER LEVEL</span>
          <span style="color:#fff;font-family:var(--font-title);font-size:12px;">${item.level} / 99</span>
        </div>
        <div style="height:8px;background:#313131;border:2px solid #5a5a5a;width:100%;">
          <div style="height:100%;width:${levelPct}%;background:var(--color-command-green);transition:width 0.4s ease-out;"></div>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-family:var(--font-title);font-size:8px;color:var(--color-text-muted);margin-bottom:6px;text-transform:uppercase;">Enchantments:</div>
        ${enchantmentsHTML}
      </div>
      <div style="margin-bottom:12px;border-top:1px dashed var(--color-obsidian-border);padding-top:10px;">
        <div style="font-family:var(--font-title);font-size:8px;color:var(--color-text-muted);margin-bottom:6px;text-transform:uppercase;">Active Attributes:</div>
        ${statsHTML}
      </div>
      <div style="color:#aaa;font-size:15px;font-style:italic;line-height:1.5;border-top:1px dashed var(--color-obsidian-border);padding-top:10px;">
        "${sanitizeHTML(item.description)}"
      </div>
    `;

    this.detailsPanel.classList.remove('hidden-details');
  }

  destroy() {
    // Lifecycle hook — reserved for future cleanup (e.g. removing animation frames)
  }
}
