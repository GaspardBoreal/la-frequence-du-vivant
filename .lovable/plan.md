## Constat

L'onglet **Marcheurs → Marcheurs → Contributions** affiche aujourd'hui par défaut les vignettes iNaturalist parce qu'il a son propre rendu bento (`ContributionsSubTab` dans `MarcheursTab.tsx`), totalement indépendant de l'écosystème factorisé `SpeciesPhotoModeContext` + `SpeciesExplorer` utilisé partout ailleurs (Vivant, L'Œil, Synthèse).

Conséquence visible sur la capture d'écran : pour Laurence Karki (aucune photo perso uploadée), on ne voit que des miniatures iNat, sans la moindre possibilité de basculer vers les photos terrain d'autres marcheurs qui auraient pu photographier les mêmes espèces.

## Stratégie : réutiliser `<SpeciesExplorer/>` filtré

Le contexte `SpeciesPhotoModeProvider` est déjà installé au niveau racine de `ExplorationMarcheurPage` → le toggle sera automatiquement **synchronisé** avec les trois autres vues, et bénéficiera de :

- défaut intelligent (`marcheur` si photos terrain existent, sinon `inaturalist`)
- `getPreferredPhoto()` qui choisit la bonne photo par espèce
- toggle UI `<SpeciesPhotoModeToggle/>` avec compteurs
- filtres règnes, recherche, tags, classification trophique, modal espèce, lightbox
- cohérence visuelle 100 % avec Vivant / L'Œil / Synthèse

## Plan d'implémentation

### 1. Nouveau hook `useMarcheurAttributedSpecies`

Fichier : `src/hooks/useMarcheurAttributedSpecies.ts`

Rôle : retourner la liste des espèces **attribuées au marcheur courant** dans le format `BiodiversitySpecies[]` attendu par `<SpeciesExplorer/>`.

Sources fusionnées (logique existante extraite de `ContributionsSubTab`) :

1. `marcheur_observations` filtrées par `marcheur_id = crewId` ET `marche_id ∈ explorationMarcheIds`
2. Attributions iNat issues de `biodiversity_snapshots.species_data[].attributions[]` dont `normalizeAlias(observerName) ∈ aliases` du marcheur

Le hook expose aussi :

- `ownUploadedSciNames: Set<string>` — espèces pour lesquelles **CE marcheur** a uploadé au moins une photo perso (URL Supabase storage). Permet de garder le filtre « Mes photos ».

Photos par espèce : on ne stocke dans `BiodiversitySpecies.photoData.url` que la photo iNat de référence (fallback). C'est `SpeciesPhotoModeContext` (alimenté par `useExplorationFieldPhotos`) qui injecte la photo terrain au rendu via `getPreferredPhoto()` — donc aucune logique photo dupliquée ici.

### 2. Refonte de `ContributionsSubTab`

Remplacer tout le rendu bento par :

```tsx
<div className="px-3 pt-3 pb-3 space-y-3">
  {/* Bandeau spécifique marcheur */}
  <div className="flex items-center justify-between gap-2 flex-wrap">
    <p className="text-xs text-muted-foreground">
      <Leaf /> {species.length} espèce{s} identifiée{s}
      {ownCount > 0 && <span> · {ownCount} avec photo perso</span>}
    </p>
    {ownCount > 0 && (
      <button onClick={() => setOnlyOwn(!onlyOwn)} ...>
        <Camera /> Mes photos ({ownCount})
      </button>
    )}
  </div>

  <SpeciesExplorer
    species={onlyOwn ? speciesWithMyUpload : species}
    compact
    explorationId={explorationId}
  />
</div>
```

Comportements obtenus gratuitement via `SpeciesExplorer` :

- Header de l'explorer contient déjà `<SpeciesPhotoModeToggle counts={...}/>` → bascule globale visible ici
- Par défaut le mode passe à `marcheur` dès qu'il y a au moins une photo terrain dans l'exploration
- Filtres règne, source, audio, contributeur, recherche, tags : tous opérationnels
- Modal espèce, carrousel photos, navigation : identiques aux autres vues

### 3. Code mort à retirer dans `MarcheursTab.tsx`

- `ContribSpeciesItem`, `isOwnPhotoUrl`, l'énorme `useQuery` de `byKey`, `renderTile`, sections « Vos N captures personnelles » / « N repérées dans le périmètre », `ownSpanFor`, lightbox local

→ remplacé par le hook + 30 lignes de JSX.

### 4. Ce qui ne change pas

- Page hôte `ExplorationMarcheurPage` : déjà sous `SpeciesPhotoModeProvider`, rien à toucher.
- Les trois vues existantes (Vivant / L'Œil / Synthèse) : aucune modification.
- Le filtre « Mes photos » reste spécifique à l'onglet du marcheur (conformément à la réponse choisie).

## Détails techniques

```text
ExplorationMarcheurPage
└─ SpeciesPhotoModeProvider (explorationId)  ← déjà en place
   └─ MarcheursTab
      └─ ContributionsSubTab  ← refonte
         ├─ useMarcheurAttributedSpecies(marcheur, exploration)
         │     → BiodiversitySpecies[] + ownUploadedSciNames
         ├─ Filtre « Mes photos » (local)
         └─ <SpeciesExplorer species=… compact explorationId=… />
               └─ <SpeciesPhotoModeToggle/> en header (global)
```

Mémoire à mettre à jour : `mem://features/community/species-photo-mode-toggle-logic` pour ajouter la 4ᵉ vue factorisée.

## Validation

1. Ouvrir un marcheur sans photo perso (Laurence Karki) → onglet Contributions doit afficher les photos terrain des autres marcheurs par défaut (si présentes), sinon iNat ; le toggle global doit être visible et fonctionnel.
2. Ouvrir un marcheur avec ses propres photos (Gaspard) → le toggle « Mes photos » filtre correctement.
3. Basculer le toggle global depuis l'onglet Vivant → la bascule est reflétée immédiatement dans Contributions (même provider).
4. Vérifier que les filtres règne, recherche, modal espèce fonctionnent dans Contributions exactement comme dans Vivant.
