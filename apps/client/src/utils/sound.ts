// Web Audio API sound synthesizer (no external mp3 required, works 100% offline)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  stopAlarm() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeOscillators = [];
  }

  playClick(volume = 50) {
    const ctx = this.getContext();
    if (!ctx || volume <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

    const vol = (volume / 100) * 0.25;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  private playSinglePattern(type: 'bell' | 'digital' | 'chime', volume: number) {
    const ctx = this.getContext();
    if (!ctx || volume <= 0) return;

    const vol = (volume / 100) * 0.4;
    const now = ctx.currentTime;

    if (type === 'bell') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(vol, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.65);
        this.activeOscillators.push(osc);
      });
    } else if (type === 'digital') {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.2);

        gain.gain.setValueAtTime(vol * 0.6, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.14);
        this.activeOscillators.push(osc);
      }
    } else {
      // chime
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(vol, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.75);
        this.activeOscillators.push(osc);
      });
    }
  }

  playAlarm(
    type: 'bell' | 'digital' | 'chime' = 'bell',
    volume = 80,
    durationSeconds = 5,
    onEnded?: () => void
  ) {
    this.stopAlarm();
    if (volume <= 0 || durationSeconds <= 0) {
      onEnded?.();
      return;
    }

    const totalMs = Math.max(1, durationSeconds) * 1000;
    const cycleMs = 1200; // Repeat melody every 1.2s until durationSeconds is reached

    this.playSinglePattern(type, volume);

    if (totalMs > cycleMs) {
      this.loopTimer = setInterval(() => {
        this.playSinglePattern(type, volume);
      }, cycleMs);
    }

    this.stopTimeout = setTimeout(() => {
      this.stopAlarm();
      onEnded?.();
    }, totalMs);
  }
}

export const soundEngine = new SoundEngine();
