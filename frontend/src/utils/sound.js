/* Small synthesized notification sound for the AI chat (no asset file).
   Uses the Web Audio API so it works offline and never blocks on loading.
   Fails silently where audio is unavailable (e.g. jsdom, headless). */

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function playChatSound() {
  try {
    const ctx = getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();

    // A short, soft two-tone "pluck" so a reply is noticed without being jarring.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // Audio playback unavailable — ignore.
  }
}
