import { useCallback, useEffect, useRef, useState } from "react";
import { useSite, type DialogueSequence } from "@/lib/site";

// Every line stays up at least 12s so it can be read; longer lines get up to 16s.
export const MIN_READ_MS = 12000;
export const MAX_READ_MS = 16000;
export const dialogueReadingTime = (line: string) =>
  Math.min(MAX_READ_MS, MIN_READ_MS + Math.max(0, Array.from(line).length - 40) * 100);
export type Dialogue = { line: string; expression: string; stickerId?: string; delayMs?: number };
/** 0 ambient (only when idle), 1 interaction (shows now), 2 critical (interrupts anything). */
export type Priority = 0 | 1 | 2;
type Beat = Dialogue & { priority: Priority };

export function useDialogue(initial: Dialogue) {
  const site = useSite();
  const publishedSequences = site?.dialogue?.status === "published" ? site.dialogue.sequences : [];
  const [dialogue, setDialogue] = useState(initial);
  const current = useRef<Beat>({ ...initial, priority: 1 });
  const until = useRef(0);
  const pending = useRef<Beat[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);
  const lastShown = useRef(new Map<string, number>());

  const show = useCallback(function show(beat: Beat) {
    if (!mounted.current) return;
    clearTimeout(timer.current);
    current.current = beat;
    lastShown.current.set(beat.line, Date.now());
    setDialogue({ line: beat.line, expression: beat.expression, ...(beat.stickerId === undefined ? {} : { stickerId: beat.stickerId }) });
    const ms = dialogueReadingTime(beat.line) + Math.max(0, Math.min(120000, beat.delayMs ?? 0));
    until.current = Date.now() + ms;
    timer.current = setTimeout(() => {
      const next = pending.current.shift();
      if (next) show(next);
    }, ms);
  }, []);

  const saySequence = useCallback((steps: Dialogue[], priority: Priority = 1) => {
    const list = steps.filter((s) => s.line);
    const [first, ...rest] = list;
    if (!first || (current.current.line === first.line && current.current.stickerId === first.stickerId)) return;
    const now = Date.now();
    const busy = now < until.current;
    if (priority === 0 && busy) return; // ambient never stomps an unread line
    // Hover/focus can fire repeatedly: don't replay a reaction still within its reading window.
    const last = lastShown.current.get(first.line);
    if (priority < 2 && last !== undefined && now - last < dialogueReadingTime(first.line)) return;
    // Ordinary reactions wait their turn (newest wins); only errors (priority 2) and
    // interactions over ambient lines may replace an unread line immediately.
    if (busy && priority < 2 && priority <= current.current.priority) {
      pending.current = list.map((s) => ({ ...s, priority }));
      return;
    }
    pending.current = rest.map((s) => ({ ...s, priority }));
    show({ ...first, priority });
  }, [show]);

  const say = useCallback((line: string, expression = "hmm", priority: Priority = 1) =>
    saySequence([{ line, expression }], priority), [saySequence]);

  const configuredSequence = useCallback((id: string, fallback: Dialogue[], priority: Priority = 1) => {
    const configured = publishedSequences.find((sequence: DialogueSequence) => sequence.id === id && sequence.enabled);
    saySequence(configured?.lines?.length ? configured.lines.map((line) => ({ ...line })) : fallback, configured?.priority ?? priority);
  }, [publishedSequences, saySequence]);

  /** Lines of a published, enabled sequence (or the fallback) for components that pick one line at a time. */
  const linesFor = useCallback((id: string, fallback: Dialogue[]): Dialogue[] => {
    const configured = publishedSequences.find((sequence: DialogueSequence) => sequence.id === id && sequence.enabled);
    return configured?.lines?.length ? configured.lines.map((line) => ({ ...line })) : fallback;
  }, [publishedSequences]);

  useEffect(() => {
    mounted.current = true;
    const ms = dialogueReadingTime(current.current.line);
    until.current = Date.now() + ms;
    // The initial line needs a timer too, or reactions queued behind it would never play.
    timer.current = setTimeout(() => {
      const next = pending.current.shift();
      if (next) show(next);
    }, ms);
    return () => { mounted.current = false; clearTimeout(timer.current); pending.current = []; };
  }, [show]);

  return { dialogue, say, saySequence, configuredSequence, linesFor, isBusy: () => Date.now() < until.current };
}
