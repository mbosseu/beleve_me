"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll, scrollToChapterProgress } from "@/animation/scroll";
import { productBySlug } from "@/data/products";
import { activeChapterId, progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";
import { removeWhiteBackground } from "@/lib/removeWhite";

const PHOTOS = [
  { id: "front", src: "/textures/piece/worn-front.jpg", title: "Porté — Face", sub: "Le fondateur", w: 660, h: 1328 },
  { id: "back", src: "/textures/piece/worn-back.jpg", title: "Porté — Dos", sub: "Broderie botanique", w: 700, h: 1348 },
] as const;

const PRODUCT = productBySlug("doudoune-signature");
const PRICE =
  PRODUCT?.price != null
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(PRODUCT.price)
    : "";

/** Start / end of the lookbook moment in the signature chapter. */
export const LOOKBOOK: [number, number] = [0.86, 0.988];

/**
 * Closing spread of the signature chapter, drawn in HTML over the 3D studio
 * so the photographs stay pin-sharp at full resolution: the founder wearing
 * the piece (front / back) as framed prints, the piece in the centre, then a
 * way to the shop. Prints open full screen.
 */
export default function SignatureCta() {
  const root = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  // The piece, cut out of its white render background.
  const [piece, setPiece] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    removeWhiteBackground("/textures/piece/front.jpg")
      .then((url) => alive && setPiece(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let shown = false;
    const loop = () => {
      const p = progress.signature;
      const on =
        activeChapterId() === "signature" &&
        p > LOOKBOOK[0] + 0.02 &&
        p < LOOKBOOK[1] &&
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

  const shop = () =>
    scrollToChapterProgress("collection", 0.58, () =>
      window.setTimeout(() => useExperience.getState().focus("doudoune-signature"), 350),
    );

  const Print = ({ i, delay }: { i: number; delay: string }) => {
    const ph = PHOTOS[i];
    return (
      <figure className="lookbook-item flex flex-col items-center" style={{ transitionDelay: delay }}>
        <button
          onClick={() => setViewer(i)}
          aria-label={`Agrandir — ${ph.title}`}
          className="group relative block border-[5px] border-[#151515] bg-paper p-[clamp(6px,0.9vw,14px)] shadow-[0_28px_60px_-18px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:-translate-y-1"
        >
          <img
            src={ph.src}
            alt={`${ph.title} — ${ph.sub}`}
            width={ph.w}
            height={ph.h}
            className="block h-[min(31vh,66vw)] w-auto object-cover md:h-[min(62vh,40vw)]"
          />
          <span className="pointer-events-none absolute right-3 top-3 bg-ink/70 px-2 py-1 font-sans text-[9px] tracking-[0.3em] text-paper opacity-0 transition-opacity group-hover:opacity-100">
            AGRANDIR ↗
          </span>
        </button>
        <figcaption className="mt-3 text-center md:mt-5">
          <p className="font-sans text-[9px] tracking-[0.38em] text-ink md:text-[10px]">{ph.title.toUpperCase()}</p>
          <p className="mt-1 font-serif text-xs italic text-graphite/70 md:text-sm">{ph.sub}</p>
        </figcaption>
      </figure>
    );
  };

  const photo = viewer !== null ? PHOTOS[viewer] : null;

  return (
    <>
      <div
        ref={root}
        data-on="0"
        data-ui
        className="lookbook pointer-events-none fixed inset-0 z-[12] flex flex-col items-center justify-center gap-[3vh] px-4 pb-[3vh] pt-[9vh]"
      >
        <div className="flex w-full max-w-[1400px] flex-wrap items-end justify-center gap-x-[3vw] gap-y-[2vh] md:flex-nowrap">
          {/* Piece first on phones, centre on large screens */}
          <figure className="lookbook-item order-first flex w-full flex-col items-center md:order-none md:w-auto" style={{ transitionDelay: "0.05s" }}>
            <button onClick={shop} aria-label="Voir en boutique" className="block">
              <img
                src={piece ?? "/textures/piece/front.jpg"}
                alt="Doudoune Signature BELIEVE ME — vue de face"
                width={600}
                height={700}
                className={`block h-[min(22vh,56vw)] w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)] md:h-[min(52vh,34vw)] ${piece ? "" : "invisible"}`}
              />
            </button>
            <figcaption className="mt-2 text-center md:mt-5">
              <p className="font-sans text-[9px] tracking-[0.38em] text-ink md:text-[10px]">
                {(PRODUCT?.name ?? "Doudoune Signature").toUpperCase()}
              </p>
              <p className="mt-1 font-serif text-xs italic text-graphite/70 md:text-sm">{PRICE}</p>
            </figcaption>
          </figure>
          <div className="contents md:order-first md:block">
            <Print i={0} delay="0.15s" />
          </div>
          <Print i={1} delay="0.25s" />
        </div>

        <div className="lookbook-item flex flex-col items-center gap-3" style={{ transitionDelay: "0.35s" }}>
          <button
            onClick={shop}
            className="group flex items-center gap-4 bg-ink px-8 py-3.5 font-sans text-[10px] tracking-[0.4em] text-paper transition-colors hover:bg-graphite"
          >
            DÉCOUVRIR EN BOUTIQUE
            <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
          </button>
          <p className="font-sans text-[9px] tracking-[0.3em] text-graphite/55">CLIQUEZ SUR UNE PHOTO POUR L&apos;AGRANDIR</p>
        </div>
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
              className="max-h-[82vh] w-auto bg-paper object-contain p-3 sm:p-4"
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
