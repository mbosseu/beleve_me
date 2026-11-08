"use client";

import { useEffect, useState } from "react";
import { lockScroll } from "@/animation/scroll";
import { productBySlug, products } from "@/data/products";
import { useExperience } from "@/experience/store";

/** Product sheet opened from the showroom: views, colour, size, add to cart. */
export default function ProductSheet() {
  const slug = useExperience((s) => s.focusedProduct);
  const view = useExperience((s) => s.focusedView);
  const focus = useExperience((s) => s.focus);
  const setView = useExperience((s) => s.setView);
  const addToCart = useExperience((s) => s.addToCart);
  const setCartOpen = useExperience((s) => s.setCartOpen);
  const product = productBySlug(slug);

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setColor(product?.colors[0]?.id ?? null);
    setSize(null);
    setNotice(null);
  }, [product]);

  useEffect(() => {
    if (!slug) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && focus(null);
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, focus]);

  const open = !!product;
  const index = product ? products.indexOf(product) + 1 : 0;
  const available = product?.status === "available";

  const add = () => {
    if (!product || !color) return;
    if (!size) {
      setNotice("Choisissez une taille.");
      return;
    }
    addToCart({ slug: product.slug, color, size });
    setNotice("Ajoutée au panier.");
  };

  return (
    <aside
      data-ui
      aria-hidden={!open}
      aria-label={product ? `Fiche produit — ${product.name}` : undefined}
      className={`fixed z-[28] bg-ink/95 text-paper transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
        inset-x-0 bottom-0 max-h-[55vh] overflow-y-auto border-t border-paper/10 px-6 pb-8 pt-6
        md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:w-[min(440px,40vw)] md:border-t-0 md:border-l md:px-10 md:pt-24
        ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}`}
    >
      {product && (
        <div className="flex flex-col gap-7">
          <div className="flex items-start justify-between">
            <p className="font-sans text-[10px] tracking-[0.38em] text-mist/60">
              {String(index).padStart(2, "0")} — {available ? "DISPONIBLE" : "BIENTÔT"}
            </p>
            <button
              onClick={() => focus(null)}
              className="font-sans text-[10px] tracking-[0.3em] text-mist/70 hover:text-paper"
            >
              FERMER ✕
            </button>
          </div>

          <div>
            <h2 className="font-serif text-[clamp(2rem,3.4vw,3rem)] font-light leading-none">{product.name}</h2>
            <p className="mt-3 font-sans text-[11px] tracking-[0.25em] text-embroidery">
              {product.price != null
                ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(product.price)
                : "PRIX COMMUNIQUÉ PROCHAINEMENT"}
            </p>
          </div>

          <p className="font-serif text-lg leading-snug text-mist/85">{product.description}</p>

          {available && (
            <>
              <section>
                <h3 className="mb-3 font-sans text-[9px] tracking-[0.35em] text-mist/50">VUES</h3>
                <div className="flex flex-wrap gap-2">
                  {product.views.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setView(v.id)}
                      className={`border px-3 py-1.5 font-sans text-[10px] tracking-[0.2em] transition-colors ${
                        view === v.id ? "border-embroidery text-paper" : "border-paper/15 text-mist/70 hover:border-paper/40"
                      }`}
                    >
                      {v.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-sans text-[9px] tracking-[0.35em] text-mist/50">
                  COULEUR — {product.colors.find((c) => c.id === color)?.name.toUpperCase()}
                </h3>
                <div className="flex gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      aria-label={c.name}
                      onClick={() => setColor(c.id)}
                      className={`h-7 w-7 rounded-full border ${color === c.id ? "border-embroidery" : "border-paper/25"}`}
                      style={{ background: c.hex, outline: color === c.id ? "1px solid #d8c9a9" : "none", outlineOffset: 3 }}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-sans text-[9px] tracking-[0.35em] text-mist/50">TAILLE</h3>
                <div className="grid grid-cols-6 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSize(s);
                        setNotice(null);
                      }}
                      className={`border py-2 font-sans text-[11px] tracking-[0.1em] transition-colors ${
                        size === s ? "border-paper bg-paper text-ink" : "border-paper/15 text-mist hover:border-paper/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              <div>
                <button
                  onClick={add}
                  className="w-full bg-paper py-4 font-sans text-[11px] tracking-[0.4em] text-ink transition-colors hover:bg-embroidery"
                >
                  AJOUTER AU PANIER
                </button>
                {notice && (
                  <p className="mt-3 flex items-center justify-between font-sans text-[10px] tracking-[0.2em] text-embroidery">
                    {notice.toUpperCase()}
                    {notice.startsWith("Ajout") && (
                      <button onClick={() => setCartOpen(true)} className="underline underline-offset-4">
                        VOIR LE PANIER
                      </button>
                    )}
                  </p>
                )}
              </div>

              <section>
                <h3 className="mb-3 font-sans text-[9px] tracking-[0.35em] text-mist/50">DÉTAILS</h3>
                <ul className="space-y-2 font-serif text-base text-mist/80">
                  {product.details.map((d) => (
                    <li key={d}>— {d}</li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {!available && (
            <p className="border-t border-paper/10 pt-6 font-sans text-[10px] tracking-[0.3em] text-mist/60">
              CETTE PIÈCE EST EN COURS DE CRÉATION.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
