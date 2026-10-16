// UI sounds. Admin settings (site_settings.sound) decide what exists; each visitor can still mute.
import { DEFAULT_SOUND, type SoundSettings } from "./site";

const KEY = "smol-sound-muted";
let cfg: SoundSettings = DEFAULT_SOUND;
export const applySoundSettings = (s: SoundSettings) => { cfg = s; };
export const isMuted = () => typeof window !== "undefined" && localStorage.getItem(KEY) !== "0";
export const setMuted = (m: boolean) => localStorage.setItem(KEY, m ? "1" : "0");

let ctx: AudioContext | null = null;
const SYNTH = {
  click: [[900, 0.05, "square"]],
  cart: [[300, 0.06, "triangle"], [450, 0.06, "triangle"], [650, 0.08, "triangle"]],
  chomp: [[180, 0.07, "sawtooth"], [120, 0.07, "sawtooth"]],
} as const;
export type SfxName = keyof typeof SYNTH;

/** force=true ignores visitor mute (used by admin Test buttons). */
export function playSfx(name: SfxName, force = false, s: SoundSettings = cfg) {
  if (!force && (isMuted() || !s.enabled || !s[name])) return;
  const custom = s.library.find((x) => x.trigger === name);
  if (custom) {
    const a = new Audio(custom.url);
    a.volume = s.volume;
    void a.play().catch(() => {});
    return;
  }
  ctx ??= new AudioContext();
  let t = ctx.currentTime;
  for (const [freq, dur, type] of SYNTH[name]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(Math.max(s.volume, 0.001) * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
    t += dur * 0.8;
  }
}
