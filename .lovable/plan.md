## Diagnostic

Sur la vue Découverte > Enfant > Tri Vivant, deux barres se superposent verticalement :

```text
[DiscoverHeader absolu z-20 h-14]  ← 🏠  DÉCOUVERTE / 52 espèces … Enfant Immersif 2100 … ✕
[KidsMode]                          ← ← Choisir un autre jeu           (collé sous, masqué à gauche par « 52 espèces »)
[KingdomSortGame header]            Score : 8/8                        Règle   Rejouer
[Consigne]                          Glisse une carte vers sa maison…
```

Le bouton retour est isolé sur sa propre ligne, décalé du couple Règle/Rejouer, et le Score flotte seul au lieu d'accompagner la consigne. La cause est structurelle : le retour vit dans `KidsMode.tsx`, les actions vivent dans chaque jeu (`KingdomSortGame.tsx`, etc.).

## Cible visuelle

```text
[DiscoverHeader z-20]              🏠  DÉCOUVERTE / 52 espèces …  Enfant Immersif 2100  ✕
[Sous-barre jeu, sticky pt-16]     ← Choisir un autre jeu                    ⛑ Règle  ↻ Rejouer
[Bandeau consigne]                 Score : 8/8   ·   Glisse une carte vers sa maison…
[Corps du jeu]                     ▢ ▢ ▢ ▢
```

Une seule ligne d'actions, alignée verticalement, retour à gauche, actions du jeu à droite. Le Score fusionne avec la consigne en un ruban unique, éditorial et lisible.

## Plan d'implémentation

### 1. Nouveau contexte de « toolbar de jeu »
Fichier `src/components/biodiversity/discover/modes/games/GameToolbarContext.tsx` (nouveau) :
- `GameToolbarProvider` expose `setActions(node: ReactNode)` + `actions` state.
- Hook `useGameToolbar(actions)` : useEffect qui set/reset les actions au mount/unmount.

Permet à chaque jeu de « pousser » ses boutons dans la barre commune sans que `KidsMode` connaisse leur nature.

### 2. `KidsMode.tsx`
- Wrapper `GameToolbarProvider` autour de la branche `game !== 'menu'`.
- Remplace le bloc back button actuel par une **sous-barre sticky** :
  - `sticky top-14 z-10` (pour rester sous le DiscoverHeader h-14),
  - fond `bg-[#FAF6EC]/85 backdrop-blur-sm`, border-b discrète,
  - `flex items-center justify-between`, hauteur `h-12`,
  - gauche : `← Choisir un autre jeu` (style pastille amber existant),
  - droite : `<GameToolbarSlot />` (consomme le contexte).
- Ajoute un `pt-2` sous la barre pour aérer le corps du jeu.

### 3. Refonte des headers de chaque jeu
Pour les 4 jeux (`KingdomSortGame`, `MemoryGame`, `WhoAmIGame`, `ZoomDetailGame`) :
- Supprimer l'ancien `<div className="flex items-center justify-between mb-3">` qui contient Score + Règle + Rejouer.
- Appeler `useGameToolbar(<><RegleBtn/><RejouerBtn/></>)` pour injecter Règle/Rejouer dans la sous-barre commune.
- Fusionner le Score dans le **bandeau consigne** existant :
  ```tsx
  <div className="mb-3 px-3 py-2 rounded-xl bg-white/70 border border-[#3B2A1A]/10 flex items-center justify-center gap-3 flex-wrap">
    <span className="text-[#3B2A1A]/80" style={{ fontFamily: 'Caveat, cursive', fontSize: 20 }}>
      Score&nbsp;: <strong>{score}</strong> / {total}
    </span>
    <span className="text-[#3B2A1A]/30">·</span>
    <span style={{ fontFamily: '"Patrick Hand", cursive' }}>{consigne}</span>
  </div>
  ```
- Séparateur `·` pour l'élégance manuscrite.

### 4. Petit détail responsive
- Sur mobile (< sm) : le Score passe au-dessus de la consigne (flex-col), la sous-barre reste horizontale (retour + actions).

## Fichiers touchés
- **nouveau** `src/components/biodiversity/discover/modes/games/GameToolbarContext.tsx`
- `src/components/biodiversity/discover/modes/KidsMode.tsx`
- `src/components/biodiversity/discover/modes/games/KingdomSortGame.tsx`
- `src/components/biodiversity/discover/modes/games/MemoryGame.tsx`
- `src/components/biodiversity/discover/modes/games/WhoAmIGame.tsx`
- `src/components/biodiversity/discover/modes/games/ZoomDetailGame.tsx`

Aucun changement de logique métier, uniquement composition et présentation.