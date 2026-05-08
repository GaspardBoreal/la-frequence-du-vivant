## Objectif

Afficher discrètement un compteur à côté de chaque sous-onglet d'un marcheur déplié, uniquement quand la valeur > 0. Les onglets sans donnée n'affichent rien (ni 0, ni parenthèses vides). « Votre impact » n'affiche jamais de compteur (c'est une vue analytique, pas un volume).

## Mapping des compteurs

| Sous-onglet      | Source (déjà calculée) | Affichage |
|------------------|-------------------------|-----------|
| Observations     | `photoCount` (photos + vidéos) | si > 0 |
| Écoute           | `audioCount`           | si > 0 |
| Textes           | `textesCount`          | si > 0 |
| Témoignage       | `hasTestimony ? 1 : 0` | si présent (l'onglet n'apparaît déjà que dans ce cas) |
| Contributions    | `realContribCount`     | si > 0 |
| Votre impact     | — | jamais |

Toutes ces valeurs existent déjà dans `MarcheurCard` (lignes 1055-1062). Aucune nouvelle requête, aucun appel back-end supplémentaire.

## Design UX/UI (sobre et robuste)

- Le compteur prend la forme d'une **petite pastille discrète** placée juste après le label du pill, et non d'un texte « (15) » en clair — plus moderne, lisible sur mobile, conforme aux patterns iOS/Material.
- Format :
  - **Inactif** : `bg-muted/70 text-muted-foreground` (fond neutre, chiffre estompé)
  - **Actif** : `bg-emerald-500/15 text-emerald-700 dark:text-emerald-300` (suit la couleur du pill actif)
- Taille : `text-[10px] font-semibold`, `min-w-[18px] h-[18px] px-1.5`, `rounded-full`, `tabular-nums` (alignement chiffres).
- Espacement : `ml-0.5` après le label, transition couleur 150ms.
- Pas de virgule ni de parenthèses, juste le nombre. Aria-label complet sur le bouton (« Observations, 15 éléments ») pour l'accessibilité.
- Sur mobile (le pill row est scrollable horizontalement si débordement) : la pastille reste compacte donc n'augmente pas significativement la largeur d'un onglet.

## Implémentation technique

Un seul fichier touché : `src/components/community/exploration/MarcheursTab.tsx`.

1. Construire dans `MarcheurCard` une `Map<MarcheurSubTab, number>` :
```ts
const subTabCounts: Partial<Record<MarcheurSubTab, number>> = {
  observations: photoCount,
  ecoute: audioCount,
  textes: textesCount,
  temoignage: hasTestimony ? 1 : 0,
  contributions: realContribCount,
};
```
2. Dans le rendu du pill (lignes 1156-1173), ajouter conditionnellement :
```tsx
{(subTabCounts[tab.key] ?? 0) > 0 && (
  <span className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold tabular-nums transition-colors ${
    isActive
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : 'bg-muted/70 text-muted-foreground'
  }`}>
    {subTabCounts[tab.key]}
  </span>
)}
```
3. Ajouter `aria-label={\`${tab.label}${count ? `, ${count} élément${count > 1 ? 's' : ''}` : ''}\`}` sur le `<button>`.

## Notes de robustesse

- Aucune logique nouvelle de comptage : on réutilise les sources existantes, déjà sécurisées (RLS sur les médias, RPC pour contributions).
- Le count `temoignage` est toujours 1 quand l'onglet est visible — on peut donc choisir de **ne pas afficher** la pastille pour cet onglet (1 témoignage = pas d'info utile). À confirmer par défaut → **proposition retenue : ne pas afficher de compteur sur Témoignage** (la présence de l'onglet est déjà l'indicateur).
- Pas d'impact sur le filtrage des onglets visibles ni sur les sources de données.
