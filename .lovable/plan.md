

# Fix: Photos des co-marcheurs invisibles — 2 problemes

## Diagnostic

### Probleme 1 — Les badges des onglets ne comptent que les contributions du user connecte
`useMarcheurStats` (ligne 366) filtre `.eq('user_id', userId)`. Si l'admin ou un autre marcheur consulte la page, le badge "Voir" affiche **0** meme si Laurence a uploade 12 photos. L'utilisateur pense qu'il n'y a rien a voir.

### Probleme 2 — Le compteur de stats badge masque les contributions des autres
Les 12 photos de Laurence (toutes `is_public: true`) sont bien en base, sur les marches 1, 2 et 3 de l'exploration. La requete `useMarcheurMedias` ne filtre PAS par `user_id` dans le SQL, donc les photos publiques des autres marcheurs sont bien chargees et affichees dans la section "Des marcheurs". **Mais** le badge affichant 0, le marcheur ne clique pas sur l'onglet.

## Correctif

### Fichier : `src/hooks/useMarcheurContributions.ts`

Modifier `useMarcheurStats` pour compter **toutes** les contributions publiques, pas seulement celles du user connecte. Deux compteurs : `mine` (propre au user) et `total` (toutes les publiques + les miennes privees).

```typescript
// Remplacer les 3 requetes par 6 (ou fusionner) :
// - Count propre au user (pour la section "Mes contributions")
// - Count total public (pour le badge de l'onglet)
```

Le badge de l'onglet "Voir" affichera le total (admin + mes photos + photos publiques des autres), pas uniquement les miennes.

### Fichier : `src/components/community/ExplorationMarcheurPage.tsx`

Mettre a jour `tabCounts` pour utiliser le nouveau compteur `total` au lieu du compteur `mine`.

## Ce qui ne change PAS

- Le `VoirTab` affiche deja correctement les 3 sections (admin / mes contributions / des marcheurs)
- Le RLS sur `marcheur_medias` est correct (`is_public = true` accessible aux `authenticated`)
- Aucune migration SQL necessaire

## Fichiers impactes

| Fichier | Action |
|---|---|
| `src/hooks/useMarcheurContributions.ts` | Ajouter compteur total (public + propre) dans `useMarcheurStats` |
| `src/components/community/ExplorationMarcheurPage.tsx` | Utiliser le compteur total pour les badges |

