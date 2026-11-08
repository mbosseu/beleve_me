"use client";

import { useEffect, useRef } from "react";
import { activeChapterId, DAMPING, justJumped, progress } from "@/experience/progress";
import { useExperience } from "@/experience/store";

type Variant = "display" | "statement" | "caption" | "label";

interface Beat {
  id: string;
  chapter: "beginning" | "inspiration" | "creation" | "signature" | "collection" | "message";
  /** [start, end] of the reveal, in chapter progress. */
  in: [number, number];
  /** [start, end] of the exit. */
  out: [number, number];
  lines: string[];
  variant: Variant;
  align: "center" | "left" | "bottom" | "corner";
}

/**
 * Narration, timed against each chapter's camera keys
 * (see each scene layout.ts). Chapter 02 copy is a proposal pending brand approval.
 */
const BEATS: Beat[] = [
  {
    id: "chapter",
    chapter: "beginning",
    in: [-1, 0],
    out: [0.03, 0.09],
    lines: ["01 — The Beginning", "Le commencement"],
    variant: "label",
    align: "bottom",
  },
  {
    id: "idea",
    chapter: "beginning",
    in: [0.09, 0.19],
    out: [0.3, 0.36],
    lines: ["Everything starts", "with an idea."],
    variant: "display",
    align: "center",
  },
  {
    id: "believe",
    chapter: "beginning",
    in: [0.45, 0.57],
    out: [0.72, 0.78],
    lines: ["Before the world believed in us,", "we had to believe in ourselves."],
    variant: "statement",
    align: "left",
  },
  {
    id: "caption",
    chapter: "beginning",
    in: [0.79, 0.83],
    out: [0.89, 0.92],
    lines: ["Esquisse nº 1", "Crayon sur papier — le premier dessin de BELIEVE ME"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "insp-chapter",
    chapter: "inspiration",
    in: [0.03, 0.08],
    out: [0.15, 0.2],
    lines: ["02 — The Inspiration", "L'inspiration"],
    variant: "label",
    align: "bottom",
  },
  {
    id: "insp-bloom",
    chapter: "inspiration",
    in: [0.4, 0.48],
    out: [0.56, 0.61],
    lines: ["Not yet in bloom.", "Already alive."],
    variant: "display",
    align: "center",
  },
  {
    id: "insp-shadow",
    chapter: "inspiration",
    in: [0.62, 0.68],
    out: [0.76, 0.8],
    lines: ["Around it, everything kept growing —", "even in the shadow."],
    variant: "statement",
    align: "left",
  },
  {
    id: "insp-name",
    chapter: "inspiration",
    in: [0.86, 0.9],
    out: [0.97, 0.995],
    lines: ["Believe me", "« Crois en moi » — pas encore au sommet, déjà en chemin"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "crea-chapter",
    chapter: "creation",
    in: [0.004, 0.03],
    out: [0.09, 0.12],
    lines: ["03 — The Creation", "La création"],
    variant: "label",
    align: "bottom",
  },
  {
    id: "crea-title",
    chapter: "creation",
    in: [0.03, 0.08],
    out: [0.1, 0.13],
    lines: ["From paper", "to fabric."],
    variant: "display",
    align: "center",
  },
  {
    id: "crea-1",
    chapter: "creation",
    in: [0.12, 0.15],
    out: [0.2, 0.23],
    lines: ["I — Le dessin", "The sketch becomes a plan"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "crea-2",
    chapter: "creation",
    in: [0.27, 0.3],
    out: [0.36, 0.39],
    lines: ["II — La matière", "Choosing what it will be made of"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "crea-3",
    chapter: "creation",
    in: [0.43, 0.46],
    out: [0.52, 0.55],
    lines: ["III — Le volume", "Five quilted rows. Structure before style"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "crea-4",
    chapter: "creation",
    in: [0.59, 0.62],
    out: [0.68, 0.71],
    lines: ["IV — La broderie", "Stitch after stitch, the drawing becomes thread"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "crea-5",
    chapter: "creation",
    in: [0.73, 0.76],
    out: [0.82, 0.85],
    lines: ["V — Les finitions", "Metal, weight, the sound of a zip"],
    variant: "caption",
    align: "bottom",
  },
  {
    id: "crea-promise",
    chapter: "creation",
    in: [0.86, 0.91],
    out: [0.96, 0.99],
    lines: ["Every detail is a promise", "we intend to keep."],
    variant: "statement",
    align: "left",
  },
  {
    id: "sig-chapter",
    chapter: "signature",
    in: [0.004, 0.03],
    out: [0.09, 0.12],
    lines: ["04 — The Signature Piece", "La pièce signature"],
    variant: "label",
    align: "bottom",
  },
  {
    id: "sig-title",
    chapter: "signature",
    in: [0.03, 0.07],
    out: [0.1, 0.13],
    lines: ["Doudoune", "Signature."],
    variant: "display",
    align: "center",
  },
  {
    id: "sig-front",
    chapter: "signature",
    in: [0.13, 0.15],
    out: [0.18, 0.2],
    lines: ["01 — Face", "Monogramme BM brodé · zip métal central"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-side",
    chapter: "signature",
    in: [0.26, 0.28],
    out: [0.31, 0.33],
    lines: ["02 — Profil", "Coupe ample et structurée · capuche volumineuse"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-back",
    chapter: "signature",
    in: [0.39, 0.41],
    out: [0.44, 0.46],
    lines: ["03 — Dos", "Broderie botanique · BELIEVE ME · BM"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-emb",
    chapter: "signature",
    in: [0.49, 0.51],
    out: [0.56, 0.58],
    lines: ["04 — Broderie", "Fil beige en relief sur nylon noir"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-zip",
    chapter: "signature",
    in: [0.63, 0.65],
    out: [0.71, 0.73],
    lines: ["05 — Fermeture", "Zip métal argent · tirette gravée BM"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-fabric",
    chapter: "signature",
    in: [0.74, 0.76],
    out: [0.81, 0.83],
    lines: ["06 — Matière & monogramme", "Nylon mat · BM brodé ton sur ton beige"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-finish",
    chapter: "signature",
    in: [0.84, 0.86],
    out: [0.91, 0.93],
    lines: ["07 — Finitions", "Bord-côte élastiqué · poignets resserrés"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "sig-free",
    chapter: "signature",
    in: [0.95, 0.975],
    out: [1.1, 1.2],
    lines: ["Portée par le fondateur", "Glissez pour faire tourner la pièce"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "col-chapter",
    chapter: "collection",
    in: [0.004, 0.03],
    out: [0.09, 0.12],
    lines: ["05 — The Collection", "La collection"],
    variant: "label",
    align: "bottom",
  },
  {
    id: "col-title",
    chapter: "collection",
    in: [0.08, 0.14],
    out: [0.22, 0.27],
    lines: ["One story.", "Every piece."],
    variant: "display",
    align: "center",
  },
  {
    id: "col-hero",
    chapter: "collection",
    in: [0.56, 0.59],
    out: [0.66, 0.69],
    lines: ["Disponible — Doudoune Signature", "Cliquez sur la pièce pour ouvrir sa fiche"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "col-select",
    chapter: "collection",
    in: [0.9, 0.94],
    out: [1.1, 1.2],
    lines: ["Sélectionnez une pièce", "Cliquez ou touchez un présentoir pour l'explorer"],
    variant: "caption",
    align: "corner",
  },
  {
    id: "msg-chapter",
    chapter: "message",
    in: [0.004, 0.03],
    out: [0.08, 0.11],
    lines: ["06 — The Message", "Le message"],
    variant: "label",
    align: "bottom",
  },
  {
    id: "msg-believe",
    chapter: "message",
    in: [0.14, 0.24],
    out: [0.4, 0.46],
    lines: ["They didn't believe in us.", "We never stopped believing."],
    variant: "statement",
    align: "center",
  },
  {
    id: "msg-story",
    chapter: "message",
    in: [0.52, 0.6],
    out: [0.74, 0.8],
    lines: ["Your story", "is not over."],
    variant: "display",
    align: "center",
  },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const variantClass: Record<Variant, string> = {
  display:
    "font-serif font-light uppercase text-[clamp(2.1rem,6.2vw,5.6rem)] leading-[0.98] tracking-[0.04em] text-paper",
  statement:
    "font-serif font-light text-[clamp(1.45rem,3.3vw,2.9rem)] leading-[1.12] text-paper [&_.line:last-child]:italic",
  caption: "font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.32em] leading-[2.1] text-mist/80 [&_.line:first-child]:text-paper",
  label: "font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.42em] leading-[2.2] text-mist/70 [&_.line:first-child]:text-paper",
};

const alignClass: Record<Beat["align"], string> = {
  center: "inset-0 flex items-center justify-center text-center px-6",
  left: "inset-0 flex items-end justify-start text-left px-6 pb-28 sm:pb-[12vh] sm:pl-[8vw]",
  bottom: "inset-x-0 bottom-0 flex justify-center text-center px-6 pb-[17vh]",
  corner: "inset-x-0 bottom-0 flex justify-start text-left px-6 pb-24 sm:pb-[11vh] sm:pl-[8vw]",
};

export default function Narration() {
  const entered = useExperience((s) => s.entered);
  const reduced = useExperience((s) => s.caps?.reducedMotion ?? false);
  const root = useRef<HTMLDivElement>(null);
  const whiteout = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const beats = BEATS.map((b) => ({
      beat: b,
      node: el.querySelector<HTMLElement>(`[data-beat="${b.id}"]`)!,
      words: Array.from(el.querySelectorAll<HTMLElement>(`[data-beat="${b.id}"] .word`)),
    }));

    const smoothed: Record<string, number> = { beginning: progress.beginning, inspiration: progress.inspiration, creation: progress.creation, signature: progress.signature, collection: progress.collection, message: progress.message };
    let last = performance.now();
    let raf = 0;
    let enteredAt = entered ? 0 : -1;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // Same damping as the camera so words land with the shot.
      const k = justJumped() ? 1 : 1 - Math.exp(-dt * (reduced ? 12 : DAMPING));
      for (const id in smoothed) smoothed[id] += (progress[id] - smoothed[id]) * k;
      const p = smoothed.beginning;
      const p2 = smoothed.inspiration;
      const introFade = enteredAt < 0 ? 0 : clamp01((now - enteredAt - 2600) / 1600);

      // A product sheet takes the stage: the narration steps aside.
      const active = useExperience.getState().focusedProduct ? "" : activeChapterId();
      for (const { beat, node, words } of beats) {
        if (beat.chapter !== active) {
          node.style.visibility = "hidden";
          continue;
        }
        const bp = smoothed[beat.chapter];
        const inT = beat.in[0] < 0 ? introFade : smooth(beat.in[0], beat.in[1], bp);
        const outT = smooth(beat.out[0], beat.out[1], bp);
        const visible = inT > 0.001 && outT < 0.999;
        node.style.visibility = visible ? "visible" : "hidden";
        if (!visible) continue;
        const n = words.length;
        const spread = Math.min(0.09, 0.65 / n);
        words.forEach((w, i) => {
          const wi = clamp01((inT - i * spread) / Math.max(0.0001, 1 - (n - 1) * spread));
          const o = wi * (1 - outT);
          w.style.opacity = o.toFixed(3);
          if (!reduced) {
            w.style.transform = `translate3d(0, ${((1 - wi) * 0.55 - outT * 0.35).toFixed(3)}em, 0)`;
            w.style.filter = `blur(${((1 - wi) * 10 + outT * 8).toFixed(2)}px)`;
          }
        });
      }

      if (whiteout.current) whiteout.current.style.opacity = (smooth(0.9, 0.995, p) * (1 - smooth(0.004, 0.05, p2))).toFixed(3);
      // Black curtain between the thread (02) and the atelier (03).
      if (curtain.current)
        curtain.current.style.opacity = Math.max(
          smooth(0.94, 0.995, p2) * (1 - smooth(0.004, 0.04, smoothed.creation)),
          // …and between the atelier (03) and the studio (04).
          smooth(0.95, 0.995, smoothed.creation) * (1 - smooth(0.002, 0.02, smoothed.signature)),
          // …and between the studio (04) and the showroom (05).
          smooth(0.955, 0.995, smoothed.signature) * (1 - smooth(0.002, 0.02, smoothed.collection)),
          // …and between the showroom (05) and the message (06).
          smooth(0.95, 0.995, smoothed.collection) * (1 - smooth(0.004, 0.04, smoothed.message)),
        ).toFixed(3);
      if (hint.current) hint.current.style.opacity = (introFade * (1 - smooth(0.0, 0.035, p))).toFixed(3);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const unsub = useExperience.subscribe((s) => {
      if (s.entered && enteredAt < 0) enteredAt = performance.now();
    });
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <>
      <div ref={whiteout} className="pointer-events-none fixed inset-0 z-[5] bg-paper opacity-0" />
      <div ref={curtain} className="pointer-events-none fixed inset-0 z-[5] bg-ink opacity-0" />
      <div ref={root} className="pointer-events-none fixed inset-0 z-10 select-none mix-blend-difference">
        {BEATS.map((b) => (
          <div key={b.id} data-beat={b.id} className={`absolute ${alignClass[b.align]}`} style={{ visibility: "hidden" }}>
            <div
              className={`${variantClass[b.variant]} ${
                b.variant === "display" || b.variant === "statement" ? "max-w-[22ch] sm:max-w-none" : "max-w-[36ch]"
              }`}
            >
              {b.lines.map((line, li) => (
                <span key={li} className="line block">
                  {line.split(" ").map((word, wi) => (
                    <span key={wi} className="word inline-block whitespace-pre will-change-transform" style={{ opacity: 0 }}>
                      {word}
                      {wi < line.split(" ").length - 1 ? " " : ""}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div ref={hint} className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 opacity-0">
          <span className="font-sans text-[9px] tracking-[0.45em] pl-[0.45em] text-mist/60">DÉFILER</span>
          <span className="scroll-cue block h-10 w-px bg-mist/25 overflow-hidden" />
        </div>
      </div>
    </>
  );
}
