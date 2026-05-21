# Réseau trophique — Révéler les liens manquants

## Diagnostic

Le Marronnier d'Inde est un **producteur primaire (L1)**. Dans `ReseauTab.tsx` (ligne 138-143), quand une espèce est sélectionnée, on calcule uniquement ses **proies** via `probablePreyGroups(group)`. Or `probablePreyGroups('L1')` renvoie `[]` (un végétal ne « mange » personne). Résultat : **0 arc affiché**, alors que le chatbot évoque 24 liens — qui sont en réalité les espèces **qui mangent** le marronnier (chenilles, écureuils, mésanges via les chenilles, mineuse du marronnier, etc.) + les décomposeurs de sa litière.

Le réseau actuel ne sait montrer que le sens descendant (prédateur → proie). Il devient muet sur tout L1, et sous-exploite L2/L3 (on ne voit jamais « qui me mange »).

## Proposition — Constellation bidirectionnelle « Qui me mange · Qui je mange · Qui me recycle »

Quand on sélectionne une espèce, on déploie **trois faisceaux de liens animés** autour d'elle :

```text
              ↑  MANGEURS (vers le haut, courbes ascendantes)
                 chenilles, écureuils, oiseaux insectivores...
                          ●  Marronnier (sélectionné, halo pulsant)
              ↓  PROIES   (vers le bas — vide pour un L1)
              ⟲  RECYCLEURS (arcs latéraux vers la colonne décomposeurs)
```

Chaque famille d'arc a sa propre couleur (token du niveau cible), son propre easing, et un compteur en surimpression :

```text
   ┌──────────────────────────────────┐
   │  Marronnier d'Inde               │
   │  ↑ 18 mangeurs   ↓ 0 proies      │
   │  ⟲ 6 recycleurs probables        │
   └──────────────────────────────────┘
```

### Geste « wahou »
- **Tracé séquentiel** : les arcs apparaissent en cascade (delay 30 ms) avec `pathLength` animé, comme une onde qui se propage du nœud sélectionné vers ses voisins.
- **Halo respiré** sur l'espèce sélectionnée (déjà présent pour `isHighlighted`, on l'étend à `selected`).
- **Nœuds connectés** : passent en pleine opacité avec un léger `scale: 1.15` ; les autres descendent à 0.08.
- **Légende contextuelle** apparaît en bas du SVG : *« 24 liens probables tissés autour de cette espèce »*, avec un micro-bouton pour basculer entre les trois faisceaux (Mangeurs / Proies / Recycleurs).

### Robustesse
- Logique générique : fonctionne pour n'importe quel niveau (L1 → uniquement mangeurs ; L5 → uniquement proies ; L2-L4 → les trois).
- Plafond `cap` (ex. 24 mangeurs max affichés) pour éviter la saturation visuelle ; les autres sont comptabilisés dans le badge « +N autres ».
- Si une bande cible est vide dans cette exploration, on garde l'arc « fantôme » (pointillé, opacité 0.25) vers la bande, accompagné d'un libellé *« maillon non encore observé »* — c'est inspirant car ça suggère ce qu'il reste à découvrir.

## Détails techniques

**`src/lib/trophicClassification.ts`** — ajouter un helper symétrique :
```ts
export function probablePredatorGroups(prey: TrophicGroup): TrophicGroup[] {
  switch (prey) {
    case 'L1': return ['L2'];
    case 'L2': return ['L3', 'L4', 'L5'];
    case 'L3': return ['L4', 'L5'];
    case 'L4': return ['L5'];
    default:   return [];
  }
}
```

**`src/components/community/synthese/trophic/ReseauTab.tsx`**
1. Remplacer `selectedEdges` par trois mémos : `preyEdges`, `predatorEdges`, `recyclerEdges` (chacun avec son token de couleur et un cap, ex. 24).
2. Étendre `isMuted` : un nœud n'est plus muté s'il appartient à `probablePreyGroups(selected.group) ∪ probablePredatorGroups(selected.group) ∪ ['DECOMPOSER']`.
3. Rendu en cascade : pour chaque arc, `transition={{ delay: i * 0.03, duration: 0.7 }}` sur `pathLength`.
4. Halo pulsant sur le nœud sélectionné (réutiliser le bloc `isHighlighted` existant).
5. Mini-overlay HTML absolu en bas du SVG (déjà un pattern dans le fichier) :
   *« ↑ {n} mangeurs · ↓ {m} proies · ⟲ {k} recycleurs »* + 3 chips cliquables pour filtrer un faisceau.
6. Arcs « fantômes » : si une bande cible est vide, dessiner un seul arc vers le milieu de la bande en `strokeDasharray="2 6"` opacité 0.25.

**Hors-scope** : pas de changement du panneau latéral droit (`SelectedStarPanel`), pas de modification du classifieur, pas de requête réseau supplémentaire — tout est dérivé de la `chain` déjà calculée.

## Vérification

Recharger `/marches-du-vivant/mon-espace/exploration/...`, onglet Synthèse › Réseau, cliquer sur Marronnier d'Inde :
- des arcs montent vers L2 (et au-delà si présents),
- des arcs latéraux pointillés filent vers la colonne `⟲`,
- une bande L2 vide apparaît en arc fantôme avec libellé,
- l'overlay affiche les 3 compteurs.

Tester aussi sur un L5 (rapace) : seuls les arcs descendants + recycleurs.
