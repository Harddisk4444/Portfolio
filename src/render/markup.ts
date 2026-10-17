/**
 * Pure HTML renderers.
 * Run at build time by the `static-content` Vite plugin (so every section ships as
 * static HTML: fast LCP, zero layout shift, fully indexable) and in the browser
 * when a panel needs new content.
 */

import { sanitizeHTML as esc } from '../core/security';
import { RING_RANKS, ringLabel } from '../data/rings';
import type { Skill, SkillIcon } from '../data/skills';
import type { Trial } from '../data/trials';
import type { Certificate } from '../data/certs';

// ── Icons (24×24, stroke = currentColor) ──────────────────────────────────────
const ICON_PATHS: Record<SkillIcon, string> = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2v2M12 20v2"/>',
  bow: '<path d="M6 3c6.5 1.6 13.4 8.5 15 15"/><path d="M6 3l15 15"/><path d="M3 21L16 8"/><path d="M16 8h-4.5M16 8v4.5"/>',
  mirror: '<path d="M12 2l8 4.6v9.2L12 20.4 4 15.8V6.6z"/><path d="M8.5 9.5l5 5M11 7.5l5.5 5.5"/>',
  barrier: '<path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  scroll: '<path d="M7 4h11a2.5 2.5 0 0 1 0 5H9"/><path d="M7 4a2.5 2.5 0 0 0-2.5 2.5v11A2.5 2.5 0 0 0 7 20h10a2 2 0 0 0 2-2V9"/><path d="M9 13h7M9 16.5h5"/>'
};

export function icon(name: SkillIcon): string {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}

/** Encode a relative asset path (spaces, apostrophes) for use in src/href. */
export function assetUrl(path: string): string {
  return esc(encodeURI(path).replace(/'/g, '%27'));
}

// ── Spirit ring legend ────────────────────────────────────────────────────────
export function renderRingLegend(): string {
  const items = RING_RANKS
    .map(r => `<li class="legend-item"><span class="ring-swatch tier-${r.tier}" aria-hidden="true"></span>${esc(r.label)}</li>`)
    .join('');
  return `<ul class="ring-legend" aria-label="Spirit ring ranks, weakest to strongest">${items}</ul>`;
}

// ── Skills ────────────────────────────────────────────────────────────────────
export function renderSkillList(skills: Skill[], activeId: string): string {
  const items = skills.map(s => `
        <li>
          <button type="button" class="skill-ring tier-${s.ring}" data-skill="${esc(s.id)}" aria-controls="skill-detail"${s.id === activeId ? ' aria-current="true"' : ''}>
            <span class="skill-ring__medallion" aria-hidden="true">${icon(s.icon)}</span>
            <span class="skill-ring__name">${esc(s.discipline)}</span>
            <span class="skill-ring__lv">Lv ${s.level}</span>
          </button>
        </li>`).join('');
  return `<ul class="skill-rings">${items}
      </ul>`;
}

function renderSkillView(skill: Skill, active: boolean): string {
  const pct = Math.min(100, Math.round((skill.level / 99) * 100));
  const techniques = skill.techniques.map(t => `<li>${esc(t)}</li>`).join('');
  const stats = skill.stats.map(s => `<li>${esc(s)}</li>`).join('');
  return `
          <div class="skill-view tier-${skill.ring}" data-view="${esc(skill.id)}"${active ? '' : ' hidden'}>
            <div class="skill-view__head">
              <span class="skill-view__icon" aria-hidden="true">${icon(skill.icon)}</span>
              <div>
                <p class="eyebrow">${esc(ringLabel(skill.ring))} Spirit Ring · ${esc(skill.kind)}</p>
                <h3 class="skill-view__title">${esc(skill.discipline)}</h3>
                <p class="skill-view__soul">${esc(skill.name)}</p>
              </div>
            </div>
            <div class="power">
              <p class="power__row"><span>Soul Power</span><span>${skill.level} / 99</span></p>
              <div class="power__track" aria-hidden="true"><span class="power__fill" style="width:${pct}%"></span></div>
            </div>
            <div class="skill-view__cols">
              <div>
                <p class="label">Techniques</p>
                <ul class="rune-list rune-list--jade">${techniques}</ul>
              </div>
              <div>
                <p class="label">Attributes</p>
                <ul class="rune-list rune-list--gold">${stats}</ul>
              </div>
            </div>
            <p class="skill-view__desc">${esc(skill.description)}</p>
          </div>`;
}

/**
 * Every view is rendered and stacked in one grid cell; only the active one is visible.
 * The panel is therefore always as tall as the tallest view, so hovering never shifts layout.
 */
export function renderSkillViews(skills: Skill[], activeId: string): string {
  return skills.map(s => renderSkillView(s, s.id === activeId)).join('');
}

// ── Trials (projects) ─────────────────────────────────────────────────────────
export function renderTrials(trials: Trial[]): string {
  return trials.map((t, i) => `
        <article class="trial-card aura-card" data-tilt data-trial="${esc(t.id)}">
          <span class="filigree" aria-hidden="true"></span>
          <div class="trial-card__head">
            <p class="trial-card__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
            <h3 class="trial-card__title">${esc(t.title)}</h3>
          </div>
          <p class="trial-card__status" data-status="${esc(t.id)}">Active trial</p>
          <p class="trial-card__desc">${esc(t.description)}</p>
          <ul class="tech-tags">${t.tech.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          <button type="button" class="btn btn-jade trial-card__claim" data-claim="${esc(t.id)}">Clear trial · +${t.rewardXP} XP</button>
        </article>`).join('');
}

// ── Credentials (jade slips) ──────────────────────────────────────────────────
function spineOf(cert: Certificate): string {
  return (cert.spineLabel || cert.issuer.split(' ')[0]).substring(0, 8).toUpperCase();
}

export function renderCertShelf(certs: Certificate[], activeId: string): string {
  const items = certs.map(c => {
    const spine = spineOf(c);
    const active = c.id === activeId;
    return `
          <li>
            <button type="button" class="slip${active ? ' is-open' : ''}" data-cert="${esc(c.id)}" aria-controls="cert-detail"${active ? ' aria-current="true"' : ''} aria-label="${esc(spine)}: ${esc(c.title)} (${esc(c.date)})">
              <span class="slip__label" aria-hidden="true">${esc(spine)}</span>
              <span class="slip__year" aria-hidden="true">${esc(c.date)}</span>
            </button>
          </li>`;
  }).join('');
  return `<ul class="slip-shelf">${items}
        </ul>`;
}

export function renderCertDetail(cert: Certificate): string {
  const img = cert.image ? assetUrl(cert.image) : '';
  const figure = img ? `
            <a class="lectern__frame" href="${img}" target="_blank" rel="noopener noreferrer">
              <img src="${img}" alt="Certificate: ${esc(cert.title)}" loading="lazy" decoding="async">
              <span class="lectern__zoom">Open full-resolution scan<span class="visually-hidden"> (opens in a new tab)</span></span>
            </a>` : '';
  return `
            <p class="lectern__meta"><span class="badge">${esc(cert.issuer)}</span><span class="badge badge--gold">${esc(cert.date)}</span></p>
            <h3 class="lectern__title">${esc(cert.title)}</h3>${figure}
            <p class="lectern__desc">${esc(cert.description)}</p>
            <a class="btn btn-gold lectern__verify" href="${esc(cert.verifyUrl)}" target="_blank" rel="noopener noreferrer">Verify credential<span class="visually-hidden"> (opens in a new tab)</span></a>`;
}
