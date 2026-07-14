## Diagnostic

**PB 1 · Brand Kit invisible sur Boutinet**
La scénographie custom de cet event est un composant TSX qui applique ses propres fonds (bordeaux plein écran via `<div class="bg-…">` et styles inline) DANS le body de l'iframe. Mon override CSS !important cible `html/body/#root` — les `<div>` de la scéno passent au-dessus. Résultat : seule la pastille (rendue dans le document parent) change, la scéno reste identique.

**Direction validée : A — forcer la palette diurne sage/ambre.** Cela signifie renoncer à la scéno bordeaux nuit sur ce cas précis.

**PB 2 · Images vides Hero + Hero Strate 1 sur fiche Jardin (`/jardin/:slug`)**
Le carousel `KenBurnsCarousel` reçoit `heroPhotos` = union de :
- convivialité (via `exploration_id`)
- `marche_photos` des `exploration_marches`
- `marcheur_medias` de l'event.

Si l'event Jardin n'a pas d'`exploration_id` valide ET pas de `marcheur_medias`, `heroPhotos = []` → carousel tombe sur `fallback = event.cover_image_url`. Si `cover_image_url` est null → placeholder gradient emerald (image manquante perçue).

Manque probable : `marche_events.cover_image_url` non renseigné + aucune contribution marcheur. Le hook ne va JAMAIS chercher les photos directement liées à l'event via `marche_id = event.id` sans passer par `exploration_marches`.

## Fix 1 · Boutinet — bypass scénographie sous Brand Kit

**Approche pragmatique :** quand `brand_kit_enabled = true` sur un event, la page publique court-circuite la scénographie et rend la fiche classique `PublicEventPageInner`, qui utilise le design system Lovable (`hsl(var(--…))`) — parfaitement repeinte par les tokens `--bk-*` déjà en place.

**Étapes :**
1. `PublicEventPage.tsx` — la condition d'affichage scéno devient :
   ```ts
   if (sceno && sceno.scenography_code && !scenoBypassed && !brandKitInner)
   ```
   → si un Brand Kit est actif, on saute la scéno.
2. Vérifier que `PublicEventPageInner` (fiche classique) rend bien avec la palette sauge (via variables `--bk-*` déjà injectées par `BrandKitProvider`). Ajouter au besoin quelques mappings dans `src/styles/brand-kit.css` pour que les composants `bg-background` / `text-foreground` de la page classique héritent des tokens Boutinet (via un sélecteur `[data-brand-kit] { --background: var(--bk-bg); --foreground: var(--bk-fg); --card: var(--bk-surface); --primary: var(--bk-accent); }`).
3. Toujours afficher `<BrandSignatureBadge />` en haut à gauche + `<BrandFooterSignature />` en bas. La scéno bordeaux reste accessible via un bouton discret "Voir en mode nuit" (opt-in), non prioritaire.

Résultat visuel Boutinet immédiat : fond sauge, titres Cormorant, corps Montserrat, CTAs orange blob, certifs Bio/Best of Wine Tourism, footer partenaire.

## Fix 2 · Images Hero Jardin — élargir les sources

Dans `useGardenFiche.ts` / `useGardenStepPhotos` :

1. **Requête directe `marche_photos` par `marche_id = event.id`** (pas seulement via `exploration_marches`) — beaucoup d'events autonomes n'ont pas de mapping exploration.
2. **Ajouter `event.cover_image_url` en tête de `heroPhotos`** (au lieu de fallback seul) → au moins 1 image visible même si aucune contribution.
3. **Fallback iNat** : si toujours vide, tirer 3–5 photos des `biodiversity_snapshots` de l'event (colonne `photo_url` ou équivalent iconique) — les fiches jardin ont toujours au moins des observations iNat.
4. Passer `heroPhotoList` complet (pas `.slice(0,3)`) au 2ᵉ carousel "Strate 1" ligne 278, pour éviter le cas où `slice(0,3)` renvoie une liste vide alors que la source en a d'autres. Ou mieux : `heroPhotoList.slice(0,3).length ? heroPhotoList.slice(0,3) : heroPhotoList`.

Pas de migration SQL nécessaire — RLS `marche_photos` autorise déjà anon read pour events publics (à vérifier vite fait). Si non, ajouter policy anon read scopée `marche_events.is_public = true`.

## Fichiers touchés

- `src/pages/PublicEventPage.tsx` — condition scéno bypass si brand kit.
- `src/styles/brand-kit.css` — mapping vars Lovable → vars Brand Kit pour repeindre la fiche classique.
- `src/hooks/useGardenFiche.ts` — élargir sources hero + fallback cover.
- (Optionnel) 1 policy RLS si `marche_photos` bloquée anon.

## Vérif après build

- `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26` → fiche classique sauge/ambre, plus la scéno bordeaux.
- `/jardin/<slug-jardin-en-echec>` → Hero et Strate 1 remplis (au minimum cover event).

URL Jardin exacte à me communiquer si le fix ne suffit pas (je pourrais avoir besoin de déboguer l'event précis).
