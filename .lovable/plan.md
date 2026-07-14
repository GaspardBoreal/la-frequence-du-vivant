## Diagnostic

Le Brand Kit fonctionne **partiellement** : la pastille signature "Boutinet · Villegouge · Fronsadais · Gironde" en haut à gauche est bien injectée par notre wrapper — c'est la seule chose que vous voyez de nouveau. Mais **tout le reste de la page** (fond bordeaux, titres crème, CTA rouge, sceau doré) provient d'une **scénographie custom TSX** stockée en base pour cet événement (mémoire *per-event-scenography-system*), et cette scénographie est exécutée dans une **iframe sandboxée** (`ScenographyRuntime`).

Or les variables CSS `--bk-*`, les Google Fonts (Allura/Cormorant/Montserrat) et les classes `bk-*` sont injectées dans le **document parent** → elles ne franchissent jamais la frontière de l'iframe. Résultat : la scénographie continue de rendre ses propres couleurs/fontes en total isolement.

D'où l'impression "aucun changement".

## Correction — 2 axes

### Axe 1 · Faire pénétrer le Brand Kit dans l'iframe scénographie *(fix immédiat, générique, réutilisable pour tous les futurs partenaires)*

1. **`useEventBrandKit`** exposé aussi dans `MarcheEventDetail.tsx` (page qui monte `ScenographyRuntime`), et passé au runtime via une nouvelle prop `brand?: BrandKit | null`.
2. **`ScenographyRuntime`** transmet ce `brand` à `buildScenographyHtml(...)`.
3. **`scenographyRuntimeHtml.ts`** — quand un `brand` est fourni :
   - injecte le `<link>` Google Fonts du kit dans le `<head>` de l'iframe ;
   - injecte un `<style>` qui :
     - déclare `:root { --bk-bg, --bk-fg, --bk-accent, --bk-accent-fg, --bk-surface, --bk-grad-a, --bk-grad-b, --bk-font-logotype, --bk-font-display, --bk-font-body }` ;
     - repeint `html, body` avec `background: hsl(var(--bk-bg))`, `color: hsl(var(--bk-fg))`, `font-family: var(--bk-font-body)` ;
     - applique `var(--bk-font-display)` aux `h1, h2, h3, .font-serif, .font-display` ;
     - ajoute une classe utilitaire `.bk-accent { color: hsl(var(--bk-accent)) }` et `.bk-cta` (même définition que le CSS parent).
   - expose `window.Scenography.brand = { palette, fonts, tagline, partner, socials }` pour que les scénographies existantes ou futures puissent l'utiliser explicitement.
4. **Signature + footer** restent rendus dans le document parent (position: fixed) au-dessus de l'iframe — déjà OK, il faudra juste s'assurer qu'ils apparaissent aussi sur `MarcheEventDetail` (là où l'iframe vit) et pas uniquement `PublicEventPage`.

Impact visuel immédiat sur Boutinet : fond sauge tendre, titres en Cormorant Garamond, corps en Montserrat, logotype scripté Allura, accent orange chaud sur les liens/CTA. Sans toucher le code de la scénographie.

### Axe 2 · Scénographie Château Boutinet dédiée *(disruption créative, optionnelle, phase 2)*

Créer une scénographie TSX signature "vignoble vivant" en s'inspirant des codes chateauboutinet.fr :
- Fond sauge tendre `#D4E5C4`, texture papier vergé.
- Hero : logotype scripté *Boutinet* énorme + rondelle orange organique (CTA blob) qui pulse doucement.
- Bandeau ambre→or (composant `BrandDivider`) en séparateur entre les 7 actes.
- Grille de certifications (Bio, Best of Wine Tourism…) via `BrandBadges`.
- Micro-animations "grappe de raisin" au scroll, palette photos sépia-vert.

À stocker en base via l'admin Scénographie (onglet existant), preset copiable pour d'autres domaines viticoles.

## Fichiers touchés (Axe 1 uniquement, à valider)

- `src/components/scenography/ScenographyRuntime.tsx` — nouvelle prop `brand`, passée à `buildScenographyHtml`.
- `src/components/scenography/scenographyRuntimeHtml.ts` — injection conditionnelle fonts + style + `window.Scenography.brand`.
- `src/pages/MarcheEventDetail.tsx` — appel `useEventBrandKit(slug)` + wrap dans `BrandKitProvider` + `<BrandSignatureBadge />` + `<BrandFooterSignature />` + passage de `brand` au runtime.
- (`src/pages/PublicEventPage.tsx` déjà OK ; la même approche s'y appliquera si un jour cette page monte aussi le runtime.)

Aucune migration SQL. Aucun changement de policy. Rétro-compatible : sans `brand_kit_enabled`, `brand === null` → runtime inchangé.

## Étapes après validation

1. Implémenter Axe 1 (≈ 4 fichiers, ~60 lignes).
2. Vérifier visuellement `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26` via Playwright (screenshot avant/après).
3. Vous demander si vous voulez enchaîner sur l'Axe 2 (scénographie dédiée Boutinet).
