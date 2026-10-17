/**
 * Spirit Ring ranks — the colour language of the whole site.
 * Shared by the static renderer (build time), the CSS tokens and the WebGL scene.
 */

export type RingTier = 'r10' | 'r100' | 'r1k' | 'r10k' | 'r100k' | 'r1m';

export interface RingRank {
  tier: RingTier;
  label: string;
  /** Linear-ish sRGB 0..1 used by the WebGL scene. */
  glA: [number, number, number];
  /** Secondary colour: rim for the dark ring, gradient partner for the million-year ring. */
  glB: [number, number, number];
  /** 0 = bright body, 1 = dark body with crimson rim, 2 = dual gold/jade gradient. */
  mode: 0 | 1 | 2;
}

export const RING_RANKS: RingRank[] = [
  { tier: 'r10',   label: '10-Year',        glA: [0.94, 0.96, 1.0],  glB: [0.75, 0.85, 1.0],  mode: 0 },
  { tier: 'r100',  label: '100-Year',       glA: [0.98, 0.80, 0.08], glB: [1.0, 0.93, 0.55],  mode: 0 },
  { tier: 'r1k',   label: '1,000-Year',     glA: [0.66, 0.33, 0.97], glB: [0.85, 0.65, 1.0],  mode: 0 },
  { tier: 'r10k',  label: '10,000-Year',    glA: [0.03, 0.03, 0.05], glB: [0.86, 0.15, 0.15], mode: 1 },
  { tier: 'r100k', label: '100,000-Year',   glA: [0.94, 0.16, 0.16], glB: [1.0, 0.55, 0.45],  mode: 0 },
  { tier: 'r1m',   label: '1,000,000-Year', glA: [0.96, 0.62, 0.04], glB: [0.02, 0.71, 0.83], mode: 2 }
];

export function ringLabel(tier: RingTier): string {
  return RING_RANKS.find(r => r.tier === tier)?.label ?? tier;
}
