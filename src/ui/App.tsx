"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { scrollToChapterProgress, scrollToElement } from "@/animation/scroll";
import { chapters } from "@/experience/chapters";
import { useExperience } from "@/experience/store";
import { detectCapabilities } from "@/lib/capabilities";
import ChapterNav from "./ChapterNav";
import Chrome from "./Chrome";
import Intro from "./Intro";
import CartDrawer from "./CartDrawer";
import Narration from "./Narration";
import ProductSheet from "./ProductSheet";
import ScrollManager from "./ScrollManager";
import StaticFallback from "./StaticFallback";

// The 3D layer ships in its own chunk and never renders on the server.
const Experience = dynamic(() => import("@/experience/Experience"), { ssr: false });

/** Teaser line for the next chapter still in the making. */
const BRIDGE: Record<string, string> = {
  creation: "Le fil est prêt. L'atelier s'éclaire.",
  signature: "Les lumières du studio s'allument.",
  collection: "La collection prend place.",
  message: "Il reste une dernière chose à dire.",
};

export default function App() {
  const caps = useExperience((s) => s.caps);
  const setCaps = useExperience((s) => s.setCaps);

  useEffect(() => {
    setCaps(detectCapabilities());
  }, [setCaps]);

  const next = chapters.find((c) => c.status === "in-progress");

  return (
    <>
      {caps && (caps.webgl ? <Experience /> : <StaticFallback />)}
      <ScrollManager />
      <Narration />
      <Chrome />
      <ChapterNav />
      <ProductSheet />
      <CartDrawer />
      <Intro />
      <div id="jump-curtain" className="jump-curtain" aria-hidden />
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />

      <main className="relative z-[6]">
        {chapters
          .filter((c) => c.status === "live")
          .map((c) => (
            <section
              key={c.id}
              id={`chapter-${c.id}`}
              aria-label={`${c.index} — ${c.title}`}
              style={{ height: `${c.length * 100}vh` }}
            />
          ))}

        {/* Bridge to the next chapter — honest about what is not built yet. */}
        {next && (
          <section className="relative flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-paper">
            <p className="font-sans text-[10px] tracking-[0.42em] text-mist/50">
              {next.index} — {next.title.toUpperCase()}
            </p>
            <h2 className="mt-8 max-w-[18ch] font-serif text-[clamp(2rem,5vw,4.2rem)] font-light leading-[1.02]">
              {BRIDGE[next.id] ?? next.label}
            </h2>
            <p className="mt-8 max-w-md font-serif text-lg italic text-embroidery/80">
              Ce chapitre est en cours de création.
            </p>
            <button
              onClick={() => scrollToElement("#chapter-beginning")}
              className="mt-14 border-b border-paper/30 pb-1 font-sans text-[10px] tracking-[0.4em] hover:border-embroidery transition-colors"
            >
              REVOIR LE COMMENCEMENT
            </button>
          </section>
        )}

        {/* Closing page — over the last scene, which keeps living behind it. */}
        {!next && (
          <section
            aria-label="Fin de l'histoire"
            className="relative flex min-h-screen flex-col items-center justify-end px-6 pb-[11vh] text-center text-paper"
          >
            <p className="font-serif text-[clamp(1.6rem,3.4vw,2.8rem)] font-light italic leading-tight text-paper">
              Believe in yourself,
              <br />
              even when nobody else does.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
              <button
                onClick={() => scrollToChapterProgress("collection", 0.2)}
                className="border border-paper/30 px-9 py-4 font-sans text-[10px] tracking-[0.42em] transition-colors hover:border-embroidery"
              >
                DÉCOUVRIR LA COLLECTION
              </button>
              <button
                onClick={() =>
                  scrollToChapterProgress("collection", 0.58, () =>
                    window.setTimeout(() => useExperience.getState().focus("doudoune-signature"), 350),
                  )
                }
                className="bg-paper px-9 py-4 font-sans text-[10px] tracking-[0.42em] text-ink transition-colors hover:bg-embroidery"
              >
                LA BOUTIQUE
              </button>
            </div>
            <p className="mt-14 font-sans text-[9px] tracking-[0.42em] text-mist/45">
              BELIEVE ME — MORE THAN CLOTHING. A STORY YOU CAN WEAR.
            </p>
            <button
              onClick={() => scrollToElement("#chapter-beginning")}
              className="mt-5 font-sans text-[9px] tracking-[0.35em] text-mist/45 underline-offset-4 hover:text-paper hover:underline"
            >
              REVOIR L&apos;HISTOIRE
            </button>
          </section>
        )}
      </main>
    </>
  );
}
