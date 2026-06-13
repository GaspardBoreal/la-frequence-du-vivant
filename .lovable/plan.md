## Diagnostic (ce qui bugge sur la capture)

1. **Titre tronqué** : `truncate` sur `<h2>` coupe "COOPERATIVE DES SAUNIER…" alors que le panneau est large de 440 px — aucune raison de tronquer.
2. **Bouton "Supprimer" masqué** par le FAB du chatbot (rond vert en bas-droite). Le footer sticky du panneau et le FAB se chevauchent.
3. **Contenu coupé en bas** ("46.38P)" tronqué) : le `overflow-y-auto` du body fonctionne, mais l'ombre + le footer mangent visuellement la dernière ligne, et le scrollbar est invisible (pas de padding bas).
4. **La carte est inutilisable quand le panneau est ouvert** : le `grid-cols-[1fr_440px]` rétrécit la carte à ~560 px et le pin sélectionné reste à gauche (le `panBy` se fait avant que la carte n'ait rétréci → décalage faux).
5. **Pills de stage** débordent sur étroit et le `layoutId="stage-pill"` est partagé entre 2 instances (sheet mobile + inline) → animation qui saute si les deux montent.
6. **Pas de séparation visuelle** entre carte et panneau (pas d'ombre franche, pas de "poignée"), donc on a l'impression que le panneau "mange" la carte.

## Correctif élégant — "Floating Glass Panel"

Au lieu d'un split-grid qui rétrécit la carte, on passe à un **panneau flottant en overlay** sur la carte (desktop) + bottom-sheet plein écran (mobile). La carte reste pleine largeur, le panneau "lévite" au-dessus avec glassmorphism et ombre douce.

### 1. `src/pages/CrmAnnuaire.tsx` — onglet Carte

- Supprimer le `grid-cols-[1fr_440px]` qui rétrécit la carte.
- Conteneur `relative` autour de `<CrmCompaniesMap>` ; carte plein largeur (`70vh`, `100%`).
- Panneau desktop (`hidden lg:flex`) en **`absolute right-4 top-4 bottom-4 w-[420px] z-[450]`** (au-dessus des tuiles Leaflet z-index 400 mais sous les overlays Radix z-50 du body), avec `<AnimatePresence>` + slide-in depuis la droite (Framer Motion `initial={{ x: 32, opacity: 0 }}`).
- Le `flyOffsetX` de la carte passe à **`-210`** (moitié du panneau) seulement quand le panneau est ouvert, et **après** un `requestAnimationFrame` pour laisser Leaflet recalculer.
- Mobile : on garde la `Sheet bottom` 85vh, mais avec `lg:hidden`.
- `<CompanyDetailSheet>` global déjà filtré (`tab === 'carte' ? null : drawerId`) — OK.

### 2. `src/components/crm/CompanyDetailContent.tsx` — fixes visuels

- **Titre** : retirer `truncate`, mettre `line-clamp-2 leading-snug` (2 lignes max, pas de coupure brutale).
- **Header** : `pr-12` pour libérer la zone du bouton fermer ; bouton close `z-10`.
- **Stage pills** : `flex-wrap gap-1 p-1`, garantir wrap propre si <380 px ; `layoutId` rendu unique via prop `panelId` (ex. `stage-pill-${mode}-${companyId}`) pour éviter le conflit Framer Motion entre instances.
- **Body** : `pb-6` pour respirer avant le footer ; scrollbar fine custom (`scrollbar-thin` Tailwind plugin déjà présent sinon `[&::-webkit-scrollbar]:w-1.5`).
- **Footer sticky** :
  - `sticky bottom-0` (déjà), mais ajouter **`pr-20`** sur desktop pour ne jamais passer sous le FAB chatbot (qui fait ~56px + marge).
  - En mode `inline`, le footer reste dans le panneau (pas global) → pas de conflit FAB tant que le panneau a `right-4` + on garde un `pr-2` simple. Le vrai conflit FAB n'arrive qu'en mode `mobile-sheet` plein écran → ajouter `pb-[env(safe-area-inset-bottom)] mb-2` et augmenter `right` du FAB seulement quand panneau ouvert n'est pas faisable globalement → solution simple : **ajouter une marge bas `pb-4` + `pr-16` au footer en mode `mobile-sheet`**.
- Header hero : réduire padding (`px-4 pt-4 pb-3`) pour gagner de la place ; avatar 12×12 (au lieu de 14) → plus compact, le titre tient.

### 3. `CrmCompaniesMap.tsx`

- Le `FlyToSelected` actuel fait `panBy` 720 ms après le `flyTo`. Problème : si la carte a été redimensionnée (cas grid), `flyTo` se base sur l'ancienne taille → pin off-screen. Avec le passage en overlay, la carte ne change plus de taille → on enlève simplement l'attente et on combine en un seul `flyTo` avec destination déjà décalée :
  ```ts
  const targetLatLng = map.containerPointToLatLng(
    map.latLngToContainerPoint([lat, lng]).add([offsetX, 0])
  );
  map.flyTo(targetLatLng, targetZoom, { duration: 0.7 });
  ```
- Pas d'autre changement.

### 4. Détails de polish

- Ombre du panneau : `shadow-2xl ring-1 ring-border/60`.
- Coin du panneau : `rounded-2xl` (déjà).
- Backdrop : `bg-card/85 backdrop-blur-xl` pour vraiment laisser deviner la carte derrière.
- Bouton fermer : `ChevronsRight` → meilleure affordance "replier le tiroir".

### Hors scope

- Pas de clustering Leaflet.
- Pas de refonte des autres onglets.
- Pas de modification du chatbot/FAB.

### Résultat visuel attendu

- Carte plein largeur, jamais rétrécie.
- Panneau flottant à droite, ombre douce, titre complet sur 2 lignes max.
- Bouton "Supprimer" visible, jamais sous le FAB.
- Pin sélectionné correctement décalé vers la gauche pour rester visible.
- Mobile : bottom-sheet 85vh, padding bas pour éviter le FAB.
