"use client";

import { useCallback, useEffect, useRef } from "react";
import GlyphPortal from "./glyph-portal";
import AccountForm from "./account-form";

/** One mounted scene: scroll and click drive exactly the same camera timeline. */
export default function AtelierEntry() {
  const scene = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const entered = useRef(false);

  const cancelAnimation = useCallback(() => {
    cancelAnimationFrame(animation.current);
    animation.current = 0;
  }, []);

  useEffect(() => {
    const cancelOnKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape"].includes(event.key)) cancelAnimation();
    };
    window.addEventListener("wheel", cancelAnimation, { passive: true });
    window.addEventListener("touchstart", cancelAnimation, { passive: true });
    window.addEventListener("pointerdown", cancelAnimation, { passive: true });
    window.addEventListener("keydown", cancelOnKey);
    return () => {
      cancelAnimation();
      window.removeEventListener("wheel", cancelAnimation);
      window.removeEventListener("touchstart", cancelAnimation);
      window.removeEventListener("pointerdown", cancelAnimation);
      window.removeEventListener("keydown", cancelOnKey);
    };
  }, [cancelAnimation]);

  const play = useCallback((reverse = false) => {
    const root = scene.current;
    if (!root) return;
    cancelAnimation();
    const portal = root.querySelector<HTMLElement>("[data-gp-immersive]")!;
    const pin = root.querySelector<HTMLElement>("[data-gp-pin]")!;
    const origin = portal.getBoundingClientRect().top + window.scrollY;
    const destination = origin + (reverse ? 0 : portal.offsetHeight - pin.offsetHeight);
    const from = window.scrollY;
    const distance = destination - from;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusIntro = () => root.querySelector<HTMLElement>("[data-gp-word-link]")?.focus({ preventScroll: true });
    if (reduced || Math.abs(distance) < 1) {
      window.scrollTo({ top: destination, behavior: "instant" });
      if (reverse) animation.current = requestAnimationFrame(() => { animation.current = 0; focusIntro(); });
      return;
    }
    const started = performance.now();
    const duration = reverse ? 1400 : 2200;
    const tick = (now: number) => {
      const fraction = Math.min(1, (now - started) / duration);
      // Ease the scroll only. GlyphPortal owns the continuous camera and reveal.
      const eased = fraction * fraction * (3 - 2 * fraction);
      window.scrollTo({ top: from + distance * eased, behavior: "instant" });
      if (fraction < 1) animation.current = requestAnimationFrame(tick);
      else {
        animation.current = 0;
        if (reverse) focusIntro();
      }
    };
    animation.current = requestAnimationFrame(tick);
  }, [cancelAnimation]);

  const onProgress = useCallback((progress: number) => {
    const complete = progress >= .99;
    if (complete && !entered.current) {
      scene.current?.querySelector<HTMLElement>("#account-title")?.focus({ preventScroll: true });
    }
    entered.current = complete;
  }, []);

  return <div ref={scene} className="atelier-entry">
    <GlyphPortal word="ATELIER" focusChar="A" interactive={false} immersive scrollLength={1.6}
      fontFamily='"Arial Black", "Helvetica Neue", Arial, sans-serif' fontWeight={900}
      enterLabel="Entrar no Atelier" className="entry-portal" onEnter={() => play()} onProgress={onProgress}
      style={{ "--gp-paper": "#f5f5f0", "--gp-ink": "#263d30", "--gp-field": "#203b2e", "--gp-foreground": "#f5f2e9" }}
      background={<div className="entry-field" aria-hidden="true"><span /><span /><span /></div>}
    >
      <AccountForm embedded onBack={() => play(true)} />
    </GlyphPortal>
  </div>;
}
