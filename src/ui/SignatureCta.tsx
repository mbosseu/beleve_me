"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll, scrollToChapterProgress } from "@/animation/scroll";
import { activeChapterId, progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";

const PHOTOS = [
  { id: "front", src: "/textures/piece/worn-front.jpg", title: "Porté — Face", sub: "Le fondateur", w: 660, h: 1328 },
  { id: "back", src: "/textures/piece/worn-back.jpg", title: "Porté — Dos", sub: "Broderie botanique", w: 700, h: 1348 },
] as const;

/**
 * Footer of the signature lookbook: open the worn photos full screen, turn
 * the piece, or go to the shop.
 */
export default function SignatureCta() {
  const root = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let shown = false;
    const loop = () => {
      const on =
        activeChapterId() === "signature" &&
        progress.signature > 0.9 &&
        progress.signature < 0.988 &&
        !useExperience.getState().focusedProduct;
      if (on !== shown && root.current) {
        shown = on;
        root.current.dataset.on = on ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Full-screen viewer: scroll locked, Esc / arrows / click outside.
  const close = useCallback(() => setViewer(null), []);
  useEffect(() => {
    if (viewer === null) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setViewer((v) => (v === null ? v : (v + 1) % PHOTOS.length));
      if (e.key === "ArrowLeft") setViewer((v) => (v === null ? v : (v + PHOTOS.length - 1) % PHOTOS.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [viewer, close]);

  const open = () =>
    scrollToChapterProgress("collection", 0.58, () =>
      window.setTimeout(() => useExperience.getState().focus("doudoune-signature"), 350),
    );

  const photo = viewer !== null ? PHOTOS[viewer] : null;

  return (
    <>
      <div
        ref={root}
        data-on="0"
        data-ui
        className="signature-cta pointer-events-none fixed inset-x-0 bottom-0 z-[12] flex flex-col items-center gap-4 px-6 pb-[4.5vh] text-center"
      >
        <div className="flex items-center gap-6 font-sans text-[9px] tracking-[0.35em] text-graphite/70">
          {PHOTOS.map((p, i) => (
            <button key={p.id} onClick={() => setViewer(i)} className="underline-offset-4 hover:text-ink hover:underline">
              {p.title.toUpperCase()} ↗
            </button>
          ))}
          <span className="hidden text-graphite/45 sm:inline">· GLISSEZ POUR FAIRE TOURNER LA PIÈCE</span>
        </div>
        <button
          onClick={open}
          className="group flex items-center gap-4 bg-ink px-8 py-3.5 font-sans text-[10px] tracking-[0.4em] text-paper transition-colors hover:bg-graphite"
        >
          DÉCOUVRIR EN BOUTIQUE
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
        </button>
      </div>

      {photo && viewer !== null && (
        <div
          data-ui
          role="dialog"
          aria-modal="true"
          aria-label={photo.title}
          onClick={close}
          className="fixed inset-0 z-[60] flex animate-[fade_0.35s_ease] items-center justify-center bg-ink/95 p-6"
        >
          <figure onClick={(e) => e.stopPropagation()} className="flex max-h-full flex-col items-center">
            <img
              src={photo.src}
              alt={`${photo.title} — ${photo.sub}`}
              width={photo.w}
              height={photo.h}
              className="max-h-[80vh] w-auto bg-paper object-contain p-3 sm:p-4"
            />
            <figcaption className="mt-5 text-center">
              <p className="font-sans text-[10px] tracking-[0.4em] text-paper">{photo.title.toUpperCase()}</p>
              <p className="mt-1 font-serif text-sm italic text-mist/70">{photo.sub}</p>
            </figcaption>
          </figure>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewer((viewer + PHOTOS.length - 1) % PHOTOS.length);
            }}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-4 font-sans text-xl text-mist/70 hover:text-paper sm:left-8"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewer((viewer + 1) % PHOTOS.length);
            }}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-4 font-sans text-xl text-mist/70 hover:text-paper sm:right-8"
          >
            →
          </button>
          <button
            onClick={close}
            className="absolute right-5 top-5 font-sans text-[10px] tracking-[0.3em] text-mist/70 hover:text-paper sm:right-8 sm:top-7"
          >
            FERMER ✕
          </button>
        </div>
      )}
    </>
  );
}
