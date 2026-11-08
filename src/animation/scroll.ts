import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { scene } from "@/experience/progress";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll(reducedMotion: boolean) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  if (reducedMotion) return () => {};

  // Responsive but still smooth: the wheel answers within a few frames.
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true, wheelMultiplier: 1.1, touchMultiplier: 1.6 });
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

const CURTAIN_ID = "jump-curtain";
let jumping = false;

/**
 * Goes to a scroll position. Short distances glide; long ones cut through a
 * quick black fade instead of scrolling through every chapter on the way.
 */
export function goTo(y: number, onArrive?: () => void) {
  const distance = Math.abs(y - window.scrollY);
  const near = distance < window.innerHeight * 1.5;
  if (near) {
    if (lenis) lenis.scrollTo(y, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3), onComplete: onArrive });
    else {
      window.scrollTo(0, y);
      onArrive?.();
    }
    return;
  }
  if (jumping) return;
  jumping = true;
  const curtain = document.getElementById(CURTAIN_ID);
  curtain?.classList.add("is-on");
  window.setTimeout(() => {
    const wasStopped = lenis?.isStopped;
    if (wasStopped) lenis?.start();
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    if (wasStopped) lenis?.stop();
    scene.jumpAt = performance.now();
    ScrollTrigger.update();
    window.setTimeout(() => {
      curtain?.classList.remove("is-on");
      jumping = false;
      onArrive?.();
    }, 140);
  }, 260);
}

export function scrollToElement(selector: string, offset = 0) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;
  goTo(el.offsetTop + offset);
}

/** Goes to a given progress (0 → 1) inside a chapter section. */
export function scrollToChapterProgress(id: string, p: number, onArrive?: () => void) {
  const el = document.querySelector<HTMLElement>(`#chapter-${id}`);
  if (!el) return;
  goTo(el.offsetTop + p * (el.offsetHeight - window.innerHeight), onArrive);
}

export { gsap, ScrollTrigger, CURTAIN_ID };
