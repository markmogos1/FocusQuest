import { useEffect, useMemo, useRef, useState } from "react";

export type UseTypewriterOptions = {
  typingSpeed?: number;      // ms per char
  deletingSpeed?: number;    // ms per char
  pauseAfterType?: number;   // ms after a word is fully typed
  pauseAfterDelete?: number; // ms after a word is fully deleted
  loop?: boolean;            // cycle through words forever
  delete?: boolean;          // type-only if false
};

export function useTypewriter(
  wordsInput: string[] | undefined,
  {
    typingSpeed = 70,
    deletingSpeed = 40,
    pauseAfterType = 900,
    pauseAfterDelete = 350,
    loop = true,
    delete: shouldDelete = true,
  }: UseTypewriterOptions = {}
) {
  // Ensure we always have at least one word to avoid undefined access
  const words = useMemo(
    () => (Array.isArray(wordsInput) && wordsInput.length > 0 ? wordsInput : [""]),
    [wordsInput]
  );

  const [index, setIndex] = useState(0);      // current word index
  const [text, setText] = useState("");       // current substring
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  const word = useMemo(() => words[index % words.length], [index, words]);
  const timerRef = useRef<number | null>(null);

  // Clear any pending timeouts on unmount or re-run
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  useEffect(() => {
    clearTimer();
    if (paused) return;

    const atFull = text === word;
    const canType = text.length < word.length;
    const canDelete = text.length > 0;

    if (!deleting && canType) {
      // typing forward
      timerRef.current = window.setTimeout(
        () => setText(word.slice(0, text.length + 1)),
        typingSpeed
      );
      return;
    }

    if (!deleting && atFull) {
      // finished typing
      if (!shouldDelete) {
        setPaused(true);
        timerRef.current = window.setTimeout(() => {
          setPaused(false);
          setIndex((i) => (loop ? (i + 1) % words.length : Math.min(i + 1, words.length - 1)));
          setText(""); // start next word fresh
        }, pauseAfterType);
      } else {
        setPaused(true);
        timerRef.current = window.setTimeout(() => {
          setPaused(false);
          setDeleting(true);
        }, pauseAfterType);
      }
      return;
    }

    if (deleting && canDelete) {
      // deleting backward
      timerRef.current = window.setTimeout(
        () => setText(word.slice(0, text.length - 1)),
        deletingSpeed
      );
      return;
    }

    if (deleting && !canDelete) {
      // finished deleting → advance to next word
      setPaused(true);
      timerRef.current = window.setTimeout(() => {
        setPaused(false);
        setDeleting(false);
        setIndex((i) => (loop ? (i + 1) % words.length : Math.min(i + 1, words.length - 1)));
      }, pauseAfterDelete);
    }
  }, [
    deleting,
    deletingSpeed,
    loop,
    pauseAfterDelete,
    pauseAfterType,
    shouldDelete,
    text,
    typingSpeed,
    word,
    words.length,
  ]);

  const showCaret = !paused || deleting || text.length < word.length;

  return { text, showCaret, index, isDeleting: deleting };
}
