let soundEnabled = true;
let musicEnabled = true;
let audioCtx = null;
let musicTimer = null;

function ctx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function tone(freq, duration, type = "sine", gain = 0.08, delay = 0) {
  if (!soundEnabled) return;
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(c.destination);
    const t = c.currentTime + delay;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    /* ignore */
  }
}

export const Audio = {
  setSound(on) {
    soundEnabled = on;
  },

  setMusic(on) {
    musicEnabled = on;
    if (!on) this.stopMusic();
    else this.startMusic();
  },

  click() {
    tone(600, 0.06, "triangle", 0.06);
  },

  correct() {
    tone(523, 0.12, "sine", 0.09);
    tone(659, 0.12, "sine", 0.09, 0.1);
    tone(784, 0.18, "sine", 0.09, 0.2);
  },

  wrong() {
    tone(280, 0.15, "triangle", 0.05);
    tone(240, 0.2, "triangle", 0.04, 0.1);
  },

  star() {
    tone(523, 0.1, "sine", 0.08);
    tone(659, 0.1, "sine", 0.08, 0.08);
    tone(784, 0.1, "sine", 0.08, 0.16);
    tone(1046, 0.25, "sine", 0.1, 0.24);
  },

  whoosh() {
    tone(400, 0.2, "sawtooth", 0.03);
    tone(200, 0.25, "sawtooth", 0.02, 0.05);
  },

  startMusic() {
    this.stopMusic();
    if (!musicEnabled) return;

    const notes = [262, 330, 392, 330, 349, 392, 440, 392];
    let i = 0;

    const playNote = () => {
      if (!musicEnabled) return;
      try {
        const c = ctx();
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = "sine";
        osc.frequency.value = notes[i % notes.length];
        g.gain.value = 0.015;
        osc.connect(g);
        g.connect(c.destination);
        const t = c.currentTime;
        g.gain.setValueAtTime(0.015, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.45);
      } catch {
        /* ignore */
      }
      i++;
    };

    playNote();
    musicTimer = setInterval(playNote, 700);
  },

  stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  },
};
