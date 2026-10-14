import { useCallback, useEffect, useRef, useState } from "react";

// Short punchy beats read fast; long lines get more time.
export const dialogueReadingTime = (line: string) => line.length < 30 ? 4000 : line.length <= 60 ? 5500 : 7000;
export type Dialogue = { line: string; expression: string };
/** 0 ambient (only when idle), 1 interaction (shows now), 2 critical (interrupts anything). */
export type Priority = 0 | 1 | 2;
type Beat = Dialogue & { priority: Priority };

export function useDialogue(initial: Dialogue) {
  const [dialogue, setDialogue] = useState(initial);
  const current = useRef<Beat>({ ...initial, priority: 1 });
  const until = useRef(0);
  const pending = useRef<Beat[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);

  const show = useCallback(function show(beat: Beat) {
    if (!mounted.current) return;
    clearTimeout(timer.current);
    current.current = beat;
    setDialogue({ line: beat.line, expression: beat.expression });
    const ms = dialogueReadingTime(beat.line);
    until.current = Date.now() + ms;
    timer.current = setTimeout(() => {
      const next = pending.current.shift();
      if (next) show(next);
    }, ms);
  }, []);

  const saySequence = useCallback((steps: Dialogue[], priority: Priority = 1) => {
    const [first, ...rest] = steps.filter((s) => s.line);
    if (!first || current.current.line === first.line) return;
    const busy = Date.now() < until.current;
    if (priority === 0 && busy) return; // ambient never stomps an unread line
    if (busy && priority < current.current.priority) {
      pending.current = steps.map((s) => ({ ...s, priority }));
      return;
    }
    pending.current = rest.map((s) => ({ ...s, priority }));
    show({ ...first, priority });
  }, [show]);

  const say = useCallback((line: string, expression = "hmm", priority: Priority = 1) =>
    saySequence([{ line, expression }], priority), [saySequence]);

  useEffect(() => {
    mounted.current = true;
    until.current = Date.now() + dialogueReadingTime(current.current.line);
    return () => { mounted.current = false; clearTimeout(timer.current); pending.current = []; };
  }, []);

  return { dialogue, say, saySequence, isBusy: () => Date.now() < until.current };
}
