## Objectif

Améliorer la lisibilité de la liste de résultats `CrmAnnuaire` à la manière de annuaire-entreprises.data.gouv.fr, en restant 100% frontend / présentation.

## Problèmes constatés

1. **Pas de compteur en haut de liste** — le total n'apparaît qu'en bas et seulement si `total_pages > 1`.
2. **Statut "Cessée" peu visible** — relégué dans la ligne meta sous le NAF, alors que sur data.gouv il est collé au nom.
3. **Tooltip NAF illisible** — le `title=` natif est inesthétique et, au hover, la pastille (texte sur `bg-muted` → `hover:bg-accent`) perd du contraste. Pas de signal d'interactivité clair.

## Solution — `src/components/crm/CompanySearchResultCard.tsx`

- **Badge "Cessée" inline** : déplacer à droite du nom (même ligne que `nom_complet`), variante `destructive` compacte, à côté du `CompanyStageBadge`. Retirer du bloc meta du bas.
- **Pastille NAF élégante** :
  - Remplacer `title` natif par un `Tooltip` shadcn (`<Tooltip><TooltipTrigger asChild>…<TooltipContent>Filtrer par cette activité</TooltipContent></Tooltip>`).
  - Style : `bg-primary/10 text-primary border-primary/20 hover:bg-primary/20`, focus ring, icône `Filter` (h-3 w-3) à gauche pour signaler l'action.
  - Garde le label complet `Culture de la vigne (01.21Z)` via `formatNaf`.

## Solution — `src/pages/CrmAnnuaire.tsx`

- **Compteur en tête de liste** : juste au-dessus du `space-y-2`, afficher une ligne discrète
  `{total} résultat(s) trouvé(s)` (pluralisation) + sous-texte `Page X / Y` si pagination. Visible dès qu'il y a `searchData` (y compris 0 résultat → "Aucun résultat").
- Conserve la pagination existante en bas.

## Hors-scope

- Edge function, RLS, BDD, logique de recherche : aucun changement.
- Pas de refonte des autres cartes/écrans.

## Fichiers touchés

- `src/components/crm/CompanySearchResultCard.tsx`
- `src/pages/CrmAnnuaire.tsx`
