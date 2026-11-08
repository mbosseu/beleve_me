"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { gsap } from "@/animation/scroll";
import { ambience } from "@/audio/ambience";
import { scene } from "@/experience/progress";
import { useExperience } from "@/experience/store";

/** Switches the desk lamp on like a real bulb: two hesitant flickers, then light. */
function switchOnLamp(reduced: boolean) {
  if (reduced) {
    gsap.to(scene, { light: 1, duration: 1.2, ease: "power1.out" });
    return;
  }
  gsap
    .timeline({ delay: 0.9 })
    .call(() => ambience.click())
    .to(scene, { light: 0.32, duration: 0.05 })
    .to(scene, { light: 0.03, duration: 0.11 })
    .to(scene, { light: 0.55, duration: 0.05, delay: 0.18 })
    .to(scene, { light: 0.16, duration: 0.16 })
    .to(scene, { light: 1, duration: 2.6, ease: "power2.out" });
}

export default function Intro() {
  const caps = useExperience((s) => s.caps);
  const entered = useExperience((s) => s.entered);
  const enter = useExperience((s) => s.enter);
  const { progress: loaded, active } = useProgress();
  const [gone, setGone] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), 1400);
    // Cached assets may never report progress — never trap the visitor.
    const fallback = setTimeout(() => setTimedOut(true), 6000);
    return () => {
      clearTimeout(t);
      clearTimeout(fallback);
    };
  }, []);

  const webgl = caps?.webgl ?? true;
  const ready = minTimeElapsed && (!webgl || timedOut || (!active && loaded >= 100));
  const pct = ready ? 100 : webgl ? Math.round(loaded) : 100;

  const onEnter = (withSound: boolean) => {
    enter(withSound);
    if (withSound) ambience.setEnabled(true);
    switchOnLamp(caps?.reducedMotion ?? false);
    setTimeout(() => setGone(true), 1600);
  };

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink text-paper transition-opacity duration-[1400ms] ease-out ${
        entered ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <p className="font-serif text-[clamp(1.1rem,2vw,1.5rem)] tracking-[0.42em] pl-[0.42em] text-paper/90">
        BELIEVE ME
      </p>

      <div className="mt-8 h-px w-40 bg-paper/10 overflow-hidden">
        <div
          className="h-full bg-embroidery/80 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-4 font-sans text-[10px] tracking-[0.35em] text-mist/50 tabular-nums">
        {ready ? "PRÊT" : `${String(pct).padStart(3, "0")}`}
      </p>

      <div
        className={`mt-14 flex flex-col items-center gap-5 transition-all duration-1000 ${
          ready ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
        }`}
      >
        <button
          onClick={() => onEnter(true)}
          className="group relative font-sans text-[11px] tracking-[0.45em] pl-[0.45em] text-paper py-3 px-8 border border-paper/20 hover:border-embroidery/70 transition-colors duration-500"
        >
          ENTRER
          <span className="absolute inset-x-8 bottom-2 h-px origin-left scale-x-0 bg-embroidery transition-transform duration-500 group-hover:scale-x-100" />
        </button>
        <button
          onClick={() => onEnter(false)}
          className="font-sans text-[10px] tracking-[0.3em] text-mist/45 hover:text-mist/80 transition-colors"
        >
          ENTRER SANS LE SON
        </button>
        <p className="mt-6 max-w-[18rem] text-center font-serif italic text-sm text-mist/40">
          Une expérience à vivre avec le son.
        </p>
      </div>
    </div>
  );
}
