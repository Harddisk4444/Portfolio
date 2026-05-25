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

// ── Certificates (4 fully annotated) ─────────────────────────────────────────
// RULE: ALL image paths MUST begin with ./assets/ — required by Vite base: './'
const CERTS_DB: Certificate[] = [
  {
    id: 'cert_cc',
    title: 'ISC2 Certified in Cybersecurity (CC)',
    issuer: 'ISC2',
    date: '2025',
    description: 'Validates deep mastery of foundational security principles, incident handling, access control, and network security concepts.\n\nDomains: Security Principles · Business Continuity & DR · Access Controls · Network Security & Operations',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/badges/certified-in-cybersecurity-cc.png'
  },
  {
    id: 'cert_secplus',
    title: 'CompTIA Security+',
    issuer: 'CompTIA',
    date: '2025',
    description: 'Validates core knowledge required to execute essential security functions and pursue an active career in cybersecurity operations and DevSecOps engineering.\n\nDomains: Attacks & Threats · Architecture & Secure Design · Implementation · Governance, Risk & Compliance',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/1240867619970528.jpg'
  },
  {
    id: 'cert_google',
    title: 'Google Cybersecurity Certificate',
    issuer: 'Google / Coursera',
    date: '2025',
    description: 'Verified competence in SIEM tools, intrusion detection, and Python automation for security operations.\n\nTools: Python · Linux OS · SQL · Chronicle & Splunk SIEM · Wireshark',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/1240867623303861.jpg'
  },
  {
    id: 'cert_ejpt',
    title: 'eLearnSecurity Junior Penetration Tester (eJPT)',
    issuer: 'eLearnSecurity / INE',
    date: '2025',
    description: 'Validates hands-on capabilities in penetration testing, network assessment, web app exploits, and offensive security methodologies.\n\nSkills: IP Routing · Network Pivoting · Vulnerability Assessment · Metasploit & Nmap · Web App Pentesting',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: './assets/images/certificates/1240867703303853.jpg'
  }
];

// ── Remaining 26 scans — dynamically hydrated ─────────────────────────────────
// IMPORTANT: `./assets/...` prefix is mandatory for Vite base: './' / GitHub Pages
const EXTRA_CERT_FILES: string[] = [
  '1240867739970516.jpg', '1240867766637180.jpg', '1240867843303839.jpg',
  '1240867926637164.jpg', '1247689022621721.jpg', '1329827694407853.jpg',
  '1329827757741180.jpg', '1330780830979206.jpg', '1336439560413333.jpg',
  '1366693534054602.jpg', '1366693537387935.jpg', '1366693550721267.jpg',
  '1404795026911119.jpg', '1430153367708618.jpg', '1443775599679728.jpg',
  '1570172617040025.jpg', '1573339500056670.jpg', '1585293075527979.jpg',
  '1609409406449679.jpg', '1609409433116343.jpg', '1663229381067681.jpg',
  '1860383841352233.jpg', '1882309245826359.jpg', '1933322450725038.jpg',
  '1933954700661813.jpg', '1981712415886041.jpg',
];

EXTRA_CERT_FILES.forEach((filename, idx) => {
  CERTS_DB.push({
    id: `cert_extra_${idx + 1}`,
    title: `Security Credential #${idx + 5}`,
    issuer: 'Verified Academy',
    date: '2024–2025',
    description: 'An officially verified credential demonstrating achievement and competency in cybersecurity, networking, or information technology disciplines.\n\nClick the scan to open at full resolution.',
    verifyUrl: 'https://www.facebook.com/media/set/?set=a.1240868353303788&type=3',
    image: `./assets/images/certificates/${filename}` // MUST keep ./  prefix
  });
});

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

      const spineLabel = cert.issuer.split(' ')[0].substring(0, 8);

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
