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
  },
  {
    id: 'k8s',
    name: 'Kubernetes Scaling Trident',
    level: 93,
    quality: 'Enchanted Grade',
    type: 'Siege Weapon',
    icon: '🔱',
    stats: ['+93% Pod Orchestration', '+95% Auto-healing Scalability'],
    enchantments: ['Multi-Cluster Orchestration V', 'Zero-Downtime Deployment IV'],
    description: 'Balances container instances dynamically, ensuring high availability and orchestrating multi-region nodes.'
  },
  {
    id: 'ts',
    name: 'TypeScript Infinity Bow',
    level: 95,
    quality: 'Diamond Grade',
    type: 'Ranged Weapon',
    icon: '🏹',
    stats: ['+95% Type Integrity', '+94% Compile Safety Guard'],
    enchantments: ['Strict Type Casting V', 'Zero-Null Exception IV'],
    description: 'Fires type definitions that eliminate standard runtime defects, locking variables into immutable mathematical states.'
  },
  {
    id: 'docker',
    name: 'Docker Sealed Obsidian Box',
    level: 90,
    quality: 'Emerald Grade',
    type: 'Defense Gear',
    icon: '📦',
    stats: ['+90% Layer Optimization', '+92% Container Isolation'],
    enchantments: ['Namespace Isolation V', 'Alpine Micro-Image IV'],
    description: 'Constructs pristine sandbox containers, minimizing execution footprint and isolating namespace permissions securely.'
  },
  {
    id: 'python',
    name: 'Python Poison Dagger',
    level: 91,
    quality: 'Emerald Grade',
    type: 'Melee Weapon',
    icon: '🗡️',
    stats: ['+91% Scripting Speed', '+90% API Bite Rate'],
    enchantments: ['Deep Machine Library V', 'Rapid Socket Scripting IV'],
    description: 'A fast automation weapon that writes backend logic and scripts network sockets with minimal latency.'
  }
];

export class Inventory {
  private container: HTMLDivElement;
  private game: GameManager;
  private activeTooltip: HTMLDivElement | null = null;

  constructor(containerId: string, game: GameManager) {
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.game = game;
    this.createTooltipElement();
    this.render();
  }

  private createTooltipElement() {
    this.activeTooltip = document.createElement('div');
    this.activeTooltip.className = 'mc-tooltip';
    document.body.appendChild(this.activeTooltip);
  }

  private render() {
    this.container.innerHTML = '';
    
    // Create standard Minecraft inventory HUD: 3 rows, 9 columns = 27 slots
    const totalSlots = 27;
    for (let i = 0; i < totalSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('role', 'gridcell');

      // Populate item if index matches our technical DB
      const item = SKILLS_DB[i];
      if (item) {
        slot.innerHTML = `<span style="font-size: 28px;">${item.icon}</span>`;
        slot.setAttribute('aria-label', `${item.name} - Level ${item.level}`);
        
        // Event Listeners for click and hover interaction
        slot.addEventListener('click', () => {
          synth.playClick();
          this.game.addXP(50); // Small XP reward for inspecting skills
        });

        slot.addEventListener('mouseenter', (e) => {
          this.showTooltip(item, e);
        });

        slot.addEventListener('mouseleave', () => {
          this.hideTooltip();
        });

        slot.addEventListener('mousemove', (e) => {
          this.moveTooltip(e);
        });
      } else {
        slot.setAttribute('aria-label', 'Empty Inventory Slot');
      }

      this.container.appendChild(slot);
    }
  }

  private showTooltip(item: SkillItem, e: MouseEvent) {
    if (!this.activeTooltip) return;

    // Generate HTML with high-contrast colored tooltips styled exactly like Minecraft
    let enchantmentsHTML = '';
    item.enchantments.forEach((ench) => {
      enchantmentsHTML += `<div style="color: #55ff55;">${ench}</div>`; // Minecraft Green Enchantment
    });

    let statsHTML = '';
    item.stats.forEach((stat) => {
      statsHTML += `<div style="color: #55ffff;">${stat}</div>`; // Minecraft Cyan Stats
    });

    this.activeTooltip.innerHTML = `
      <div class="tooltip-title">${item.name}</div>
      <div style="color: #9e7d62; font-size: 16px; margin-bottom: 8px;">${item.type} (${item.quality})</div>
      <div style="margin-bottom: 8px;">
        <span style="color: var(--color-mc-text-yellow);">Level:</span>
        <span style="color: #ffffff; font-weight: bold;">${item.level}</span>
      </div>
      <div style="margin-bottom: 8px;">${enchantmentsHTML}</div>
      <div style="margin-bottom: 8px; border-top: 1px dashed #555555; padding-top: 6px;">${statsHTML}</div>
      <div style="color: #aaaaaa; font-size: 15px; font-style: italic; line-height: 1.3;">"${item.description}"</div>
    `;

    this.activeTooltip.style.display = 'block';
    this.moveTooltip(e);
  }

  private moveTooltip(e: MouseEvent) {
    if (!this.activeTooltip) return;

    // Offset coordinates to avoid overlap with cursor
    const offset = 15;
    let x = e.pageX + offset;
    let y = e.pageY + offset;

    // Boundary protection to prevent tooltip overflow outside screen window
    const tooltipWidth = this.activeTooltip.offsetWidth;
    const tooltipHeight = this.activeTooltip.offsetHeight;

    if (x + tooltipWidth > window.innerWidth + window.scrollX) {
      x = e.pageX - tooltipWidth - offset;
    }
    if (y + tooltipHeight > window.innerHeight + window.scrollY) {
      y = e.pageY - tooltipHeight - offset;
    }

    this.activeTooltip.style.left = `${x}px`;
    this.activeTooltip.style.top = `${y}px`;
  }

  private hideTooltip() {
    if (!this.activeTooltip) return;
    this.activeTooltip.style.display = 'none';
  }

  destroy() {
    if (this.activeTooltip) {
      this.activeTooltip.remove();
    }
  }
}
