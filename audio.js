// Web Audio API Sound Engine for Poké Lucky Defense (with PWA Background Auto-Suspend)
class DefenseAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('poke_def_muted') === 'true';
    this.bgmTimer = null;
    this.step = 0;
    this.bgSuspended = false;
    this.bindLifecycle();
  }

  bindLifecycle() {
    const suspendAudio = () => {
      this.bgSuspended = true;
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    };

    const resumeAudio = () => {
      if (document.hidden) return;
      this.bgSuspended = false;
      if (!this.muted && this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) suspendAudio();
      else resumeAudio();
    });
    window.addEventListener('pagehide', suspendAudio);
    window.addEventListener('blur', suspendAudio);
    window.addEventListener('focus', resumeAudio);
    window.addEventListener('pageshow', resumeAudio);
    window.addEventListener('pointerdown', resumeAudio, { passive: true });
  }

  init() {
    if (document.hidden || this.bgSuspended) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('poke_def_muted', String(this.muted));
    if (this.muted) {
      this.stopBGM();
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      if (this.ctx && this.ctx.state === 'suspended' && !document.hidden) {
        this.ctx.resume().catch(() => {});
      }
      this.startBGM();
    }
    return this.muted;
  }

  tone(freq, type, dur, vol = 0.06, slide = null, delay = 0) {
    if (this.muted || document.hidden || this.bgSuspended) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), now + dur);

    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  playSummon() {
    this.tone(420, 'triangle', 0.09, 0.07, 680);
  }

  playEvolve() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(f, 'square', 0.12, 0.07, null, i * 0.07));
  }

  playMythic() {
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5];
    notes.forEach((f, i) => {
      this.tone(f, 'square', 0.16, 0.08, null, i * 0.08);
      this.tone(f * 0.5, 'triangle', 0.16, 0.06, null, i * 0.08);
    });
  }

  playFail() {
    this.tone(240, 'sawtooth', 0.18, 0.06, 110);
  }

  playHit() {
    this.tone(190 + Math.random() * 70, 'square', 0.04, 0.025, 90);
  }

  playCoin() {
    this.tone(880, 'sine', 0.08, 0.05, 1320);
  }

  playBossAlert() {
    for (let i = 0; i < 3; i++) {
      this.tone(200, 'sawtooth', 0.2, 0.08, 420, i * 0.25);
    }
  }

  startBGM() {
    if (this.muted || this.bgmTimer) return;
    this.init();
    const melody = [
      330, 392, 494, 440, 392, 330, 294, 330,
      349, 440, 523, 494, 440, 392, 440, 494
    ];
    this.bgmTimer = setInterval(() => {
      if (this.muted || document.hidden || this.bgSuspended) return;
      const f = melody[this.step % melody.length];
      this.tone(f, 'triangle', 0.14, 0.02);
      this.step++;
    }, 220);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.sfx = new DefenseAudio();
