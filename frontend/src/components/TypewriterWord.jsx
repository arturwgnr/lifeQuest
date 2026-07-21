import { useEffect, useState } from "react";
import "../styles/TypewriterWord.css";

const TYPE_SPEED_MS = 70;
const DELETE_SPEED_MS = 40;
const PAUSE_MS = 1400;
const INTER_WORD_PAUSE_MS = 300;

// Types and deletes each word in `words` in a loop. Renders a static first
// word (no animation, no cursor) when prefers-reduced-motion is set.
export default function TypewriterWord({ words, className = "" }) {
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    if (prefersReducedMotion) return;

    const currentWord = words[wordIndex];
    let timeout;

    if (phase === "typing") {
      if (displayed.length < currentWord.length) {
        timeout = setTimeout(
          () => setDisplayed(currentWord.slice(0, displayed.length + 1)),
          TYPE_SPEED_MS
        );
      } else {
        timeout = setTimeout(() => setPhase("deleting"), PAUSE_MS);
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          DELETE_SPEED_MS
        );
      } else {
        timeout = setTimeout(() => {
          setWordIndex((i) => (i + 1) % words.length);
          setPhase("typing");
        }, INTER_WORD_PAUSE_MS);
      }
    }

    return () => clearTimeout(timeout);
  }, [prefersReducedMotion, displayed, phase, wordIndex, words]);

  if (prefersReducedMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className={`typewriter-word ${className}`}>
      <span className="typewriter-word__measure" aria-hidden="true">
        {longest}
      </span>
      <span className="typewriter-word__visible">
        {displayed}
        <span className="typewriter-cursor" aria-hidden="true" />
      </span>
    </span>
  );
}
