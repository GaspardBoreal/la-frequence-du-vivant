## Diagnostic

Une photo réattribuée doit être créditée à **une seule personne** : l'attribué·e si `attributed_marcheur_id` est renseigné, sinon l'uploader. Aujourd'hui Gaspard voit ses 4 photos même réattribuées car la règle d'exclusivité n'est appliquée nulle part.

Deux endroits à corriger :

### 1. `useExplorationParticipants.ts` (comptage des badges)

La fonction `route()` est correcte côté attribution (elle redirige vers la fiche/user attribué) mais **ne désactive pas l'uploader d'origine**. Or `route()` retourne déjà `userId` ou `crewId` selon priorité — donc la fix est juste de vérifier que la branche `attributedCrewId` ignore complètement l'uploader. À la lecture du code, c'est déjà le cas (le `else` n'est pas pris si `attributedCrewId`). **Bug réel ailleurs** : regardons l'agrégation côté Gaspard. Gaspard est `crew` (Sentinelle, fiche éditoriale). Les 4 photos qu'il a uploadées ont `user_id = gaspard_uid` + `attributed_marcheur_id = sophie_crew_id`. La fonction `route(gaspard_uid, sophie_crew_id)` retourne donc `{userId: sophie_user, crewId: null}` — correct. Donc le badge de Gaspard ne devrait PAS les compter.

Mais Gaspard affiche `49` photos. Très probablement, il a aussi de **vraies** photos non réattribuées dans `marcheur_medias`. Le badge est donc juste pour `marcheur_medias`. **À vérifier** : si Gaspard est aussi listé dans `crewIdByUserId` et que ses 4 photos Convivialité sont uploadées par lui sans être réattribuées… non, elles SONT réattribuées. Donc le comptage hook est OK.

→ Aucun changement nécessaire dans `useExplorationParticipants.ts`. Le badge `49` de Gaspard est légitime (autres photos).

### 2. `ObservationsSubTab` dans `MarcheursTab.tsx` (vrai bug)

La requête utilise `.or(user_id.eq.gaspard, attributed_marcheur_id.eq.gaspard_crew)`. Le second filtre matche ses propres uploads, mais le premier matche **toutes** ses photos uploadées — y compris celles réattribuées à Sophie. Aucun filtrage post-requête.

**Correctif** : appliquer une règle d'exclusivité côté client après la requête :

```ts
const belongsToMe = (row) => {
  if (row.attributed_marcheur_id) return crewId && row.attributed_marcheur_id === crewId;
  return userId && row.user_id === userId;
};
```

Et filtrer les résultats des deux requêtes (`marcheur_medias` et `exploration_convivialite_photos`) avec ce prédicat. Ajouter `user_id, attributed_marcheur_id` au SELECT pour disposer des champs.

### 3. Vérification du compteur d'en-tête

Confirmer que pour Gaspard, `stats.photos` n'inclut pas les 4 photos réattribuées à Sophie. La fonction `route()` du hook l'écarte déjà via la branche `attributedCrewId`. Aucun changement.

## Résultat attendu

- **Gaspard** : son bandeau déplié n'affiche plus les 4 photos réattribuées à Sophie.
- **Sophie** : continue d'afficher les 4 photos.
- **Comportement par défaut** : un upload non réattribué reste visible chez l'uploader.

## Fichier modifié

- `src/components/community/exploration/MarcheursTab.tsx` — `ObservationsSubTab` : ajout du prédicat `belongsToMe` appliqué sur les résultats des deux requêtes, et inclusion de `user_id, attributed_marcheur_id` dans les SELECT.
