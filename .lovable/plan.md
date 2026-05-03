## Objectif

Dans la vue **Mon Espace > Exploration > Marcheurs > Marcheurs** :

1. Compter et afficher les **audios** d'un marcheur (badge dans l'en-tête + onglet d'écoute).
2. Ajouter un onglet **Écoute** entre `Observations` et `Contributions`, avec le **même lecteur** que `Marches > Écouter` (image 3).
3. **Factoriser** le code : un composant unique partagé entre les deux vues, pour que toute évolution (upload, tri, lecture, suppression, ré-attribution) bénéficie aux deux.

## Diagnostic

- `useExplorationParticipants` calcule déjà `stats.sons` à partir de `marcheur_audio` (ligne ~142–164) en respectant `attributed_marcheur_id`. Donc le **comptage backend existe**, il n'est juste pas affiché dans la card et il n'y a pas d'onglet pour les écouter.
- `MarcheDetailModal.tsx` contient `EcouterTab` (lignes 504–639) : section admin (`marche_audio`) + Mes sons + Sons des autres + zone d'upload. C'est ce composant qu'on va extraire.
- `MarcheursTab.tsx` n'a actuellement que 3 sous-onglets : `observations | contributions | impact`.

## Plan technique

### 1. Extraire un composant partagé `MarcheurAudioPanel`

Nouveau fichier : `src/components/community/audio/MarcheurAudioPanel.tsx`

- Props :
  ```ts
  {
    ownerUserId: string | null;     // user dont on affiche les sons
    ownerCrewId?: string | null;    // pour la ré-attribution éditoriale
    marcheIds: string[];            // 1+ marches (admin audio)
    marcheEventIds: string[];       // 1+ events (sons marcheurs)
    canUpload: boolean;             // owner ou admin
    activeMarcheId?: string;        // pour rattacher l'upload
    variant?: 'modal' | 'inline';   // pour ajuster les paddings
  }
  ```
- Logique :
  - **Admin audios** : `marche_audio` filtré par `marche_id IN marcheIds`, trié par `ordre`.
  - **Sons du marcheur** : `marcheur_audio` filtré par `marche_event_id IN marcheEventIds` ET `(user_id = ownerUserId OR attributed_marcheur_id = ownerCrewId)` ET `is_public = true` côté visiteur (côté owner : tout).
  - Tri (Récent/Ancien) via le `SortToggle` existant.
  - Upload : réutilise `useUploadAudio` (déjà invalide la query key `['marcheur-audio', marcheEventId]`). Si `canUpload === false`, on masque le bouton "Ajouter un son".
  - Édition / suppression : réutilise `useUpdateContribution` / `useDeleteContribution` quand `isOwner`.
- Sortie HTML identique à l'actuel `EcouterTab` (sections "De l'exploration" / "Mes sons" / "Des marcheurs" + `<audio controls>`).

### 2. Brancher la factorisation côté Marches

- Dans `MarcheDetailModal.tsx`, remplacer `EcouterTab` par un wrapper qui appelle `<MarcheurAudioPanel marcheIds={[marcheId]} marcheEventIds={[marcheEventId]} ownerUserId={userId} canUpload={true} variant="modal" activeMarcheId={activeMarcheId} />`.
- Aucune régression visuelle attendue (le composant garde les mêmes classes).

### 3. Brancher dans `MarcheursTab.tsx`

- Étendre `MarcheurSubTab` :
  ```ts
  type MarcheurSubTab = 'observations' | 'ecoute' | 'contributions' | 'impact';
  ```
- Ajouter dans `subTabConfig` (entre `observations` et `contributions`) :
  ```ts
  { key: 'ecoute', label: 'Écoute', icon: Headphones }
  ```
  (`Headphones` à importer de `lucide-react`).
- Rendu conditionnel :
  ```tsx
  {activeSubTab === 'ecoute' && (
    <MarcheurAudioPanel
      ownerUserId={resolvedUserId}
      ownerCrewId={resolvedCrewId}
      marcheIds={explorationMarcheIds}
      marcheEventIds={explorationEventIds}
      canUpload={!!user && user.id === resolvedUserId}
      variant="inline"
    />
  )}
  ```

### 4. Badge audio dans l'en-tête de la card

- Dans `MarcheurCard`, après le badge "photoCount", ajouter (si `marcheur.stats.sons > 0`) :
  ```tsx
  <div className="... bg-muted/60 ..." title={`${marcheur.stats.sons} son${...}`}>
    <Headphones className="w-3 h-3 text-violet-500" />
    <span className="text-[11px] font-semibold">{marcheur.stats.sons}</span>
  </div>
  ```
- `hasContent` doit aussi prendre en compte `stats.sons > 0` pour que la card s'ouvre quand il n'y a que des audios.

### 5. Compteur global "X observations publiques"

- Le bandeau supérieur affiche `69 observations publiques` (somme des `totalContributions`). `stats.sons` est déjà inclus dans `total = photos + videos + sons + textes`, donc rien à changer ici — les audios étaient comptés mais pas révélés ; ils le seront via le badge + onglet.

## Fichiers touchés

- **Nouveau** : `src/components/community/audio/MarcheurAudioPanel.tsx` (factorisation).
- **Modifié** : `src/components/community/MarcheDetailModal.tsx` (réécrit `EcouterTab` comme thin wrapper).
- **Modifié** : `src/components/community/exploration/MarcheursTab.tsx` (sous-onglet Écoute + badge audio).
- Aucune migration DB.

## Risques / vérifications

- Filtre RLS sur `marcheur_audio` : un visiteur ne doit voir que les audios `is_public=true` ou les siens. Le composant respecte déjà cette règle dans le filtre.
- Re-attribution : `marcheur_audio.attributed_marcheur_id` doit exister (il est utilisé par `useExplorationParticipants`). À vérifier dans les types ; sinon, fallback sur `user_id` uniquement.
- Upload : seul l'utilisateur connecté propriétaire de la card peut uploader (les admins n'uploadent pas pour autrui ici, comme dans la vue Marches).
