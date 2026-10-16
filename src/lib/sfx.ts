// Synthesized UI sounds (no audio files). Off by default; only plays after a user gesture.
export type SfxSettings = { enabled: boolean; volume: number; click: boolean; cart: boolean; chomp: boolean };
const KEY = "smol-sfx";
const DEFAULTS: SfxSettings = { enabled: false, volume: 0.4, click: true, cart: true, chomp: true };

export function getSfx(): SfxSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEFAULTS; }
}
export function setSfx(patch: Partial<SfxSettings>) {
  const next = { ...getSfx(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

let ctx: AudioContext | null = null;
const SOUNDS = {
  click: [[900, 0.05, "square"]],
  cart: [[300, 0.06, "triangle"], [450, 0.06, "triangle"], [650, 0.08, "triangle"]],
  chomp: [[180, 0.07, "sawtooth"], [120, 0.07, "sawtooth"]],
} as const;

export function playSfx(name: keyof typeof SOUNDS) {
  const s = getSfx();
  if (!s.enabled || !s[name]) return;
  ctx ??= new AudioContext();
  let t = ctx.currentTime;
  for (const [freq, dur, type] of SOUNDS[name]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(s.volume * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
    t += dur * 0.8;
  }
}
