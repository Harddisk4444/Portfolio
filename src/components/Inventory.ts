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
    id: 'k8s',
    name: 'Kubernetes Trident',
    level: 95,
    quality: 'Enchanted Grade',
    type: 'Siege Weapon',
    icon: '🔱',
    stats: ['+95% Pod Orchestration', '+98% Auto-healing Scalability'],
    enchantments: ['Multi-Cluster Orchestration V', 'Zero-Downtime Deployment IV'],
    description: 'A legendary multi-pronged weapon capable of summoning and balancing massive clusters of high-availability containers.'
  },
  {
    id: 'ts',
    name: 'TypeScript Infinity Bow',
    level: 96,
    quality: 'Netherite Grade',
    type: 'Ranged Weapon',
    icon: '🏹',
    stats: ['+96% Type Integrity', '+95% Code Safety Compile'],
    enchantments: ['Strict Type Casting V', 'Zero-Null Exception IV'],
    description: 'Fires high-speed secure arrows that lock type definitions permanently. Guarantees compile-time validation and zero runtime crashes.'
  },
  {
    id: 'docker',
    name: 'Docker Sealed Box',
    level: 90,
    quality: 'Diamond Grade',
    type: 'Defense Gear',
    icon: '📦',
    stats: ['+90% Layer Optimization', '+92% Container Hardening'],
    enchantments: ['Obsidian Container Isolation V', 'Alpine Micro-Image IV'],
    description: 'Seals complex microservices packages securely inside highly optimized, pristine sandbox layers to prevent host intrusion.'
  },
  {
    id: 'python',
    name: 'Python Command Blade',
    level: 92,
    quality: 'Emerald Grade',
    type: 'Melee Weapon',
    icon: '🗡️',
    stats: ['+92% Script Automation', '+90% API Bite Rate'],
    enchantments: ['Deep Machine Library V', 'Rapid Socket Scripting IV'],
    description: 'A sharp, rapid blade that scripts automation pipelines and parses custom protocols with minimal latency.'
  },
  {
    id: 'go',
    name: 'Go Iron Pickaxe',
    level: 85,
    quality: 'Enchanted Grade',
    type: 'Gathering Tool',
    icon: '⛏️',
    stats: ['+85% Concurrency Mining', '+90% Execution Speed'],
    enchantments: ['Goroutine Thread Multiplier V', 'Garbage Cleanse IV'],
    description: 'A lightning-fast pickaxe specialized in digging high-throughput microservices structures with concurrent goroutines.'
  },
  {
    id: 'linux',
    name: 'Obsidian chestplate',
    level: 94,
    quality: 'Netherite Grade',
    type: 'Defense Armor',
    icon: '👕',
    stats: ['+94% Host System Hardening', '+96% Privilege Isolation'],
    enchantments: ['Least Privilege Aegis V', 'Kernel Lockout IV'],
    description: 'Forged chestplate that isolates systems, shielding host kernels and isolating namespaces from malicious breach attempts.'
  },
  {
    id: 'terraform',
    name: 'Terraform Manifest Scroll',
    level: 88,
    quality: 'Emerald Grade',
    type: 'Magical Artifact',
    icon: '📜',
    stats: ['+88% Infrastructure Manifest', '+90% Repeatable State'],
    enchantments: ['Declarative Build V', 'Multi-Provider Command IV'],
    description: 'Instantly conjures complete cloud networks and container nodes by reciting reproducible HCL configuration scripts.'
  },
  {
    id: 'cicd',
    name: 'Redstone Repeater Crossbow',
    level: 95,
    quality: 'Enchanted Grade',
    type: 'Ranged Weapon',
    icon: '➿',
    stats: ['+95% Pipeline Speed', '+98% Automated Security Audit'],
    enchantments: ['Git Action Automatic V', 'CVE Scan Vulnerability IV'],
    description: 'Fires automated triggers to lint, build, test, and scan codebases for security vulnerabilities on every push.'
  },
  {
    id: 'security',
    name: 'Beacon of WAF Shielding',
    level: 93,
    quality: 'Netherite Grade',
    type: 'Defense Shield',
    icon: '🛡️',
    stats: ['+93% OWASP Top-10 Deflection', '+95% Zero-Trust Beacon'],
    enchantments: ['Secure CSP Radiance V', 'Input Sanitization Protection IV'],
    description: 'Radiates a persistent barrier that filters out malicious payloads and blocks XSS, SQLi, and unauthorized request vectors.'
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
