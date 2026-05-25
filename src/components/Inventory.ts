/**
 * Minecraft Skills Inventory Component
 * Renders the authentic 3x9 item storage grid with customized retro hover tooltips.
 */

import { GameManager, synth } from '../core/gameEngine';

interface SkillItem {
  id: string;
  name: string;
  level: number;
  quality: string;
  type: string;
  icon: string; // Emoji fallback or canvas render, we'll use beautiful unicode symbols & visual indicators
  stats: string[];
  enchantments: string[];
  description: string;
}

const SKILLS_DB: SkillItem[] = [
  {
    id: 'threat_intel',
    name: 'Threat Intelligence Scope',
    level: 95,
    quality: 'Enchanted Grade',
    type: 'Magical Artifact',
    icon: '👁️',
    stats: ['+95% IoC Detection', '+93% Threat Feeds Integration'],
    enchantments: ['Active Surveillance V', 'Adversary Profiling IV'],
    description: 'A glowing cyber lens that scans threat feeds globally, identifying adversary campaigns and indicators before intrusion attempts are made.'
  },
  {
    id: 'threat_hunting',
    name: 'Obsidian Tracker Bow',
    level: 92,
    quality: 'Netherite Grade',
    type: 'Ranged Weapon',
    icon: '🏹',
    stats: ['+92% Stealth Threat Tracking', '+90% Post-Breach Detection'],
    enchantments: ['MITRE Attack Alignment V', 'Anomaly Identification IV'],
    description: 'Fires tracking beacons into system processes, isolating stealthy persistent threats that bypass standard perimeter walls.'
  },
  {
    id: 'threat_analysis',
    name: 'Command Block Analyzer',
    level: 94,
    quality: 'Emerald Grade',
    type: 'Intelligence Tool',
    icon: '💻',
    stats: ['+94% Malware Behavior Extraction', '+95% Attack Vector Profiling'],
    enchantments: ['Reverse Engineering V', 'Secure Sandbox IV'],
    description: 'A powerful logic terminal that extracts behavioral vectors and reverse-engineers binary payloads securely without risking system integrity.'
  },
  {
    id: 'networks',
    name: 'Secure Aegis Firewall',
    level: 90,
    quality: 'Diamond Grade',
    type: 'Defense Shield',
    icon: '🛡️',
    stats: ['+90% Perimeter Defense', '+95% Encrypted Flow Tracking'],
    enchantments: ['Stateful Packet Inspection V', 'DNSSEC Fortification IV'],
    description: 'A pristine grid barrier that inspects stateful packets, blocks abnormal traffic, and establishes secure network topologies.'
  },
  {
    id: 'ai_prompt',
    name: 'Gemini Command Wand',
    level: 88,
    quality: 'Magical Artifact',
    type: 'Spell Wand',
    icon: '🪄',
    stats: ['+88% Dynamic LLM Prompting', '+92% Context Extraction'],
    enchantments: ['Few-Shot Orchestration V', 'System Role Guardrails IV'],
    description: 'A mystical wand that commands large language models, crafting highly optimized prompt frames and context flows.'
  }
];

export class Inventory {
  private container: HTMLDivElement;
  private detailsPanel: HTMLDivElement | null = null;
  private game: GameManager;

  constructor(containerId: string, game: GameManager) {
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.detailsPanel = document.getElementById('skills-details-panel') as HTMLDivElement;
    this.game = game;
    this.render();
  }

  private render() {
    this.container.innerHTML = '';
    
    // Create standard Minecraft inventory HUD: 3 rows, 9 columns = 27 slots
    const totalSlots = 27;
    let firstSlotElement: HTMLElement | null = null;
    let firstItem: SkillItem | null = null;

    for (let i = 0; i < totalSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('role', 'gridcell');

      // Populate item if index matches our technical DB
      const item = SKILLS_DB[i];
      if (item) {
        slot.innerHTML = `<span style="font-size: 28px;">${item.icon}</span>`;
        slot.setAttribute('aria-label', `${item.name} - Level ${item.level}`);
        
        if (i === 0) {
          firstSlotElement = slot;
          firstItem = item;
        }

        // Click interaction: selects and shows stats inline
        slot.addEventListener('click', () => {
          synth.playClick();
          this.game.addXP(50); // Small XP reward for inspecting skills
          this.showSkillDetails(item, slot);
        });

        // Hover compatibility for desktops: instantly displays details
        slot.addEventListener('mouseenter', () => {
          this.showSkillDetails(item, slot);
        });
      } else {
        slot.setAttribute('aria-label', 'Empty Inventory Slot');
      }

      this.container.appendChild(slot);
    }

    // Auto-select first slot on load to keep details panel populated and premium
    if (firstSlotElement && firstItem) {
      this.showSkillDetails(firstItem, firstSlotElement);
    }
  }

  private showSkillDetails(item: SkillItem, slotElement: HTMLElement) {
    if (!this.detailsPanel) return;

    // Highlight selected slot
    this.container.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('active-slot'));
    slotElement.classList.add('active-slot');

    let enchantmentsHTML = '';
    item.enchantments.forEach((ench) => {
      enchantmentsHTML += `<div style="color: #55ff55; font-size: 16px; margin-bottom: 2px;">• ${ench}</div>`;
    });

    let statsHTML = '';
    item.stats.forEach((stat) => {
      statsHTML += `<div style="color: #55ffff; font-size: 16px; margin-bottom: 2px;">✦ ${stat}</div>`;
    });

    this.detailsPanel.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px dashed var(--color-obsidian-border); padding-bottom: 8px; margin-bottom: 12px;">
        <span style="font-family: var(--font-title); font-size: 16px; color: #a984e5; text-shadow: 2px 2px 0 #000;">${item.name}</span>
        <span style="font-size: 24px;">${item.icon}</span>
      </div>
      <div style="color: #9e7d62; font-size: 10px; margin-bottom: 10px; font-family: var(--font-title); text-transform: uppercase;">${item.type} (${item.quality})</div>
      <div style="margin-bottom: 12px; font-size: 16px;">
        <span style="color: var(--color-mc-text-yellow); font-family: var(--font-title); font-size: 10px; text-transform: uppercase;">Level:</span>
        <span style="color: #ffffff; font-weight: bold; font-family: var(--font-title); font-size: 12px;">${item.level} / 99</span>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="font-family: var(--font-title); font-size: 8px; color: var(--color-text-muted); margin-bottom: 6px; text-transform: uppercase;">Enchantments:</div>
        ${enchantmentsHTML}
      </div>
      
      <div style="margin-bottom: 12px; border-top: 1px dashed var(--color-obsidian-border); padding-top: 8px;">
        <div style="font-family: var(--font-title); font-size: 8px; color: var(--color-text-muted); margin-bottom: 6px; text-transform: uppercase;">Active Attributes:</div>
        ${statsHTML}
      </div>
      
      <div style="color: #aaaaaa; font-size: 15px; font-style: italic; line-height: 1.4; border-top: 1px dashed var(--color-obsidian-border); padding-top: 8px;">
        "${item.description}"
      </div>
    `;

    this.detailsPanel.classList.remove('hidden-details');
  }

  destroy() {
    // Destructor is preserved for lifecycle management, though no manual window listener is active
  }
}
