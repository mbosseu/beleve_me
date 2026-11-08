"use client";

import { scrollToElement } from "@/animation/scroll";
import { chapters } from "@/experience/chapters";
import { useExperience } from "@/experience/store";

/** Chapter index — lets the visitor return to any scene already built. */
export default function ChapterNav() {
  const entered = useExperience((s) => s.entered);
  const active = useExperience((s) => s.activeChapter);

  return (
    <nav
      aria-label="Chapitres"
      className={`fixed z-20 transition-opacity duration-[1500ms] delay-[2500ms] ${
        entered ? "opacity-100" : "opacity-0 pointer-events-none"
      } right-5 top-1/2 -translate-y-1/2 hidden md:block`}
    >
      <ol className="flex flex-col gap-3.5">
        {chapters.map((c) => {
          const live = c.status === "live";
          const isActive = active === c.id;
          return (
            <li key={c.id}>
              <button
                disabled={!live}
                onClick={() => scrollToElement(`#chapter-${c.id}`)}
                className="group relative flex w-14 items-center justify-end gap-3 disabled:cursor-default"
                title={live ? c.title : `${c.title} — en création`}
              >
                <span
                  className={`absolute right-full mr-3 whitespace-nowrap font-sans text-[9px] uppercase tracking-[0.3em] transition-all duration-500 ${
                    isActive ? "opacity-100 text-paper" : "opacity-0 group-hover:opacity-70 text-mist"
                  }`}
                >
                  {c.title}
                  {!live && <span className="ml-2 text-embroidery/70 normal-case tracking-[0.15em]">bientôt</span>}
                </span>
                <span
                  className={`font-sans text-[9px] tabular-nums tracking-[0.2em] ${
                    isActive ? "text-embroidery" : live ? "text-mist/60" : "text-mist/20"
                  }`}
                >
                  {c.index}
                </span>
                <span className="flex w-8 justify-end">
                  <span
                    className={`block h-px transition-all duration-500 ${
                      isActive ? "w-8 bg-embroidery" : live ? "w-4 bg-mist/40" : "w-2 bg-mist/15"
                    }`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
