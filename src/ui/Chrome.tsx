"use client";

import { ambience } from "@/audio/ambience";
import { scrollToChapterProgress } from "@/animation/scroll";
import { useExperience } from "@/experience/store";

/** Persistent frame: wordmark, sound toggle, mobile chapter counter. */
export default function Chrome() {
  const entered = useExperience((s) => s.entered);
  const soundOn = useExperience((s) => s.soundOn);
  const setSound = useExperience((s) => s.setSound);
  const setCartOpen = useExperience((s) => s.setCartOpen);
  const count = useExperience((s) => s.cart.reduce((n, c) => n + c.qty, 0));

  const toggle = () => {
    const next = !soundOn;
    setSound(next);
    ambience.setEnabled(next);
  };

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 transition-opacity duration-[1500ms] delay-[2200ms] ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        onClick={() => scrollToChapterProgress("beginning", 0)}
        className="pointer-events-auto absolute left-5 top-5 sm:left-8 sm:top-7 font-serif text-[13px] tracking-[0.42em] text-paper/85 mix-blend-difference"
      >
        BELIEVE ME
      </button>

      <div className="pointer-events-auto absolute right-5 top-6 sm:right-8 sm:top-8 flex gap-6 font-sans text-[9px] tracking-[0.35em] text-mist/70 mix-blend-difference">
        <button onClick={() => scrollToChapterProgress("collection", 0.2)} className="hover:text-paper">
          COLLECTION
        </button>
        <button onClick={() => setCartOpen(true)} className="hover:text-paper">
          PANIER ({count})
        </button>
      </div>

      <button
        onClick={toggle}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Couper le son" : "Activer le son"}
        className="pointer-events-auto absolute bottom-6 left-5 sm:bottom-8 sm:left-8 flex items-center gap-3 font-sans text-[9px] tracking-[0.35em] text-mist/60 hover:text-paper transition-colors mix-blend-difference"
      >
        <span className="flex h-3 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-px bg-current ${soundOn ? "sound-bar" : ""}`}
              style={{ height: soundOn ? undefined : "2px", animationDelay: `${i * 0.17}s` }}
            />
          ))}
        </span>
        {soundOn ? "SON" : "MUET"}
      </button>
    </div>
  );
}
