"use client";
/* eslint-disable @next/next/no-img-element */

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
      className={`fixed inset-0 z-50 intro-paper overflow-y-auto text-ink transition-opacity duration-[1400ms] ease-out ${
        entered ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1760px] flex-col items-center justify-center gap-8 px-4 py-8 lg:flex-row lg:gap-[3vw] lg:px-[2.5vw] lg:py-[3vh]">
        {/* The brand board, shown whole and untouched */}
        <figure className="intro-board w-full lg:w-auto lg:flex-[0_1_auto]">
          <img
            src="/textures/home-signature-board.jpg"
            alt="BELIEVE ME — Doudoune signature : vues face et dos, détails de broderie, étiquette, zip et matière, coloris disponibles"
            width={1536}
            height={1024}
            className="intro-board-img mx-auto block h-auto w-full lg:max-h-[94vh] lg:w-auto"
          />
        </figure>

        <div className="flex shrink-0 flex-col items-center text-center lg:w-[min(30vw,380px)]">
          <p className="pl-[0.42em] font-serif text-[clamp(1.1rem,2vw,1.6rem)] tracking-[0.42em] text-ink">BELIEVE ME</p>
          <p className="mt-3 font-serif text-sm italic text-graphite/70">More than clothing. A story you can wear.</p>

          <div className="mt-8 h-px w-40 overflow-hidden bg-ink/10">
            <div className="h-full bg-[#4a2b1d] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-4 font-sans text-[10px] tabular-nums tracking-[0.35em] text-graphite/60">
            {ready ? "PRÊT" : `${String(pct).padStart(3, "0")}`}
          </p>

          <div
            className={`mt-10 flex flex-col items-center gap-5 transition-all duration-1000 ${
              ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
            }`}
          >
            <button
              onClick={() => onEnter(true)}
              className="group relative w-52 border border-ink/80 bg-ink py-3.5 font-sans text-[11px] tracking-[0.45em] text-paper transition-colors duration-500 hover:bg-[#4a2b1d] hover:border-[#4a2b1d]"
            >
              <span className="pl-[0.45em]">ENTRER</span>
              <span className="absolute inset-x-10 bottom-2 h-px origin-left scale-x-0 bg-paper/70 transition-transform duration-500 group-hover:scale-x-100" />
            </button>
            <button
              onClick={() => onEnter(false)}
              className="font-sans text-[10px] tracking-[0.3em] text-graphite/60 transition-colors hover:text-ink"
            >
              ENTRER SANS LE SON
            </button>
            <p className="mt-4 max-w-[18rem] text-center font-serif text-sm italic text-graphite/55">
              Une expérience à vivre avec le son.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
