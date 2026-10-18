import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import "../styles/FeatureCarousel.css";

const SWIPE_THRESHOLD_PX = 45;

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

/**
 * Shows one featured item at a time and auto-advances on a timer.
 *
 * items: [{ key, icon, title, copy, Visual }]
 *
 * Timer rules: a single setTimeout per item (never an interval), cleared on
 * every change and on unmount. It only runs while the carousel is in the
 * viewport, the tab is visible and nobody is hovering, focusing or touching
 * it. Any manual navigation stops autoplay for the rest of the visit, until
 * the user presses Play. With prefers-reduced-motion there is no autoplay
 * at all and the items behave as a plain tab list.
 */
export default function FeatureCarousel({ items, interval = 5500, label, className = "" }) {
  const baseId = useId();
  const count = items.length;
  const reducedMotion = usePrefersReducedMotion();

  const rootRef = useRef(null);
  const tabRefs = useRef([]);
  const touchRef = useRef(null);
  // Time left on the current item, kept across pauses so resuming continues
  // where the progress bar stopped instead of restarting it.
  const progressRef = useRef({ index: 0, remaining: interval });
  const hasEnteredRef = useRef(false);
  const interactedRef = useRef(false);

  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined" ? true : document.visibilityState !== "hidden"
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouching, setIsTouching] = useState(false);

  const autoplay = isPlaying && !reducedMotion;
  const running = autoplay && inView && pageVisible && !isHovered && !isFocused && !isTouching;

  // Only count time while the section is actually on screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEnteredRef.current) {
          hasEnteredRef.current = true;
          // Start from the first item the first time the section is seen
          if (!interactedRef.current) setActive(0);
        }
        setInView(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The single timeout chain: one pending timeout at most, for the active item
  useEffect(() => {
    if (!running || count < 2) return undefined;
    const progress = progressRef.current;
    if (progress.index !== active) {
      progress.index = active;
      progress.remaining = interval;
    }
    const startedAt = performance.now();
    const timeoutId = window.setTimeout(() => {
      setActive(current => (current + 1) % count);
    }, progress.remaining);

    return () => {
      window.clearTimeout(timeoutId);
      progress.remaining = Math.max(0, progress.remaining - (performance.now() - startedAt));
    };
  }, [running, active, interval, count]);

  const goTo = useCallback(
    index => {
      interactedRef.current = true;
      setIsPlaying(false); // do not fight the user
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  function togglePlay() {
    interactedRef.current = true;
    if (!isPlaying) {
      // Resuming: give the current item its full time again
      progressRef.current = { index: active, remaining: interval };
    }
    setIsPlaying(!isPlaying);
  }

  function handleTabKeyDown(event, index) {
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    if (next === null) return;
    event.preventDefault();
    const target = ((next % count) + count) % count;
    goTo(target);
    tabRefs.current[target]?.focus();
  }

  // Hover pause is for real mouse pointers only, so a tap on a touch screen
  // never leaves the carousel stuck in a "hovered" state.
  function handlePointerEnter(event) {
    if (event.pointerType === "mouse") setIsHovered(true);
  }

  function handlePointerLeave(event) {
    if (event.pointerType === "mouse") setIsHovered(false);
  }

  // Focus inside pauses the timer, except on the Play button itself
  function handleFocus(event) {
    setIsFocused(!event.target.closest("[data-carousel-toggle]"));
  }

  function handleBlur(event) {
    if (!rootRef.current?.contains(event.relatedTarget)) setIsFocused(false);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
    setIsTouching(true);
  }

  function handleTouchEnd(event) {
    const start = touchRef.current;
    touchRef.current = null;
    setIsTouching(false);
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goTo(active + (dx < 0 ? 1 : -1));
    }
  }

  function handleTouchCancel() {
    touchRef.current = null;
    setIsTouching(false);
  }

  const rootClass = [
    "feature-carousel",
    reducedMotion ? "feature-carousel--static" : "",
    running ? "is-running" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={rootRef}
      className={rootClass}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={{ "--fc-interval": `${interval}ms` }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="feature-carousel__nav">
        <div className="feature-carousel__tabs" role="tablist" aria-label={label}>
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === active;
            return (
              <button
                key={item.key}
                ref={el => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${index}`}
                aria-label={item.title}
                tabIndex={isActive ? 0 : -1}
                className={`feature-carousel__tab${isActive ? " is-active" : ""}`}
                onClick={() => goTo(index)}
                onKeyDown={event => handleTabKeyDown(event, index)}
              >
                <span className="feature-carousel__tab-icon" aria-hidden="true">
                  {Icon && <Icon size={16} />}
                </span>
                <span className="feature-carousel__tab-title" aria-hidden="true">
                  {item.title}
                </span>
                <span className="feature-carousel__dot" aria-hidden="true" />
                {isActive && autoplay && (
                  // Keyed on the item so the bar restarts for every new item;
                  // its play state mirrors the timer so both pause together.
                  <span key={`bar-${active}`} className="feature-carousel__progress" aria-hidden="true">
                    <span />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!reducedMotion && (
          <button
            type="button"
            data-carousel-toggle
            className="feature-carousel__toggle"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
        )}
      </div>

      <div
        className="feature-carousel__stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const Visual = item.Visual;
          const isActive = index === active;
          return (
            <div
              key={item.key}
              role="tabpanel"
              id={`${baseId}-panel-${index}`}
              aria-labelledby={`${baseId}-tab-${index}`}
              aria-hidden={!isActive}
              className={`feature-carousel__panel feature-carousel__panel--${item.key}${isActive ? " is-active" : ""}`}
            >
              <div className="feature-carousel__text">
                <span className="feature-carousel__panel-icon" aria-hidden="true">
                  {Icon && <Icon size={16} />}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </div>
              <div className="feature-carousel__visual">{Visual && <Visual />}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
