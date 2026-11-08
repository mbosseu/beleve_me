# BELIEVE ME — Note de direction & architecture

> Statut : **Phase 1 — Scène 01 « The Beginning » en validation.**
> Les scènes 02 → 06 ne seront développées qu'après validation de la direction artistique de la scène 01.

---

## 1. Analyse des références fournies

| Fichier | Contenu | Ce qu'on en retient |
|---|---|---|
| `240caae2…png` | **Illustration originale** sur papier : bouquet d'immortelles (capitules étoilés, feuilles lancéolées ondulées) + **bouton floral fermé** sur une longue tige, avec une grande feuille en lame. Wordmark `BELIEVE ME` (serif capitale à large approche) + monogramme manuscrit `BM` entre deux filets. | Symbole de référence. **Utilisé tel quel** comme dessin sur la feuille de la scène 01 (aucune réinterprétation). |
| `aa1f0027…png` | Planche de recherche : mêmes éléments botaniques au crayon, essais typographiques (script + serif), traits de construction. | Utilisée comme seconde feuille sur la table (scène 01) et pour l'atelier (scène 03). |
| `35f91925…png` | Doudoune noire : face / profil / dos + 4 détails (monogramme, zip, broderie dos, poignet). | **Référence principale du modèle 3D** : 5 rangées de matelassage horizontales, capuche volumineuse matelassée, zip métal argent à double curseur, tirette gravée BM, poches passepoilées obliques, bord-côte élastiqué taille et poignets. |
| `ebd02fd3…png` / `f7dc0779…png` | Dos et face en haute définition. | Placement exact de la broderie dos (entre 2ᵉ et 4ᵉ boudin), proportions. |
| `31fea86a…png` / `245c257b…png` | Doudoune **portée par le fondateur**. | Tombé réel : longueur à la hanche, épaules tombantes, volume des manches. Sur le porté, la poitrine porte **uniquement** le monogramme `BM`. |
| `0a4a4dcd…png` | Planche « Doudoune signature » en **brun**, gris, noir : toile, capuche doublée sherpa, étiquette tissée au poignet. | Pièce différente (veste toile doublée). À clarifier — voir §2. |
| `Screenshot…143958.png` | Texte : « Celui qu'on sous-estime… SOUS-ESTIMÉS. JAMAIS ÉGALÉS. » | Ton éditorial fort. À confirmer comme texte de la marque. |
| Captures WhatsApp | Conseils (Blender + R3F + GSAP, commencer par une seule scène). | Méthode adoptée. |

**Non fournis :** captures TOROM (seul le lien est mentionné), fichiers vectoriels du logo / de l'illustration.

## 2. Points à valider (incohérences entre références)

1. **Deux illustrations botaniques différentes.**
   - Logo / illustration originale : immortelles + **bouton fermé**.
   - Doudoune produite (porté + rendus) : bouquet de marguerites / chrysanthèmes + **fleur de lotus ouverte** + bouton.
   Le brief interdit de « transformer en lotus » — or la broderie réellement produite contient un lotus.
   → *Proposition :* scènes 01-02 = illustration originale ; doudoune 3D = broderie **telle que produite** (fidélité au produit réel). À confirmer.
2. **Poitrine :** `BM` seul (porté, `35f91925`) ou `BM` + petit bouquet (`f7dc0779`) ? → *Proposition :* `BM` seul, comme sur le porté.
3. **Coloris brun / gris** (`0a4a4dcd`) hors palette : collection future ou abandonné ?
4. **Vectoriels :** pour la broderie en relief (normal map) et l'animation « le trait devient 3D » de la scène 02, il faut le fichier source (AI/SVG/PSD) ou une vectorisation manuelle fidèle.

### Décisions retenues (8 nov. 2026)

- Scènes 01-02 : **illustration originale** (immortelles + bouton fermé), utilisée sans réinterprétation.
- Doudoune 3D : broderie dos **telle que produite** (bouquet + lotus, comme sur le porté).
- Poitrine : monogramme **`BM` seul**.
- Coloris brun / gris : en attente (non utilisés).
- Scène 02 : faute de vectoriels, les traits sont **échantillonnés pixel par pixel** depuis l'illustration originale (≈ 70 000 points d'encre) — fidélité garantie, aucune forme redessinée.
- Les textes de symbolique de la scène 02 sont des **propositions** à valider par la marque.

### Prix (proposition alignée sur le marché, nov. 2026)

| Pièce | Référence marché (TOROM) | BELIEVE ME |
|---|---|---|
| Doudoune | 210 € | **220 €** (double broderie, zip métal gravé) |
| Veste | 90 € | à fixer à la sortie |
| Jogging | 85 € | à fixer à la sortie |
| Longsleeve | 70 € | à fixer à la sortie |

## 3. Architecture de l'expérience

Un seul long défilement. Un canvas WebGL fixe en arrière-plan, des sections HTML invisibles qui donnent la longueur de chaque chapitre. Chaque chapitre expose une **progression 0 → 1** (GSAP ScrollTrigger) que sa scène 3D et sa narration lisent à chaque frame, sans re-rendu React.

```
src/
  app/                    Next.js App Router (layout, page, styles)
  experience/
    chapters.ts           Registre des chapitres (ordre, durée de scroll, statut, scène lazy)
    Experience.tsx        Canvas R3F, qualité adaptative, chargement progressif des scènes
    progress.ts           Progression partagée (mutable, lue dans useFrame)
  scenes/
    01-beginning/         Table, feuille, crayon, bobine, faisceau, poussière, trajectoire caméra
    (02 → 06 à venir)
  animation/              Lenis + ScrollTrigger, utilitaires d'easing
  ui/                     Intro, narration typographique, navigation chapitres, grain, son
  audio/                  Ambiance générée (WebAudio, aucun fichier)
  data/products.ts        Modèle de données produits (extensible sans toucher aux scènes)
  lib/                    Détection des capacités (qualité, mouvement réduit, WebGL)
public/textures/          Textures optimisées (desktop / mobile)
public/models/            GLB (à venir)
```

Ajouter un chapitre = ajouter une entrée dans `chapters.ts` + un dossier `scenes/0X-…`.
Ajouter un produit = ajouter une entrée dans `data/products.ts` (+ son GLB).

## 4. Scènes & transitions

| # | Scène | Caméra | Transition sortante |
|---|---|---|---|
| 01 | **The Beginning** — table sombre, une lampe s'allume, feuille du dessin original | Plongée large → orbite latérale → approche rasante → arrêt sur le bouton floral | La caméra plonge dans le papier → fondu blanc papier |
| 02 | **The Inspiration** — les traits quittent le papier et deviennent des lignes 3D (tubes/rubans extrudés depuis le SVG) | Traversée du dessin, la fleur se reconstruit en volume autour de la caméra | Les traits se resserrent en fils de broderie |
| 03 | **The Creation** — atelier : table de coupe, croquis, échantillons, bobines, prototypes | Travelling latéral le long de la table, arrêts sur chaque étape | Le tissu se déploie et enveloppe le cadre |
| 04 | **The Signature Piece** — studio, doudoune PBR | Face → profil → dos → macro broderie → zip → texture → finitions ; rotation libre 360° | Recul, le studio s'ouvre |
| 05 | **The Collection** — showroom, pièces sélectionnables | Recul / sélection → approche + fiche produit (taille, couleur) | Les lumières s'éteignent une à une |
| 06 | **The Message** — noir, typographie, accès boutique | Recul lent | — |

## 5. Assets 3D — ce qui existe vraiment

| Asset | Méthode | Statut |
|---|---|---|
| Table, pieds, sol | Procédural Three.js + texture bois générée | ✅ fait |
| Feuille de papier | Plan subdivisé déformé + illustration originale (map + bump) | ✅ fait |
| Planche de recherche | Idem, texture `aa1f0027` | ✅ fait |
| Crayon, bobine de fil, aiguille | Procédural Three.js | ✅ fait |
| Faisceau lumineux, poussière | Shaders | ✅ fait |
| Lignes botaniques 3D (scène 02) | Points d'encre échantillonnés depuis l'illustration originale | ✅ fait |
| Atelier (scène 03) : table de coupe, lampes, tableau, rouleau de tissu, panneau matelassé 5 boudins, tambour de broderie, zip, pressions, bobines | Procédural Three.js | ✅ fait |
| **Doudoune** | **Blender** (ou Marvelous Designer) : patronage, simulation des boudins, retopo ~25k tris, bake normal/AO, broderie en normal + alpha décal, export **GLB Draco + KTX2** avec 2 LOD | ⏳ à modéliser — aucun modèle n'existe aujourd'hui |
| Veste zippée, ensembles, longsleeves | Même pipeline | ⏳ attend les références produits |

## 6. Performance & accessibilité

- Qualité adaptative : DPR, taille des ombres, densité de particules selon l'appareil (desktop / mobile / faible puissance).
- Trajectoire caméra **spécifique au mobile** (cadrage portrait), pas une version réduite du desktop.
- Textures mobiles dédiées, scènes chargées en lazy, rendu suspendu quand la scène est hors champ.
- `prefers-reduced-motion` : défilement natif, pas de scintillement ni de poussière animée, transitions adoucies.
- Pas de WebGL : repli statique avec l'illustration et la narration.
