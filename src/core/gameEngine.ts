/**
 * Cyber-Minecraft Core Game & Sound Synthesis Engine
 * Zero-Dependency, lightweight Web Audio API synthesis for perfect Lighthouse performance.
 */

export interface GameState {
  level: number;
  xp: number;
  health: number;
  completedQuests: string[];
  readCerts: string[];
}

const STORAGE_KEY = 'ggsk_portfolio_game_state';

// Synthesized Audio Engine (Web Audio API)
class AudioSynth {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  toggle(enabled: boolean) {
    this.isEnabled = enabled;
  }

  playClick() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.05); // A5

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playBreak() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15s duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Populate with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playLevelUp() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (Triumphant Arpeggio)
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.setValueAtTime(0.05, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  playChime() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5 (High Chime)
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

export const synth = new AudioSynth();

// Core State Manager
export class GameManager {
  private state: GameState;
  private onStateChangeCallback: ((state: GameState) => void) | null = null;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): GameState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Storage blocked or unavailable
    }
    
    return {
      level: 1,
      xp: 0,
      health: 10,
      completedQuests: [],
      readCerts: []
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage unavailable
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.state });
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  onStateChange(callback: (state: GameState) => void) {
    this.onStateChangeCallback = callback;
    callback({ ...this.state });
  }

  addXP(amount: number) {
    this.state.xp += amount;
    const xpNeeded = this.state.level * 1000;
    
    if (this.state.xp >= xpNeeded) {
      this.state.xp -= xpNeeded;
      this.state.level += 1;
      synth.playLevelUp();
    } else {
      synth.playChime();
    }
    this.saveState();
  }

  damage(amount: number) {
    this.state.health = Math.max(0, this.state.health - amount);
    synth.playBreak();
    this.saveState();
  }

  heal(amount: number) {
    this.state.health = Math.min(10, this.state.health + amount);
    synth.playChime();
    this.saveState();
  }

  completeQuest(questId: string) {
    if (!this.state.completedQuests.includes(questId)) {
      this.state.completedQuests.push(questId);
      this.addXP(300); // 300 XP reward for completing quests
    }
  }

  readCert(certId: string) {
    if (!this.state.readCerts.includes(certId)) {
      this.state.readCerts.push(certId);
      this.addXP(500); // 500 XP reward for acquiring certified magic
    }
  }

  reset() {
    this.state = {
      level: 1,
      xp: 0,
      health: 10,
      completedQuests: [],
      readCerts: []
    };
    synth.playBreak();
    this.saveState();
  }
}
