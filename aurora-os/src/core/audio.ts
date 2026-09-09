const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0,
  A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63,
  F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
  D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
};

class TonePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private scheduled: OscillatorNode[] = [];
  private notes: number[] = [];
  private tempo: number;
  private token = 0;
  private position = 0;
  private total = 0;
  private tickId: ReturnType<typeof setInterval> | null = null;
  private volume = 0.7;
  playing = false;
  onProgress: ((pos: number, total: number) => void) | null = null;

  constructor(tempo = 100) {
    this.tempo = tempo;
  }

  setTempo(bpm: number) {
    this.tempo = bpm;
  }

  load(frequencies: number[]) {
    this.stop();
    this.notes = frequencies;
    this.total = this.notes.length * this.beatSeconds();
    this.position = 0;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) {
      this.master.gain.linearRampToValueAtTime(v, this.ctx!.currentTime + 0.05);
    }
  }

  getTotal() {
    return this.total;
  }

  getPosition() {
    return this.position;
  }

  toggle(): boolean {
    if (this.playing) {
      this.pause();
    } else {
      this.resume();
    }
    return this.playing;
  }

  resume() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    const ctx = this.ctx;
    if (ctx.state === 'suspended') void ctx.resume();
    this.playing = true;
    this.schedule();
    this.tickId = setInterval(() => {
      this.onProgress?.(this.position, this.total);
    }, 200);
  }

  pause() {
    this.playing = false;
    this.stopScheduled();
    if (this.tickId) {
      clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  stop() {
    this.pause();
    this.position = 0;
  }

  seek(sec: number) {
    this.position = Math.max(0, Math.min(this.total, sec));
    if (this.playing) {
      this.stopScheduled();
      this.schedule();
    }
    this.onProgress?.(this.position, this.total);
  }

  private beatSeconds() {
    return 60 / this.tempo;
  }

  private stopScheduled() {
    const ctx = this.ctx;
    this.scheduled.forEach(osc => {
      try {
        osc.onended = null;
        osc.stop();
      } catch {
        /* ignore */
      }
    });
    this.scheduled = [];
    if (ctx) this.token++;
  }

  private schedule() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const token = this.token;
    const beat = this.beatSeconds();
    const from = Math.floor(this.position / beat);
    let t = ctx.currentTime + 0.05;

    for (let i = from; i < this.notes.length; i++) {
      if (token !== this.token) return;
      const freq = this.notes[i];
      const dur = beat * 0.9;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 4 === 0 ? 'triangle' : i % 4 === 1 ? 'sine' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      this.scheduled.push(osc);
      t += beat;
    }

    const totalTime = ctx.currentTime + this.notes.length * beat - this.position + 0.05;
    window.setTimeout(() => {
      if (token === this.token) this.stop();
    }, (totalTime + 0.5) * 1000);
  }
}

export const tonePlayer = new TonePlayer();

export function parseMelody(notes: string[]): number[] {
  return notes.map(n => NOTE[n] ?? NOTE.C4);
}

let blipCtx: AudioContext | null = null;
let lastBlipAt = 0;

// Pitido corto para feedback del volumen (independiente del reproductor).
export function playBlip(volume01: number): void {
  const now = Date.now();
  if (now - lastBlipAt < 80) return;
  lastBlipAt = now;
  try {
    if (!blipCtx) {
      blipCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = blipCtx;
    if (ctx.state === 'suspended') void ctx.resume();
    const gain = Math.max(0.0001, Math.min(1, volume01));
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * 0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  } catch {
    /* sin audio disponible */
  }
}