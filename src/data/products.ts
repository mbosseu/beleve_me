/**
 * Product catalogue. Scenes 04/05 read from here: adding a piece = one entry
 * here (+ its visuals in public/textures/). The 3D showroom lays out as many
 * displays as there are products.
 *
 * Rule: a product is only ever shown with the brand's own visuals. Pieces
 * without references stay "coming-soon" and are never illustrated.
 */

export type ProductCategory = "doudoune" | "veste-zippee" | "ensemble" | "longsleeve" | "a-venir";
export type ProductStatus = "available" | "coming-soon";

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductView {
  id: string;
  label: string;
  src: string;
  /** cutout = render on white, background removed; plate = shown as is. */
  kind: "cutout" | "plate";
  /** width / height of the source image */
  aspect: number;
  /** Trim slivers of neighbouring views (contact sheets). */
  clipX?: number;
}

export interface Product {
  slug: string;
  name: string;
  category: ProductCategory;
  status: ProductStatus;
  /** Euros. null = not announced yet. */
  price: number | null;
  description: string;
  colors: ProductColor[];
  sizes: string[];
  details: string[];
  views: ProductView[];
  /** Real 3D model (GLB), when one exists. */
  model?: { high: string; low: string };
}

const V = "/textures/piece/";

export const products: Product[] = [
  {
    slug: "veste-zippee-capuche",
    name: "Veste zippée à capuche",
    category: "veste-zippee",
    status: "coming-soon",
    price: null,
    description: "La prochaine pièce de la collection.",
    colors: [],
    sizes: [],
    details: [],
    views: [],
  },
  {
    slug: "ensemble-veste-jogging",
    name: "Ensemble veste & jogging",
    category: "ensemble",
    status: "coming-soon",
    price: null,
    description: "La prochaine pièce de la collection.",
    colors: [],
    sizes: [],
    details: [],
    views: [],
  },
  {
    slug: "doudoune-signature",
    name: "Doudoune Signature",
    category: "doudoune",
    status: "available",
    // Aligned on the market reference (TOROM doudoune Signature: 210 €, Nov. 2026),
    // + double embroidery and engraved metal zip. Proposal — to confirm.
    price: 220,
    description:
      "Coupe ample et structurée, cinq boudins, capuche volumineuse. Le monogramme BM brodé sur la poitrine, l'illustration botanique BELIEVE ME brodée dans le dos.",
    colors: [{ id: "noir", name: "Noir", hex: "#090909" }],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"], // à confirmer par la marque
    details: [
      "Monogramme BM brodé ton beige",
      "Broderie botanique dos, BELIEVE ME · BM",
      "Zip métal argent, tirette gravée BM",
      "Bord-côte élastiqué à la taille et aux poignets",
    ],
    views: [
      { id: "front", label: "Face", src: V + "front.jpg", kind: "cutout", aspect: 600 / 700 },
      { id: "side", label: "Profil", src: V + "side.jpg", kind: "cutout", aspect: 290 / 700, clipX: 9 },
      { id: "back", label: "Dos", src: V + "back.jpg", kind: "cutout", aspect: 1312 / 1199 },
      { id: "embroidery", label: "Broderie", src: "/textures/embroidery-back.jpg", kind: "plate", aspect: 890 / 1030 },
      { id: "zip", label: "Zip", src: V + "detail-zip.jpg", kind: "plate", aspect: 356 / 264 },
      { id: "monogram", label: "Monogramme", src: V + "detail-monogram.jpg", kind: "plate", aspect: 350 / 264 },
      { id: "cuff", label: "Poignet", src: V + "detail-cuff.jpg", kind: "plate", aspect: 360 / 264 },
      { id: "worn", label: "Porté", src: V + "worn-front.jpg", kind: "plate", aspect: 660 / 1328 },
      { id: "worn-back", label: "Porté dos", src: V + "worn-back.jpg", kind: "plate", aspect: 700 / 1348 },
    ],
  },
  {
    slug: "longsleeve",
    name: "Longsleeve",
    category: "longsleeve",
    status: "coming-soon",
    price: null,
    description: "La prochaine pièce de la collection.",
    colors: [],
    sizes: [],
    details: [],
    views: [],
  },
  {
    slug: "pieces-futures",
    name: "Pièces futures",
    category: "a-venir",
    status: "coming-soon",
    price: null,
    description: "L'histoire continue. De nouvelles pièces rejoindront la collection.",
    colors: [],
    sizes: [],
    details: [],
    views: [],
  },
];

export const productBySlug = (slug: string | null) => products.find((p) => p.slug === slug) ?? null;
