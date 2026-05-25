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
    image: 'assets/images/certificates/cert_1.jpg'
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
    image: 'assets/images/certificates/cert_2.jpg'
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
    image: 'assets/images/certificates/cert_3.jpg'
  }
];

export class QuestBook {
  private questsContainer: HTMLDivElement;
  private certsContainer: HTMLDivElement;
  private modalContainer: HTMLDivElement;
  private toasterElement: HTMLDivElement;
  private game: GameManager;

  // Active book page state
  private activeCert: Certificate | null = null;
  private activePage: number = 0;

  constructor(questsId: string, certsId: string, modalId: string, toasterId: string, game: GameManager) {
    this.questsContainer = document.getElementById(questsId) as HTMLDivElement;
    this.certsContainer = document.getElementById(certsId) as HTMLDivElement;
    this.modalContainer = document.getElementById(modalId) as HTMLDivElement;
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
      const book = document.createElement('div');
      book.className = 'certificate-book enchanted';
      book.id = cert.id;
      book.setAttribute('aria-label', `View ${cert.title}`);
      
      // Simple spine label layout
      book.innerHTML = `
        <div class="book-spine-text">${cert.issuer.split(' ')[0]}</div>
      `;

      book.addEventListener('click', () => {
        this.openBook(cert);
      });

      this.certsContainer.appendChild(book);
    });
  }

  private openBook(cert: Certificate) {
    synth.playClick();
    this.activeCert = cert;
    this.activePage = 0;

    // Grant XP for reading the verified credentials
    const state = this.game.getState();
    if (!state.readCerts.includes(cert.id)) {
      this.game.readCert(cert.id);
      this.triggerAdvancementToast('✨', `Challenge Complete! [${cert.title}]`);
    }

    this.renderBookModal();
    this.modalContainer.classList.remove('hidden');
  }

  private renderBookModal() {
    if (!this.activeCert) return;

    const cert = this.activeCert;
    const pageContent = cert.pages[this.activePage] || '';
    const totalPages = cert.pages.length;

    this.modalContainer.innerHTML = `
      <div class="book-modal">
        <span class="book-modal-close" id="btn-book-close">&times;</span>
        
        <div class="book-pages-container">
          <div class="book-title">${sanitizeHTML(cert.title)}</div>
          <p class="book-content-text">${sanitizeHTML(pageContent).replace(/\n/g, '<br>')}</p>
          ${this.activePage === totalPages - 1 && cert.image 
            ? `<div style="display: flex; justify-content: center; margin-top: 15px;">
                <img src="${cert.image}" alt="${sanitizeHTML(cert.title)}" style="max-height: 160px; max-width: 100%; border: 4px solid #8c6b4f; border-radius: 4px; box-shadow: 2px 2px 0 rgba(0,0,0,0.15);">
               </div>` 
            : ''
          }
        </div>
        
        <div class="book-footer">
          <button id="btn-book-prev" class="btn-book-nav" ${this.activePage === 0 ? 'style="visibility: hidden;"' : ''}>&lt;</button>
          
          <span class="book-page-indicator">PAGE ${this.activePage + 1} OF ${totalPages}</span>
          
          ${this.activePage === totalPages - 1 
            ? `<a href="${cert.verifyUrl}" target="_blank" class="btn-book-nav" style="text-decoration:none; text-align:center;">VERIFY</a>` 
            : `<button id="btn-book-next" class="btn-book-nav">&gt;</button>`
          }
        </div>
      </div>
    `;

    // Hook up modal closing and navigation
    document.getElementById('btn-book-close')?.addEventListener('click', () => {
      this.closeBook();
    });

    document.getElementById('btn-book-prev')?.addEventListener('click', () => {
      synth.playClick();
      if (this.activePage > 0) {
        this.activePage--;
        this.renderBookModal();
      }
    });

    document.getElementById('btn-book-next')?.addEventListener('click', () => {
      synth.playClick();
      if (this.activeCert && this.activePage < this.activeCert.pages.length - 1) {
        this.activePage++;
        this.renderBookModal();
      }
    });
  }

  private closeBook() {
    synth.playClick();
    this.modalContainer.classList.add('hidden');
    this.activeCert = null;
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
