import { useCallback, useEffect, useRef, useState } from "react";

export const dialogueReadingTime = (line: string) => line.length > 65 ? 16000 : 12000;
export type Dialogue = { line: string; expression: string };

// One reader-owned clock: ordinary reactions wait, important errors interrupt.
export function useDialogue(initial: Dialogue) {
  const [dialogue, setDialogue] = useState(initial);
  const current = useRef(initial);
  const until = useRef(0);
  const pending = useRef<Dialogue[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);

  const drain = useCallback(function next() {
    clearTimeout(timer.current);
    const delay = until.current - Date.now();
    if (delay > 0) {
      timer.current = setTimeout(next, delay);
      return;
    }
    const message = pending.current.shift();
    if (!message || !mounted.current) return;
    current.current = message;
    setDialogue(message);
    until.current = Date.now() + dialogueReadingTime(message.line);
    if (pending.current.length) timer.current = setTimeout(next, dialogueReadingTime(message.line));
  }, []);

  const say = useCallback((line: string, expression = "hmm", urgent = false) => {
    if (!line || current.current.line === line || pending.current.some((d) => d.line === line)) return;
    const message = { line, expression };
    if (urgent) {
      clearTimeout(timer.current);
      pending.current = [];
      current.current = message;
      setDialogue(message);
      until.current = Date.now() + dialogueReadingTime(line);
      return;
    }
    // Keep the latest few relevant actions, never a long backlog of stale jokes.
    pending.current = [...pending.current.slice(-2), message];
    drain();
  }, [drain]);

  useEffect(() => {
    mounted.current = true;
    until.current = Date.now() + dialogueReadingTime(current.current.line);
    return () => { mounted.current = false; clearTimeout(timer.current); pending.current = []; };
  }, []);

  return { dialogue, say };
}