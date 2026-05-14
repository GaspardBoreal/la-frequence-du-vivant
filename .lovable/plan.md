## Objectif

Sur l'onglet **Marcheurs**, faire apparaître les contributeurs citoyens iNaturalist (présents dans `biodiversity_snapshots` mais non rattachés à un marcheur LMDV) — sans diluer la mise en avant des marcheurs officiels.

Cas test : exploration `5a384afb-…` → 3 contributeurs iNat détectés (Estella Bignon · 19 espèces, Dorian Beliarde · 1, marcduvilla · 1).

## Principe retenu

- Les marcheurs LMDV (Gaspard Boréal, Vincent Levavasseur) restent visuellement dominants en haut de liste, inchangés.
- En dessous de la liste, **une seule ligne d'agrégat** repliée par défaut :
  > « +3 contributeurs citoyens iNaturalist · 21 observations »
- Au clic, dépliage en mini-vignettes minimalistes (avatar iNat, nom, nb d'espèces, lien discret).
- Enrichissement des marcheurs LMDV existants : si leur profil iNat est connu (via `community_profile_science_accounts` ou par alias matching → première URL d'observation), un petit lien `↗ iNaturalist` est ajouté discrètement dans leur en-tête.

## UX détaillée

### Ligne d'agrégat (collapsée)
```
🌿 +3 contributeurs citoyens iNaturalist · 21 observations    ▾
```
- Style : carte sobre `bg-muted/30` + bord `emerald-500/15`, hauteur 44px, sous la dernière vignette marcheur.
- Hover : très léger glow emerald.

### Vignettes iNat (dépliées)
Chaque ligne, hauteur ~56px :
```
[avatar iNat] Estella Bignon  @estellabignon         19 espèces · 112 obs   ↗
```
- Avatar = `icon_url` retourné par l'edge function `resolve-inaturalist-user` (cache 1h, déjà existante).
- Handle `@login` en gris fin si résolu.
- Compteurs : nb d'espèces uniques + nb total d'attributions.
- Bouton/Lien `↗` : ouvre `https://www.inaturalist.org/people/{login}` (ou `firstUrl` en fallback) dans un nouvel onglet, `rel="noopener noreferrer"`.
- Pas de score Sentinelle, pas de sous-onglets, pas de drag-and-drop.

### Enrichissement vignettes LMDV
- Sur l'en-tête de chaque carte marcheur, si on récupère un `inat_login` (via `science_accounts` ou résolution par alias), ajouter discrètement à droite du nom :
  ```
  ↗ iNaturalist
  ```
  texte 10px, `text-muted-foreground hover:text-emerald-500`, lien vers `/people/{login}`.
- Aucune modification si pas de profil iNat connu.

## Implémentation technique

Tout en frontend, **aucun changement DB**, aucun nouveau hook lourd.

### 1. Nouveau hook `useExplorationCitizenContributors(explorationId, knownAliases)`
Dans `src/hooks/useExplorationCitizenContributors.ts` :
- Query `biodiversity_snapshots.species_data` pour les marches de l'exploration (déjà fait dans `useExplorationParticipants`, on peut factoriser ou laisser une 2e query React-Query ; staleTime 5 min).
- Agrège `attributions[]` par `(observerName, source)` :
  - `species_count` (set des `scientificName`)
  - `obs_count`
  - `firstUrl` (1re `originalUrl`)
- Filtre out tout `observerName` dont `normalizeAlias(...)` est déjà dans `knownAliases` (= alias de tous les marcheurs LMDV de l'event, fournis par `useMarcheursAliasesMap`).
- Retourne uniquement la source `inaturalist` (les autres sources ne sont pas demandées ici).
- Trié par `species_count desc`.

### 2. Nouveau composant `CitizenContributorsAggregateRow`
Dans `src/components/community/exploration/CitizenContributorsAggregateRow.tsx` :
- Props : `contributors: CitizenContributor[]`.
- État local `expanded: boolean` (default false).
- Rendu collapsé : ligne d'agrégat (count + total observations).
- Rendu déplié : `AnimatePresence` (height/opacity) → liste de `CitizenContributorRow`.
- Si `contributors.length === 0` → ne rien rendre.

### 3. Nouveau composant `CitizenContributorRow`
- Props : `{ observerName, login?, iconUrl?, speciesCount, obsCount, profileUrl }`.
- Lance lazy `useQuery(['inat-profile', firstUrl])` via `supabase.functions.invoke('resolve-inaturalist-user')` — réutilise la query existante (même `queryKey` shape que `CitizenPlatformsCard`) → cache partagé.
- `target="_blank" rel="noopener noreferrer"` sur le lien.
- Avatar fallback : initiales si `iconUrl` absent.

### 4. Intégration dans `MarcheursTab.tsx`
- Calculer `knownAliases: Set<string>` à partir de `aliasesByMarcheurId` (déjà chargé).
- Appeler `useExplorationCitizenContributors(explorationId, knownAliases)`.
- Insérer `<CitizenContributorsAggregateRow contributors={...} />` après le dernier `MarcheurCard` de la liste (juste avant le bouton « Inviter »).

### 5. Mini-enrichissement vignettes LMDV
- Dans le rendu de l'en-tête d'une carte marcheur : récupérer `aliasesByMarcheurId[m.id]` et lancer `resolve-inaturalist-user` avec la 1re URL iNat trouvée parmi les obs « inat » de ce marcheur (déjà disponibles via `m.speciesObserved.find(s => s.origin === 'inat')`).
- Si on obtient un `login`, afficher `↗ iNaturalist` (icône Lucide `ExternalLink` + texte 10px) à côté du nom.
- Sinon : ne rien afficher.

## Hors-scope

- Pas de modif DB ni d'edge function.
- Pas de score Sentinelle pour les contributeurs iNat (seraient injustes vs marcheurs LMDV).
- Pas d'invitation automatique (« devenez marcheur LMDV ») — peut être ajoutée dans un 2e temps.
- Les sources eBird/GBIF ne sont pas surfacées dans cet agrégat (aucune donnée pour cet event).

## Fichiers touchés

- **Créés** : `src/hooks/useExplorationCitizenContributors.ts`, `src/components/community/exploration/CitizenContributorsAggregateRow.tsx`
- **Modifiés** : `src/components/community/exploration/MarcheursTab.tsx` (insertion + lien iNat dans en-tête vignette LMDV)
