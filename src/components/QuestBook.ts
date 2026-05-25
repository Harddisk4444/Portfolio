/**
 * Quest Log & Certificates Component (Minecraft Style)
 * 30-book enchanted shelf + inline parchment lectern viewer.
 * Strictly NO modal popups — all interactions inline (mobile-safe).
 * Asset paths MUST use `./assets/...` (Vite base: './').
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
  description: string;
  image?: string;  // Must start with ./assets/... to match Vite base: './'
  verifyUrl: string;
  spineLabel?: string;
}

// ── Projects (Quest Cards) ────────────────────────────────────────────────────
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
    description: 'Configured a high-throughput transaction storage system using Python, Redis connection pools, and distributed token-bucket rate limiters. Holds system stability under heavy concurrent load.',
    rewardXP: 300,
    tech: ['Python', 'gRPC', 'Redis', 'Kubernetes']
  }
];

// ── Certificates (29 fully annotated) ─────────────────────────────────────────
// RULE: ALL image paths MUST begin with ./assets/ — required by Vite base: './'
const CERTS_DB: Certificate[] = [
  {
    id: 'cert_1',
    title: 'AI Skills for All',
    issuer: 'Microsoft / LinkedIn',
    date: '2024',
    description: 'Validates foundational knowledge of artificial intelligence concepts, tools, and applications for diverse professional environments.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/AI Skills for All - 2024.jpg',
    spineLabel: 'AI-ALL'
  },
  {
    id: 'cert_2',
    title: 'Assess for Success: Marketing Analytics and Measurement',
    issuer: 'Google',
    date: '2023',
    description: 'Competency in digital marketing analytics, key performance indicators (KPIs), and data-driven strategy optimization.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Assess for Success Marketing Analytics and Measurement - 2023.jpg',
    spineLabel: 'MKTG-ANL'
  },
  {
    id: 'cert_3',
    title: 'Attract and Engage Customers with Digital Marketing',
    issuer: 'Google',
    date: '2023',
    description: 'Covers Search Engine Optimization (SEO), Search Engine Marketing (SEM), and customer attraction strategies.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Attract and Engage Customers with Digital Marketing - 2023.jpg',
    spineLabel: 'DIGI-MKT'
  },
  {
    id: 'cert_4',
    title: 'Basic Cybersecurity',
    issuer: 'CSDC / CIS',
    date: '2023',
    description: 'Demonstrates essential knowledge in threat modeling, secure passwords, data privacy, and safe computing practices.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Basic Cybersecurity - 2023.jpg',
    spineLabel: 'CYBER'
  },
  {
    id: 'cert_5',
    title: 'Cooperative & Work-Integrated Education (CWIE)',
    issuer: 'CWIE Association',
    date: '2024',
    description: 'Certifies professional readiness, standards-aligned workplace training, and industry-academic integrated projects.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/CWIE - 2024.jpg',
    spineLabel: 'CWIE'
  },
  {
    id: 'cert_6',
    title: 'AI for Smart Office',
    issuer: 'Smart Academy',
    date: '2026',
    description: 'Validates expertise in using generative AI tools to streamline administrative operations, automate documentation, and optimize office tasks.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Certificate_for_AI_for_Smart_Office - 2026.jpg',
    spineLabel: 'SMART-AI'
  },
  {
    id: 'cert_7',
    title: 'Certified Cybersecurity Educator Professional (CCEP)',
    issuer: 'NCSA',
    date: '2025',
    description: 'Validates capabilities to educate academic and corporate entities on modern cyber threat protection and response frameworks.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Certified Cybersecurity Educator Professional (CCEP) - 2025.jpg',
    spineLabel: 'CCEP'
  },
  {
    id: 'cert_8',
    title: 'ISC2 Certified in Cybersecurity (CC)',
    issuer: 'ISC2',
    date: '2024',
    description: 'Demonstrates entry-level mastery of foundational security principles, incident handling, access control, and network security concepts.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Certified in Cybersecurity (CC)- 2024.jpg',
    spineLabel: 'ISC2-CC'
  },
  {
    id: 'cert_9',
    title: 'Cybersecurity Foundation Course',
    issuer: 'NCSA',
    date: '2024',
    description: 'Covers fundamentals of system security, secure architecture, and tactical network defense mechanisms.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Cybersecurity Foundation Course - 2024.jpg',
    spineLabel: 'CS-FOUND'
  },
  {
    id: 'cert_10',
    title: 'Digital Forensics Essentials',
    issuer: 'EC-Council',
    date: '2023',
    description: 'Validates core concepts of digital forensics, evidence acquisition, file system analysis, and incident investigations.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Digital Forensics Essentials - 2023.jpg',
    spineLabel: 'DFE'
  },
  {
    id: 'cert_11',
    title: 'Digital Government Act Certification',
    issuer: 'DGA',
    date: '2026',
    description: 'Demonstrates thorough understanding of public sector governance, legal frameworks, and digital service standards in Thailand.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Digital Government Act - 2026.jpg',
    spineLabel: 'DGA-ACT'
  },
  {
    id: 'cert_12',
    title: 'DownUnderCTF Competitor',
    issuer: 'DUCTF',
    date: '2023',
    description: 'Recognizes participation and solving of complex challenges in reverse engineering, cryptography, web exploitation, and pwn.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/DownUnderCTF - 2023.jpg',
    spineLabel: 'DUCTF'
  },
  {
    id: 'cert_13',
    title: 'Ethical Hacking Essentials',
    issuer: 'EC-Council',
    date: '2023',
    description: 'Validates basic capability in network assessment, password cracking, web exploits, and system penetration testing.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Ethical Hacking Essentials - 2023.jpg',
    spineLabel: 'EHE'
  },
  {
    id: 'cert_14',
    title: 'Foundations of Digital Marketing and E-commerce',
    issuer: 'Google',
    date: '2023',
    description: 'Google Professional Certificate course validating baseline concepts of digital marketing channels and online sales models.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Foundations of Digital Marketing and E-commerce - 2023.jpg',
    spineLabel: 'MKTG-FND'
  },
  {
    id: 'cert_15',
    title: 'From Likes to Leads: Interact with Customers Online',
    issuer: 'Google',
    date: '2023',
    description: 'Focuses on strategic social media marketing campaigns, organic engagement metrics, and social customer support.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/From Likes to Leads Interact with Customers Online - 2023.jpg',
    spineLabel: 'LKS-LEAD'
  },
  {
    id: 'cert_16',
    title: 'IC3 GS6 Level 1 Certification',
    issuer: 'Certiport',
    date: '2023',
    description: 'Certifies fundamental global digital literacy standards, including computing systems, network connection, and digital citizenship.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/IC3 GS6 LEVEL1 - 2023.jpg',
    spineLabel: 'IC3-GS6'
  },
  {
    id: 'cert_17',
    title: 'Make the Sale: Build, Launch, and Manage Ecommerce Stores',
    issuer: 'Google',
    date: '2023',
    description: 'Covers design and management of online storefronts, Shopify integration, inventory flows, and conversion metrics.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Make the Sale Build, Launch, and Manage Ecommerce Stores - 2023.jpg',
    spineLabel: 'ECOMM'
  },
  {
    id: 'cert_18',
    title: 'Microsoft 365 Copilot Practitioner',
    issuer: 'Microsoft',
    date: '2024',
    description: 'Certifies operational competence in prompt engineering, administrative workflows, and leveraging Copilot AI tools.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Microsoft 365 Copilot - 2024.jpg',
    spineLabel: 'M365-COP'
  },
  {
    id: 'cert_19',
    title: 'Network Defense Essentials',
    issuer: 'EC-Council',
    date: '2023',
    description: 'Validates foundational network security skills, including firewall tuning, secure protocol configurations, and IDPS monitoring.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Network Defense Essentials - 2023.jpg',
    spineLabel: 'NDE'
  },
  {
    id: 'cert_20',
    title: 'PSRU Cyber Hackathon 2023 (Team Achievement)',
    issuer: 'PSRU',
    date: '2023',
    description: 'Recognizes team excellence and complex vulnerability exploitation challenge resolution during the PSRU Cyber Hackathon.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/PSRU CYBER HACKATHON 2023 - 02.jpg',
    spineLabel: 'PSRU-H02'
  },
  {
    id: 'cert_21',
    title: 'PSRU Cyber Hackathon 2023',
    issuer: 'PSRU',
    date: '2023',
    description: 'Recognizes competitor role and successful defense simulations in PSRU\'s annual cybersecurity hackathon.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/PSRU CYBER HACKATHON 2023.jpg',
    spineLabel: 'PSRU-H23'
  },
  {
    id: 'cert_22',
    title: 'Satisfaction Guaranteed: Customer Loyalty Online',
    issuer: 'Google',
    date: '2023',
    description: 'Covers customer relationship management, digital service performance, post-sale workflows, and NPS metric tracking.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Satisfaction Guaranteed Develop Customer Loyalty Online - 2023.jpg',
    spineLabel: 'LOYALTY'
  },
  {
    id: 'cert_23',
    title: 'Thailand Cyber Top Talent 2024',
    issuer: 'NCSA',
    date: '2024',
    description: 'Recognizes high CTF proficiency and cybersecurity capabilities in the Thailand Cyber Top Talent competition organized by NCSA.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Thailand Cyber Top Talent 2024.jpg',
    spineLabel: 'TCTT-24'
  },
  {
    id: 'cert_24',
    title: 'Thailand\'s National Cyber Exercise 2024',
    issuer: 'NCSA',
    date: '2024',
    description: 'Recognizes active participation in the nationwide simulation of cyber incident responses, defense procedures, and collaborative mitigation.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Thailand\'s National Cyber Exercise 2024.jpg',
    spineLabel: 'NCX-2024'
  },
  {
    id: 'cert_25',
    title: 'Thailand\'s National Cyber Exercise 2025',
    issuer: 'NCSA',
    date: '2025',
    description: 'Active participant in nationwide tabletop exercises and simulated threat responses for critical information infrastructure.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Thailand\'s National Cyber Exercise 2025 (NCX 2025).jpg',
    spineLabel: 'NCX-2025'
  },
  {
    id: 'cert_26',
    title: 'Think Outside the Inbox: Email Marketing',
    issuer: 'Google',
    date: '2023',
    description: 'Google Professional Certificate course validating core techniques in designing automation flows, list splits, and A/B test setups.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Think Outside the Inbox Email Marketing - 2023.jpg',
    spineLabel: 'EMAIL-MK'
  },
  {
    id: 'cert_27',
    title: 'Threat Hunting Endgame Workshop',
    issuer: 'NCSA',
    date: '2025',
    description: 'Advanced endpoint security workshop validating memory analysis, registry auditing, and indicators of compromise (IoC) tracking.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/Threat Hunting Endgame Workshop 2025.jpg',
    spineLabel: 'ENDGAME'
  },
  {
    id: 'cert_28',
    title: 'Digital Forensics & Incident Response',
    issuer: 'SecOps',
    date: '2024',
    description: 'Demonstrates mastery in rapid threat containment, event reconstruction, forensic log parsing, and live endpoint triage.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/dfir - 2024.jpg',
    spineLabel: 'DFIR'
  },
  {
    id: 'cert_29',
    title: 'Digital Forensics & Incident Response (Advanced)',
    issuer: 'SecOps',
    date: '2024',
    description: 'Advanced competencies in root-cause analysis, complex registry forensication, and malware execution tracking.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/dfir - 2024_02.jpg',
    spineLabel: 'DFIR-ADV'
  }
];

// ── Component ─────────────────────────────────────────────────────────────────
export class QuestBook {
  private questsContainer: HTMLElement | null;
  private certsContainer: HTMLElement | null;
  private detailsPanel: HTMLElement | null;
  private toasterElement: HTMLElement | null;
  private game: GameManager;
  private activeBookId: string | null = null;

  constructor(questsId: string, certsId: string, toasterId: string, game: GameManager) {
    this.questsContainer = document.getElementById(questsId);
    this.certsContainer  = document.getElementById(certsId);
    this.detailsPanel    = document.getElementById('cert-details-panel');
    this.toasterElement  = document.getElementById(toasterId);
    this.game = game;

    if (this.questsContainer) this.renderQuests();
    if (this.certsContainer)  this.renderCerts();

    this.game.onStateChange(() => {
      this.updateQuestStatus();
    });

    // Auto-select first certificate on load
    if (CERTS_DB.length > 0) {
      const first = CERTS_DB[0];
      this.activeBookId = first.id;
      const firstBook = document.getElementById(`container-${first.id}`);
      firstBook?.classList.add('flipped');
      this.showCertDetails(first);
    }
  }

  // ── Inline parchment lectern ─────────────────────────────────────────────
  private showCertDetails(cert: Certificate) {
    if (!this.detailsPanel) return;

    const imgSrc = cert.image ?? '';
    const descLines = sanitizeHTML(cert.description)
      .split('\n')
      .map(l => `<span>${l}</span>`)
      .join('<br>');

    this.detailsPanel.innerHTML = `
      <div class="cert-lectern-scroll">
        <div class="cert-lectern-header">
          <div class="cert-lectern-title">${sanitizeHTML(cert.title)}</div>
          <div class="cert-lectern-meta">
            <span class="cert-issuer-badge">${sanitizeHTML(cert.issuer)}</span>
            <span class="cert-date-badge">${sanitizeHTML(cert.date)}</span>
          </div>
        </div>
        ${imgSrc ? `
        <div class="cert-lectern-image-wrap">
          <a href="${sanitizeHTML(imgSrc)}" target="_blank" rel="noopener noreferrer"
             aria-label="Open full-resolution scan: ${sanitizeHTML(cert.title)}">
            <img
              src="${sanitizeHTML(imgSrc)}"
              alt="Certificate scan: ${sanitizeHTML(cert.title)}"
              class="cert-lectern-image"
              loading="lazy"
              decoding="async"
            >
            <div class="cert-lectern-zoom-hint">🔍 Click to open full resolution scan</div>
          </a>
        </div>
        ` : ''}
        <div class="cert-lectern-desc">${descLines}</div>
        <div class="cert-lectern-footer">
          <a href="${sanitizeHTML(cert.verifyUrl)}"
             target="_blank" rel="noopener noreferrer"
             class="btn-minecraft"
             style="font-size:10px;padding:8px 16px;width:auto;display:inline-block;text-decoration:none;">
            ✅ VERIFY CREDENTIAL
          </a>
        </div>
      </div>
    `;
  }

  // ── Quest cards ──────────────────────────────────────────────────────────
  private renderQuests() {
    if (!this.questsContainer) return;
    this.questsContainer.innerHTML = '';

    QUESTS_DB.forEach(quest => {
      const card = document.createElement('div');
      card.className = 'quest-card';
      card.id = quest.id;

      const techBadges = quest.tech
        .map(t => `<span style="background-color:var(--color-obsidian-border);font-size:14px;padding:2px 6px;border:1px solid #444;border-radius:4px;margin-right:4px;">${sanitizeHTML(t)}</span>`)
        .join('');

      card.innerHTML = `
        <div class="quest-header">
          <span class="quest-title">${sanitizeHTML(quest.title)}</span>
          <span class="quest-status text-red" id="status-${quest.id}">[ACTIVE]</span>
        </div>
        <p class="quest-desc" style="margin-bottom:12px;">${sanitizeHTML(quest.description)}</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${techBadges}</div>
        <div style="font-size:14px;color:var(--color-mc-text-yellow);">Reward: +${quest.rewardXP} XP</div>
      `;

      card.addEventListener('click', () => {
        const state = this.game.getState();
        if (!state.completedQuests.includes(quest.id)) {
          this.game.completeQuest(quest.id);
          this.triggerToast('🏆', `Quest Completed! [${quest.title}]`);
        } else {
          synth.playClick();
        }
      });

      this.questsContainer!.appendChild(card);
    });

    this.updateQuestStatus();
  }

  // ── 3D flip bookshelf ────────────────────────────────────────────────────
  private renderCerts() {
    if (!this.certsContainer) return;
    this.certsContainer.innerHTML = '';

    CERTS_DB.forEach(cert => {
      const book = document.createElement('div');
      book.className = 'certificate-book-container';
      book.id = `container-${cert.id}`;
      book.setAttribute('role', 'button');
      book.setAttribute('tabindex', '0');
      book.setAttribute('aria-label', `Inspect credential: ${cert.title}`);

      const spineLabel = (cert.spineLabel || cert.issuer.split(' ')[0]).substring(0, 8).toUpperCase();

      book.innerHTML = `
        <div class="certificate-book-inner">
          <div class="book-front">
            <div class="book-spine-text">${sanitizeHTML(spineLabel)}</div>
          </div>
          <div class="book-back">
            <div class="book-back-spine">${sanitizeHTML(cert.title.substring(0, 18))}…</div>
            <div style="font-size:7px;color:#5a3c1e;margin:4px 0;text-align:center;">
              ${sanitizeHTML(cert.issuer.split('/')[0].trim())} (${sanitizeHTML(cert.date)})
            </div>
          </div>
        </div>
      `;

      const handleSelect = (e: Event) => {
        if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        synth.playClick();

        // Exclusive flip — close previously active book
        if (this.activeBookId && this.activeBookId !== cert.id) {
          document.getElementById(`container-${this.activeBookId}`)?.classList.remove('flipped');
        }

        // Toggle or open
        const alreadyActive = (this.activeBookId === cert.id) && book.classList.contains('flipped');
        if (alreadyActive) {
          book.classList.remove('flipped');
          this.activeBookId = null;
        } else {
          book.classList.add('flipped');
          this.activeBookId = cert.id;
          this.showCertDetails(cert);

          // Grant XP first-time discovery
          const state = this.game.getState();
          if (!state.readCerts.includes(cert.id)) {
            this.game.readCert(cert.id);
            this.triggerToast('✨', `Credential Discovered: ${cert.title}`);
          }
        }
      };

      book.addEventListener('click', handleSelect);
      book.addEventListener('keydown', handleSelect);

      this.certsContainer!.appendChild(book);
    });
  }

  // ── Quest visual state sync ──────────────────────────────────────────────
  private updateQuestStatus() {
    const state = this.game.getState();
    QUESTS_DB.forEach(quest => {
      const card = document.getElementById(quest.id);
      const statusEl = document.getElementById(`status-${quest.id}`);
      if (!card || !statusEl) return;

      if (state.completedQuests.includes(quest.id)) {
        card.classList.add('completed');
        statusEl.textContent = '[COMPLETED]';
        statusEl.className = 'quest-status text-green';
      } else {
        card.classList.remove('completed');
        statusEl.textContent = '[ACTIVE]';
        statusEl.className = 'quest-status text-red';
      }
    });
  }

  // ── Minecraft advancement toast ──────────────────────────────────────────
  private triggerToast(icon: string, text: string) {
    if (!this.toasterElement) return;
    this.toasterElement.innerHTML = `
      <div class="advancement-icon">${icon}</div>
      <div class="advancement-text">
        <span class="advancement-challenge">Advancement Made!</span>
        <span class="advancement-title">${sanitizeHTML(text)}</span>
      </div>
    `;
    this.toasterElement.classList.remove('hidden');
    setTimeout(() => this.toasterElement!.classList.add('hidden'), 4000);
  }
}
