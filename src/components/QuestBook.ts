/**
 * Quest Log & Certificates Component (Minecraft Style)
 * Orchestrates Book-and-Quill modals, page flipping, and Achievement/Advancement Toasts.
 */

import { GameManager, synth } from '../core/gameEngine';
import { sanitizeHTML } from '../core/security';

interface Quest {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  tech: string[];
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  pages: string[]; // Content segmented per page inside the Book & Quill UI
  verifyUrl: string;
  image?: string; // Image path for certificate scan/badge
}

const QUESTS_DB: Quest[] = [
  {
    id: 'quest_1',
    title: 'Zero-Trust Gatekeeper',
    description: 'Engineered a highly resilient Go microservices API gateway integrated with HashiCorp Vault. Enforces strict zero-trust token checking with sub-millisecond overhead.',
    rewardXP: 300,
    tech: ['Go', 'HashiCorp Vault', 'Docker', 'Kubernetes']
  },
  {
    id: 'quest_2',
    title: 'Redstone SecOps Pipeline',
    description: 'Constructed an automated DevSecOps build and audit conveyor utilizing GitHub Actions. Performs static analysis (SAST), software composition analysis (SCA), and dependency checks.',
    rewardXP: 300,
    tech: ['GitHub Actions', 'Trivy', 'SonarQube', 'Docker']
  },
  {
    id: 'quest_3',
    title: 'Obsidian Cache Ledger',
    description: 'Configured a transaction storage system using Python, Redis connection pools, and distributed token-bucket rate limiters. Holds system stability under high concurrent stress.',
    rewardXP: 300,
    tech: ['Python', 'gRPC', 'Redis', 'Kubernetes']
  }
];

const CERTS_DB: Certificate[] = [
  {
    id: 'cert_cc',
    title: 'ISC2 Certified in Cybersecurity (CC)',
    issuer: 'ISC2',
    date: '2025',
    pages: [
      'Certified in Cybersecurity (CC) by ISC2\n\nThis epic badge validates deep mastery of foundational security principles, incident handling, access control, and network security concepts.',
      'Validated Domains:\n- Security Principles\n- Business Continuity (BC), Disaster Recovery (DR)\n- Access Controls Concepts\n- Network Security & Operations'
    ],
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: 'assets/images/badges/certified-in-cybersecurity-cc.png'
  },
  {
    id: 'cert_secplus',
    title: 'CompTIA Security+',
    issuer: 'CompTIA',
    date: '2025',
    pages: [
      'CompTIA Security+ Certification\n\nValidates the core knowledge required to execute essential security functions and pursue an active career in cybersecurity operations and DevSecOps engineering.',
      'Fortified Domains:\n- Attacks, Threats & Vulnerabilities\n- Architecture & Secure Design\n- Implementation & Network Operations\n- Governance, Risk & Compliance'
    ],
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: 'assets/images/certificates/1240867619970528.jpg'
  },
  {
    id: 'cert_google',
    title: 'Google Cybersecurity Certificate',
    issuer: 'Google / Coursera',
    date: '2025',
    pages: [
      'Google Cybersecurity Professional\n\nThis enchanted tome marks verified competence in utilizing security information and event management (SIEM) tools, intrusion detection, and Python automation.',
      'Secured Tools:\n- Python & Linux OS\n- SQL Database Querying\n- Chronicle & Splunk SIEM\n- Wireshark Network Packet Sniffing'
    ],
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: 'assets/images/certificates/1240867623303861.jpg'
  },
  {
    id: 'cert_ejpt',
    title: 'eLearnSecurity Junior Penetration Tester (eJPT)',
    issuer: 'eLearnSecurity / INE',
    date: '2025',
    pages: [
      'eLearnSecurity Certified Junior Penetration Tester (eJPT)\n\nValidates hands-on capabilities in penetration testing, network assessment, web application exploits, and offensive security methodologies.',
      'Offensive Powers:\n- IP Routing & Network Pivoting\n- Vulnerability Assessment\n- Metasploit & Nmap Recon\n- Web App Penetration Exploiting'
    ],
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: 'assets/images/certificates/1240867703303853.jpg'
  }
];

export class QuestBook {
  private questsContainer: HTMLDivElement;
  private certsContainer: HTMLDivElement;
  private toasterElement: HTMLDivElement;
  private game: GameManager;

  constructor(questsId: string, certsId: string, toasterId: string, game: GameManager) {
    this.questsContainer = document.getElementById(questsId) as HTMLDivElement;
    this.certsContainer = document.getElementById(certsId) as HTMLDivElement;
    this.toasterElement = document.getElementById(toasterId) as HTMLDivElement;
    this.game = game;

    this.renderQuests();
    this.renderCerts();
    this.game.onStateChange(() => {
      this.updateQuestStatus();
    });
  }

  private renderQuests() {
    this.questsContainer.innerHTML = '';
    
    QUESTS_DB.forEach((quest) => {
      const card = document.createElement('div');
      card.className = 'quest-card';
      card.id = quest.id;
      
      const techBadges = quest.tech.map(t => `<span style="background-color: var(--color-obsidian-border); font-size: 14px; padding: 2px 6px; border: 1px solid #444; border-radius: 4px; margin-right: 4px;">${t}</span>`).join('');

      card.innerHTML = `
        <div class="quest-header">
          <span class="quest-title">${sanitizeHTML(quest.title)}</span>
          <span class="quest-status text-red" id="status-${quest.id}">[ACTIVE]</span>
        </div>
        <p class="quest-desc" style="margin-bottom: 12px;">${sanitizeHTML(quest.description)}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">${techBadges}</div>
        <div style="font-size: 14px; color: var(--color-mc-text-yellow);">Reward: +${quest.rewardXP} XP</div>
      `;

      // Event listener: Clicking a project completes the quest and triggers the advancement toaster!
      card.addEventListener('click', () => {
        const state = this.game.getState();
        if (!state.completedQuests.includes(quest.id)) {
          this.game.completeQuest(quest.id);
          this.triggerAdvancementToast('🏆', `Quest Completed! [${quest.title}]`);
        } else {
          synth.playClick();
        }
      });

      this.questsContainer.appendChild(card);
    });

    this.updateQuestStatus();
  }

  private updateQuestStatus() {
    const state = this.game.getState();
    QUESTS_DB.forEach((quest) => {
      const card = document.getElementById(quest.id);
      const statusText = document.getElementById(`status-${quest.id}`);
      
      if (card && statusText) {
        if (state.completedQuests.includes(quest.id)) {
          card.classList.add('completed');
          statusText.textContent = '[COMPLETED]';
          statusText.className = 'quest-status text-green';
        } else {
          card.classList.remove('completed');
          statusText.textContent = '[ACTIVE]';
          statusText.className = 'quest-status text-red';
        }
      }
    });
  }

  private renderCerts() {
    this.certsContainer.innerHTML = '';
    
    CERTS_DB.forEach((cert) => {
      const bookContainer = document.createElement('div');
      bookContainer.className = 'certificate-book-container';
      bookContainer.id = `container-${cert.id}`;
      bookContainer.setAttribute('aria-label', `Verify ${cert.title}`);
      
      const spineLabel = cert.issuer.split(' ')[0];

      bookContainer.innerHTML = `
        <div class="certificate-book-inner">
          <!-- Book Front Cover -->
          <div class="book-front">
            <div class="book-spine-text" style="font-family: var(--font-title); font-size: 8px; color: var(--color-mc-text-yellow); writing-mode: vertical-rl; text-orientation: mixed; pointer-events: none;">
              ${spineLabel}
            </div>
          </div>
          <!-- Book Back Cover / Credentials Details -->
          <div class="book-back">
            <div class="book-back-spine">${sanitizeHTML(cert.title.substring(0, 20))}...</div>
            <div style="font-size: 7px; color: #5a3c1e; margin: 4px 0; text-align: center;">${sanitizeHTML(cert.issuer)} (${cert.date})</div>
            <a href="${cert.verifyUrl}" target="_blank" class="btn-book-action" style="text-decoration:none;">VERIFY</a>
          </div>
        </div>
      `;

      // Flip card on tap/click
      bookContainer.addEventListener('click', (e) => {
        // Prevent click events inside the links from re-flipping
        if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).classList.contains('btn-book-action')) {
          return;
        }

        synth.playClick();
        bookContainer.classList.toggle('flipped');

        // Grant XP for discovering/flipping verified credentials the first time!
        const state = this.game.getState();
        if (!state.readCerts.includes(cert.id)) {
          this.game.readCert(cert.id);
          this.triggerAdvancementToast('✨', `Credential Discovered: ${cert.title}`);
        }
      });

      this.certsContainer.appendChild(bookContainer);
    });
  }

  private triggerAdvancementToast(icon: string, text: string) {
    // Generate advancement toast popup HUD
    this.toasterElement.innerHTML = `
      <div class="advancement-icon">${icon}</div>
      <div class="advancement-text">
        <span class="advancement-challenge">Advancement Made!</span>
        <span class="advancement-title">${sanitizeHTML(text)}</span>
      </div>
    `;

    this.toasterElement.classList.remove('hidden');

    // Slide away after 4 seconds
    setTimeout(() => {
      this.toasterElement.classList.add('hidden');
    }, 4000);
  }
}
