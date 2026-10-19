import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { useSite } from "@/lib/site";
import { applySoundSettings, isMuted, setMuted } from "@/lib/sfx";

// Small floating "Website sound" toggle. Visitors start muted; nothing plays until they tap it.
export function SoundBar() {
  const sound = useSite()?.sound;
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [muted, setM] = useState(true);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setM(isMuted()), []);
  useEffect(() => { if (sound) applySoundSettings(sound); }, [sound]);

  const music = sound?.enabled && sound.music.enabled && sound.music.url ? sound.music : null;
  useEffect(() => {
    if (!music || muted) { audio.current?.pause(); return; }
    if (!audio.current || audio.current.src !== music.url) { audio.current?.pause(); audio.current = new Audio(music.url); }
    audio.current.loop = music.loop;
    audio.current.volume = music.volume;
    void audio.current.play().catch(() => {});
  }, [music?.url, music?.loop, music?.volume, muted]);
  useEffect(() => () => audio.current?.pause(), []);

  if (!sound?.enabled || path.startsWith("/admin")) return null;
  const toggle = () => { setMuted(!muted); setM(!muted); };
  return (
    <button type="button" className="sound-bar" onClick={toggle} aria-pressed={!muted} aria-label={muted ? "Turn website sound on" : "Turn website sound off"}>
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}
