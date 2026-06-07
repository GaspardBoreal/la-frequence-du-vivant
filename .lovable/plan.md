## Objectif
Quand un marcheur clique sur un résultat de recherche d’espèce (ex. « Catalpa du sud » → contexte « ROQUE GAGEAC / Jardin »), après l’arrivée sur **Biodiversité > Taxons observés** avec la bonne marche sélectionnée et le halo sur la carte, le **drawer/fiche espèce** doit s’ouvrir automatiquement, sans clic supplémentaire.

Aujourd’hui :
- L’URL canonique `?focus=species:<sci>&tab=biodiversite&sub=taxons&marcheId=…` amène bien sur le bon onglet.
- `FocusHalo` scrolle la vignette et pulse le halo.
- Mais l’ouverture du drawer dépend d’un clic utilisateur (`setSelectedSpecies` dans `OeilCuration.tsx`), donc le bandeau de droite reste fermé.

## Principe du correctif
Réutiliser le **bus de focus existant** (`src/lib/focusBus.ts` + `lfdv:focus`) — déjà émis par `ExplorationMarcheurPage` — pour qu’`OeilCuration` (qui détient l’état `selectedSpecies` et rend `SpeciesGalleryDetailModal`) ouvre lui-même le drawer dès qu’un focus espèce arrive et que les données nécessaires sont prêtes.

Cela conserve un contrat unique :
- Overlay de recherche = source de vérité de l’URL.
- `useFocusFromUrl` + `ExplorationMarcheurPage` = orchestrateur de tabs/sous-tabs et émetteur du focus.
- Composant cible (`OeilCuration`) = consommateur idempotent qui ouvre son drawer.

## Mise en œuvre

### 1) Émission renforcée du focus côté page
`src/components/community/ExplorationMarcheurPage.tsx`
- S’assurer (déjà partiellement en place) que `dispatchFocus({ kind: 'species', id, sub, marcheId })` est appelé **après** :
  - le set de `activeGlobalTab = 'biodiversite'`,
  - le set du sous-onglet `taxons`,
  - la sélection de la marche.
- Émettre avec un petit délai (`requestAnimationFrame` x2 ou `setTimeout(…, 80ms)`) pour que `OeilCuration` soit monté et abonné quand le bus rejoue.
- Le bus garde déjà le dernier focus pendant `RECENT_MS` (4 s), donc un consommateur qui se monte juste après recevra l’événement via `subscribeFocus` → replay microtask.

### 2) Consommation côté OeilCuration
`src/components/community/insights/curation/OeilCuration.tsx`
- Ajouter un `useEffect` qui :
  1. Souscrit à `subscribeFocus` (déjà importable depuis `@/lib/focusBus`).
  2. Filtre `detail.kind === 'species'`.
  3. Résout l’espèce dans `pool` via une **clé robuste** (priorité scientifique normalisée NFD + lower, fallback sur clé composite, fallback sur `commonName`).
  4. Construit l’objet attendu par `SpeciesGalleryDetailModal` (le même mapping que `handleSpeciesClick` : `name`, `scientificName`, `count`, `kingdom`, `photos`).
  5. Appelle `setSelectedSpecies(...)`.
- Protections contre les races :
  - Si `pool` n’est pas encore chargé (`isLoading` ou pool vide), garder le dernier focus dans une `ref` et rejouer dès que `pool` arrive (`useEffect` deps : `pool`).
  - Idempotence : ne pas réouvrir si `selectedSpecies?.scientificName` correspond déjà à l’id du focus.
  - Une seule ouverture par `(target, ts)` (clé interne du bus).
- Forcer en parallèle la vue Taxons appropriée : si le focus arrive alors que `view !== 'pool'` et que la marche/espèce existe dans `pinnedSpecies` → laisser `selection`; sinon `setView('pool')` pour garantir que la vignette ciblée est visible (et donc que le halo et le scroll fonctionnent).

### 3) UX/UI — fluidité et inspiration
- **Séquence orchestrée (≈900 ms perçus)** :
  1. T0 : navigation, tabs/sous-tabs en place.
  2. T+~200 ms : `FocusHalo` scrolle la vignette au centre + halo émeraude pulse.
  3. T+~500 ms : ouverture du drawer espèce avec son animation native (slide-in droite).
  4. Le halo termine son cycle « derrière » le drawer ouvert → ressenti d’une révélation guidée, pas d’un saut sec.
- **Respect du contexte marche** : la marche cliquée dans le résultat reste sélectionnée → le drawer affichera bien les médias/observations de cette marche, pas l’agrégé multi-marches.
- **Skip si l’utilisateur agit** : si entre T0 et T+500ms l’utilisateur ouvre déjà une autre fiche / change d’onglet, l’ouverture auto est annulée (vérification `selectedSpecies` non null OU `activeGlobalTab` n’est plus `biodiversite`).
- **Accessibilité** : le drawer existant gère déjà le focus clavier ; rien à ajouter.
- **Aucune régression sur les clics manuels** : `handleSpeciesClick` reste inchangé, le nouveau chemin auto passe par la même API d’ouverture.

### 4) Robustesse multi-cas
Le contrat s’applique uniformément à toute recherche d’espèce, quel que soit le contexte :
- Exploration multi-marches → marche ciblée pré-sélectionnée + drawer ouvert sur la fiche.
- Exploration sans marche spécifique → drawer ouvert directement, pas de marche forcée.
- Espèce hors `pool` (cas limite, ex. désactivée) → on annule proprement l’ouverture et on laisse seulement le halo s’éteindre, sans erreur.

## Fichiers concernés
- `src/components/community/insights/curation/OeilCuration.tsx` (consommation focus → ouverture drawer)
- `src/components/community/ExplorationMarcheurPage.tsx` (s’assurer du `dispatchFocus` synchronisé avec l’UI prête)
- (lecture seule) `src/lib/focusBus.ts`, `src/components/search/FocusHalo.tsx`, `src/hooks/useFocusFromUrl.ts`

## Validation
1. `/marches-du-vivant/mon-espace` → recherche `catalpa` → bloc « Catalpa du sud » → clic « ROQUE GAGEAC / Jardin » :
   - onglet Biodiversité, sous-onglet Taxons observés
   - marche sélectionnée
   - halo émeraude sur la vignette
   - **drawer espèce ouvert automatiquement**
2. Refaire sur une autre espèce multi-contextes (ex. « Buddleja de David ») pour confirmer le contrat.
3. Tester un résultat espèce sans contexte de marche → drawer s’ouvre, pas de marche forcée.
4. Tester un clic manuel sur une vignette → comportement inchangé.
5. Vérifier qu’ouvrir un résultat espèce, fermer le drawer, puis recliquer un autre contexte de la même espèce → réouvre bien le drawer (pas d’état figé).
