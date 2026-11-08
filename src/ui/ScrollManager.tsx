"use client";

import { useEffect } from "react";
import { initSmoothScroll, lockScroll, ScrollTrigger } from "@/animation/scroll";
import { ambience } from "@/audio/ambience";
import { chapters } from "@/experience/chapters";
import { activeChapterId, progress, scene } from "@/experience/progress";
import { useExperience } from "@/experience/store";

/** Owns smooth scrolling, chapter progress and pointer tracking. */
export default function ScrollManager() {
  const caps = useExperience((s) => s.caps);
  const entered = useExperience((s) => s.entered);
  const setActiveChapter = useExperience((s) => s.setActiveChapter);

  useEffect(() => {
    if (!caps) return;
    const destroyScroll = initSmoothScroll(caps.reducedMotion);
    lockScroll(true);

    // The navigation follows the chapter that owns the screen, even after a jump.
    const syncActive = () => {
      const id = activeChapterId();
      if (useExperience.getState().activeChapter !== id) setActiveChapter(id);
    };

    const triggers = chapters
      .filter((c) => c.status === "live")
      .map((c) =>
        ScrollTrigger.create({
          trigger: `#chapter-${c.id}`,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            progress[c.id] = self.progress;
            if (c.id === "beginning") ambience.setProgress(self.progress);
            syncActive();
          },
          // Keeps progress truthful after a reload / resize, before any scroll event.
          onRefresh: (self) => {
            progress[c.id] = self.progress;
            syncActive();
          },
        }),
      );

    const onPointer = (e: PointerEvent) => {
      scene.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      scene.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      triggers.forEach((t) => t.kill());
      window.removeEventListener("pointermove", onPointer);
      destroyScroll();
    };
  }, [caps, setActiveChapter]);

  useEffect(() => {
    if (entered) {
      lockScroll(false);
      ScrollTrigger.refresh();
    }
  }, [entered]);

  return null;
}
