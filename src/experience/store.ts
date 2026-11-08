import { create } from "zustand";
import type { Capabilities } from "@/lib/capabilities";

export interface CartItem {
  slug: string;
  color: string;
  size: string;
  qty: number;
}

interface ExperienceState {
  caps: Capabilities | null;
  /** The visitor has passed the intro screen. */
  entered: boolean;
  soundOn: boolean;
  activeChapter: string;
  /** Collection: product opened in the showroom, and the view shown. */
  focusedProduct: string | null;
  focusedView: string;
  cart: CartItem[];
  cartOpen: boolean;
  setCaps: (caps: Capabilities) => void;
  enter: (withSound: boolean) => void;
  setSound: (on: boolean) => void;
  setActiveChapter: (id: string) => void;
  focus: (slug: string | null) => void;
  setView: (view: string) => void;
  addToCart: (item: Omit<CartItem, "qty">) => void;
  removeFromCart: (index: number) => void;
  setCartOpen: (open: boolean) => void;
}

const CART_KEY = "bm-cart";

function loadCart(): CartItem[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(CART_KEY) : null;
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable: cart lives for this visit only */
  }
}

export const useExperience = create<ExperienceState>((set, get) => ({
  caps: null,
  entered: false,
  soundOn: false,
  activeChapter: "beginning",
  focusedProduct: null,
  focusedView: "front",
  cart: [],
  cartOpen: false,
  setCaps: (caps) => set({ caps, cart: loadCart() }),
  enter: (withSound) => set({ entered: true, soundOn: withSound }),
  setSound: (soundOn) => set({ soundOn }),
  setActiveChapter: (activeChapter) => set({ activeChapter }),
  focus: (slug) => set({ focusedProduct: slug, focusedView: "front" }),
  setView: (focusedView) => set({ focusedView }),
  addToCart: (item) => {
    const cart = [...get().cart];
    const same = cart.find((c) => c.slug === item.slug && c.size === item.size && c.color === item.color);
    if (same) same.qty += 1;
    else cart.push({ ...item, qty: 1 });
    saveCart(cart);
    set({ cart });
  },
  removeFromCart: (index) => {
    const cart = get().cart.filter((_, i) => i !== index);
    saveCart(cart);
    set({ cart });
  },
  setCartOpen: (cartOpen) => set({ cartOpen }),
}));
