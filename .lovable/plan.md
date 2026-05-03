## Diagnostic

Sophie D apparaît à 0 photo alors que 4 photos lui ont été réattribuées. Vérifié en base :

- `marcheur_medias` / `marcheur_audio` : aucune ligne pour Sophie (ni en upload, ni en réattribution).
- `exploration_convivialite_photos` : **4 lignes** avec `attributed_marcheur_id` = sa fiche éditoriale (uploadées par Gaspard, réattribuées à Sophie).

Deux bugs distincts dans la fiche Marcheurs :

1. **Comptage** — `useExplorationParticipants` n'agrège que `marcheur_medias`, `marcheur_audio`, `marcheur_textes`. La table `exploration_convivialite_photos` est ignorée → toutes les photos Convivialité (uploadées ou réattribuées) ne sont jamais comptées dans les badges du bandeau.

2. **Affichage du panneau déplié** — `ObservationsSubTab` ne requête que `marcheur_medias` filtré sur `user_id = userId` (uploader). Donc :
   - les photos Convivialité ne s'affichent jamais (mauvaise table) ;
   - les photos `marcheur_medias` réattribuées à Sophie (si elles existaient) seraient masquées car filtrées sur l'uploader, pas sur l'attribution.

## Correctifs

### 1. `src/hooks/useExplorationParticipants.ts`

Ajouter une 4ᵉ source dans l'agrégation (en parallèle des médias, audio, textes) :

```ts
supabase
  .from('exploration_convivialite_photos')
  .select('user_id, attributed_marcheur_id')
  .eq('exploration_id', explorationId)
  .eq('is_hidden', false)
```

Réutiliser la fonction `route(uploaderId, attributedCrewId)` déjà en place pour créditer la photo au bon user (ou crew shadow). Incrémenter `bucket.photos++`. Cela corrige automatiquement la dédoublonnage Sophie D et alimente le badge caméra.

### 2. `ObservationsSubTab` dans `src/components/community/exploration/MarcheursTab.tsx`

Refondre la requête pour fusionner trois sources, toutes filtrées sur l'auteur **effectif** (uploader OU attribution) :

- `marcheur_medias` : `user_id.eq.${userId}` **OR** `attributed_marcheur_id.in.(${crewIdsLinkedToUser})` — via `.or(...)`. Pour les crew shadow non liés à un user (cas Gaspard), n'inclure que la branche `attributed_marcheur_id`.
- `exploration_convivialite_photos` : même logique sur `exploration_id`.
- Mapper en items normalisés `{ id, url, titre, created_at, kind: 'photo'|'video' }`.

Pour résoudre proprement, étendre la signature pour passer `marcheur` (au lieu d'un simple `userId`) afin que le composant connaisse aussi `crewIdLinkedToThisUser` (résolu côté hook : exposer `crewId?: string` dans `MarcheurWithStats` quand la fiche éditoriale lui est rattachée, ou faire une mini-requête `exploration_marcheurs` côté composant).

Rendre le sous-onglet disponible aussi pour `source === 'crew'` (actuellement bloqué par `isCommunity && userId`), pour que les marcheurs purement éditoriaux (sans compte auth) puissent quand même afficher les photos qui leur ont été réattribuées.

### 3. Header badges dynamiques

Dans `MarcheurCard` (l 622), garder `photoCount = stats.photos + stats.videos` ; il devient correct grâce au correctif (1). Aucun autre changement nécessaire.

### 4. Invalidations

Ajouter `qc.invalidateQueries({ queryKey: ['marcheur-observations-photos'] })` dans `useReattributeMedia` pour rafraîchir la liste dépliée après toute réattribution.

## Résultat attendu

- Sophie D affiche `📷 4` dans son bandeau.
- En dépliant : les 4 photos Convivialité s'affichent en grille, avec date, triables.
- Les marcheurs éditoriaux (sans compte) peuvent désormais aussi recevoir et afficher des médias réattribués.
- Aucune régression : marcheurs ayant uploadé eux-mêmes continuent d'être comptés via la branche `user_id` du `route()`.
