# BELIEVE ME — Immersive 3D fashion experience

*Believe in yourself, even when nobody else does.*

Site immersif en six chapitres : The Beginning, The Inspiration, The Creation, The Signature Piece, The Collection, The Message.

**Stack :** Next.js 15 (App Router), TypeScript, React Three Fiber / Three.js, Drei, GSAP + ScrollTrigger, Lenis, Tailwind CSS 4, Zustand.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

## Structure

- `src/scenes/0X-*` — une scène 3D par chapitre (modifiable indépendamment)
- `src/experience/chapters.ts` — registre des chapitres
- `src/data/products.ts` — catalogue (ajouter une pièce = une entrée)
- `src/ui/` — narration, navigation, fiche produit, panier
- `docs/DIRECTION.md` — direction artistique, décisions, assets

## État

- Paiement en ligne : non branché (panier local uniquement).
- Les produits sont montrés exclusivement avec les visuels de la marque.
