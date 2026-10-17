/**
 * Soul Power progression & spirit-chime synthesis.
 * Zero-dependency Web Audio synthesis. The AudioContext is only created inside a
 * user gesture (click / key press), so the browser never logs an autoplay warning.
 */

export interface GameState {
  level: number;
  xp: number;
  health: number;
  completedQuests: string[];
  readCerts: string[];
}

const STORAGE_KEY = 'ggsk_portfolio_game_state';
export const MAX_HEALTH = 10;

// Pentatonic scale (C D E G A) — a plucked, guzheng-like voice suits the theme.
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

class SpiritSynth {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private context(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      this.ctx = null;
      return null;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** One plucked string: fast attack, exponential decay, slight downward bend. */
  private pluck(freq: number, at = 0, volume = 0.05, length = 0.45) {
    const ctx = this.context();
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    overtone.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.006, t0);
    osc.frequency.exponentialRampToValueAtTime(freq, t0 + 0.08);
    overtone.frequency.setValueAtTime(freq * 2.01, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    overtone.start(t0);
    osc.stop(t0 + length + 0.02);
    overtone.stop(t0 + length + 0.02);
  }

  playClick() {
    this.pluck(PENTATONIC[4], 0, 0.035, 0.18);
  }

  playChime() {
    this.pluck(PENTATONIC[7], 0, 0.04, 0.5);
    this.pluck(PENTATONIC[9], 0.06, 0.03, 0.6);
  }

  playLevelUp() {
    [0, 2, 3, 5, 7, 9].forEach((n, i) => this.pluck(PENTATONIC[n], i * 0.07, 0.045, 0.7));
  }

  /** Low filtered-noise gust — used for damage and the soul-burst easter egg. */
  playBurst() {
    const ctx = this.context();
    if (!ctx) return;
    const length = 0.35;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + length);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }
}

export const synth = new SpiritSynth();

type Listener = (state: GameState) => void;

function freshState(): GameState {
  return { level: 1, xp: 0, health: MAX_HEALTH, completedQuests: [], readCerts: [] };
}

export function xpForLevel(level: number): number {
  return level * 1000;
}

// Core State Manager
export class GameManager {
  private state: GameState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): GameState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GameState>;
        return {
          ...freshState(),
          ...parsed,
          completedQuests: Array.isArray(parsed.completedQuests) ? parsed.completedQuests : [],
          readCerts: Array.isArray(parsed.readCerts) ? parsed.readCerts : []
        };
      }
    } catch {
      // Storage blocked or corrupted — start fresh.
    }
    return freshState();
  }

  private commit() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage unavailable (private mode) — progress lives for this visit only.
    }
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot));
  }

  getState(): GameState {
    return { ...this.state, completedQuests: [...this.state.completedQuests], readCerts: [...this.state.readCerts] };
  }

  /** Subscribe; the listener is called immediately with the current state. */
  onStateChange(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /** Returns true when the visitor gained a level (a new Spirit Ring). */
  addXP(amount: number): boolean {
    this.state.xp += amount;
    let levelled = false;
    while (this.state.xp >= xpForLevel(this.state.level)) {
      this.state.xp -= xpForLevel(this.state.level);
      this.state.level += 1;
      levelled = true;
    }
    if (levelled) {
      synth.playLevelUp();
      window.dispatchEvent(new CustomEvent('spirit:pulse'));
    } else {
      synth.playChime();
    }
    this.commit();
    return levelled;
  }

  damage(amount: number) {
    this.state.health = Math.max(0, this.state.health - amount);
    synth.playBurst();
    this.commit();
  }

  heal(amount: number) {
    this.state.health = Math.min(MAX_HEALTH, this.state.health + amount);
    synth.playChime();
    this.commit();
  }

  completeQuest(questId: string): boolean {
    if (this.state.completedQuests.includes(questId)) return false;
    this.state.completedQuests.push(questId);
    this.addXP(300);
    return true;
  }

  readCert(certId: string): boolean {
    if (this.state.readCerts.includes(certId)) return false;
    this.state.readCerts.push(certId);
    this.addXP(500);
    return true;
  }

  reset() {
    this.state = freshState();
    synth.playBurst();
    this.commit();
  }
}
