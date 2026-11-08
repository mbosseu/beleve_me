"use client";

import { useEffect, useRef } from "react";
import { activeChapterId } from "@/experience/progress";

/**
 * Free 360° rotation of the piece by mouse drag or horizontal swipe.
 * Listens on window because the scroll sections sit above the canvas.
 * Vertical touch gestures are left to the page scroll.
 */
export function useDragRotate(chapter: string) {
  const state = useRef({ yaw: 0, velocity: 0, dragging: false, lastX: 0, startX: 0, startY: 0, decided: false, horizontal: false });

  useEffect(() => {
    const s = state.current;
    const isUi = (t: EventTarget | null) => t instanceof Element && !!t.closest("button, a, nav, input, select");

    const down = (e: PointerEvent) => {
      if (activeChapterId() !== chapter || isUi(e.target)) return;
      s.dragging = true;
      s.decided = e.pointerType === "mouse";
      s.horizontal = e.pointerType === "mouse";
      s.lastX = s.startX = e.clientX;
      s.startY = e.clientY;
      s.velocity = 0;
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      if (!s.decided) {
        const dx = Math.abs(e.clientX - s.startX);
        const dy = Math.abs(e.clientY - s.startY);
        if (dx + dy < 8) return;
        s.decided = true;
        s.horizontal = dx > dy;
      }
      if (!s.horizontal) return;
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      const delta = (dx / window.innerWidth) * Math.PI * 2.2;
      s.yaw += delta;
      s.velocity = delta;
      document.documentElement.classList.add("is-rotating");
    };
    const up = () => {
      s.dragging = false;
      document.documentElement.classList.remove("is-rotating");
    };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [chapter]);

  /** Call every frame: applies inertia and returns the user's yaw offset. */
  return (dt: number) => {
    const s = state.current;
    if (!s.dragging) {
      s.yaw += s.velocity;
      s.velocity *= Math.exp(-dt * 4);
    }
    return s.yaw;
  };
}
