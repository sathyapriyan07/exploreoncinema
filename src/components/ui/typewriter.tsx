import { useEffect, useState, useRef } from 'react';
import { cn } from '@/src/lib/utils';

interface TypewriterProps {
  /** Array of strings to cycle through */
  text: string[];
  /** Typing speed in ms per character */
  speed?: number;
  /** Deleting speed in ms per character */
  deleteSpeed?: number;
  /** Pause duration after fully typed, before deleting */
  waitTime?: number;
  /** Cursor character */
  cursorChar?: string;
  /** Class applied to the outer span */
  className?: string;
  /** Class applied to the cursor span */
  cursorClassName?: string;
  /** When true the cursor blinks but text never deletes (static after first phrase) */
  loop?: boolean;
}

export function Typewriter({
  text,
  speed = 60,
  deleteSpeed = 35,
  waitTime = 1800,
  cursorChar = '_',
  className,
  cursorClassName,
  loop = true,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Refs so the effect closure always sees latest values without re-running
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);
  const waiting = useRef(false);

  // Respect prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!text.length) return;

    // Reduced motion: just show first phrase statically
    if (prefersReduced) {
      setDisplayed(text[0]);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = text[phraseIdx.current];

      if (waiting.current) {
        waiting.current = false;
        deleting.current = true;
        timeout = setTimeout(tick, deleteSpeed);
        return;
      }

      if (deleting.current) {
        if (charIdx.current > 0) {
          charIdx.current -= 1;
          setDisplayed(phrase.slice(0, charIdx.current));
          timeout = setTimeout(tick, deleteSpeed);
        } else {
          deleting.current = false;
          phraseIdx.current = (phraseIdx.current + 1) % text.length;
          timeout = setTimeout(tick, speed);
        }
        return;
      }

      // Typing
      if (charIdx.current < phrase.length) {
        charIdx.current += 1;
        setDisplayed(phrase.slice(0, charIdx.current));
        timeout = setTimeout(tick, speed);
      } else {
        // Fully typed
        if (!loop && phraseIdx.current === text.length - 1) return; // stop at last phrase
        waiting.current = true;
        timeout = setTimeout(tick, waitTime);
      }
    };

    timeout = setTimeout(tick, speed);
    return () => clearTimeout(timeout);
  }, [text, speed, deleteSpeed, waitTime, loop, prefersReduced]);

  // Cursor blink
  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(id);
  }, [prefersReduced]);

  return (
    <span className={cn('inline', className)}>
      {displayed}
      <span
        aria-hidden
        className={cn(
          'inline-block transition-opacity duration-100',
          cursorVisible ? 'opacity-100' : 'opacity-0',
          cursorClassName
        )}
      >
        {cursorChar}
      </span>
    </span>
  );
}
