import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll(reducedMotion: boolean) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  if (reducedMotion) return () => {};

  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.4 });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle("scroll-locked", locked);
  if (locked) lenis?.stop();
  else lenis?.start();
}

export function scrollToElement(selector: string, offset = 0) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: "auto" });
}

export { gsap, ScrollTrigger };

/** Scrolls to a given progress (0 → 1) inside a chapter section. */
export function scrollToChapterProgress(id: string, p: number) {
  const el = document.querySelector<HTMLElement>(`#chapter-${id}`);
  if (!el) return;
  const y = el.offsetTop + p * (el.offsetHeight - window.innerHeight);
  if (lenis) lenis.scrollTo(y, { duration: 2.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo(0, y);
}
