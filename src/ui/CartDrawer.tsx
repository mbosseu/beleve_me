"use client";

import { useEffect } from "react";
import { lockScroll } from "@/animation/scroll";
import { productBySlug } from "@/data/products";
import { useExperience } from "@/experience/store";

/** Cart kept in the visitor's browser. Online payment is not open yet. */
export default function CartDrawer() {
  const open = useExperience((s) => s.cartOpen);
  const cart = useExperience((s) => s.cart);
  const setOpen = useExperience((s) => s.setCartOpen);
  const remove = useExperience((s) => s.removeFromCart);
  const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
  const total = cart.reduce((sum, c) => sum + (productBySlug(c.slug)?.price ?? 0) * c.qty, 0);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      // keep the scroll locked if a product sheet is still open
      if (!useExperience.getState().focusedProduct) lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <aside
      data-ui
      aria-hidden={!open}
      aria-label="Panier"
      className={`fixed inset-y-0 right-0 z-[45] flex w-full max-w-[420px] flex-col bg-paper text-ink transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-8 py-7">
        <h2 className="font-sans text-[11px] tracking-[0.4em]">PANIER</h2>
        <button onClick={() => setOpen(false)} className="font-sans text-[10px] tracking-[0.3em] text-graphite/70 hover:text-ink">
          FERMER ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {cart.length === 0 && <p className="font-serif text-lg italic text-graphite/60">Votre panier est vide.</p>}
        <ul className="space-y-5">
          {cart.map((item, i) => {
            const p = productBySlug(item.slug);
            const color = p?.colors.find((c) => c.id === item.color)?.name ?? item.color;
            return (
              <li key={i} className="flex items-start justify-between border-b border-ink/10 pb-5">
                <div>
                  <p className="font-serif text-xl">{p?.name ?? item.slug}</p>
                  <p className="mt-1 font-sans text-[10px] tracking-[0.25em] text-graphite/60">
                    {color.toUpperCase()} · TAILLE {item.size} · ×{item.qty}
                  </p>
                  {p?.price != null && <p className="mt-1 font-sans text-[11px] tracking-[0.15em]">{eur(p.price * item.qty)}</p>}
                </div>
                <button onClick={() => remove(i)} className="font-sans text-[10px] tracking-[0.2em] text-graphite/60 hover:text-ink">
                  RETIRER
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-t border-ink/10 px-8 py-7">
        {cart.length > 0 && (
          <p className="mb-5 flex justify-between font-sans text-[11px] tracking-[0.3em]">
            <span>TOTAL</span>
            <span>{eur(total)}</span>
          </p>
        )}
        <button disabled className="w-full cursor-not-allowed bg-ink/80 py-4 font-sans text-[11px] tracking-[0.4em] text-paper/70">
          COMMANDER
        </button>
        <p className="mt-3 text-center font-sans text-[10px] tracking-[0.2em] text-graphite/60">
          LE PAIEMENT EN LIGNE OUVRIRA PROCHAINEMENT.
        </p>
      </div>
    </aside>
  );
}
