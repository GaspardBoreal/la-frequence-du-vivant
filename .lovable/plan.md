## Cause racine

Le champ `marcheur_observations.photo_url` n'est **pas** rempli par les uploads du marcheur. Il est rempli par l'edge function `backfill-marcheur-inaturalist` (ligne 154) à partir de l'API iNaturalist :

```ts
photo_url: obs?.photos?.[0]?.url?.replace('square', 'medium') || null
```

→ La photo "perso" affichée par la mosaïque actuelle est en réalité **la miniature iNaturalist hébergée chez iNat** (`static.inaturalist.org` ou `inaturalist-open-data.s3.amazonaws.com`). Le bento les marque `hasOwnPhoto = true` simplement parce que `photo_url` est non-null, d'où le badge emerald "Marcheur" trompeur sur une image iNat.

Les **vraies** photos uploadées par le marcheur vivent dans :
- `marcheur_medias.url_fichier` (uploads Mon Espace > Observations) — stockage Supabase
- éventuellement `marcheur_medias.external_url`

Ces médias n'ont aucun lien direct vers une espèce. Cependant, l'edge de collecte/curation injecte parfois leurs URLs dans `biodiversity_snapshots.species_data[].photos[]` (cf. `SpeciesGalleryDetailModal.tsx` ligne 164 : *"Photos locales storage (médias marcheurs sans entrée marcheur_observations)"*) — on peut donc les détecter par leur host.

## Correctif

### 1. Distinguer une photo "perso" par son host

Ajouter un helper local :

```ts
const isOwnPhotoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  // Supabase storage = vraie photo perso uploadée
  if (u.includes('.supabase.co/storage/') || u.includes('.supabase.in/storage/')) return true;
  // Tout host iNaturalist = miniature iNat backfillée, PAS perso
  if (u.includes('inaturalist.org') || u.includes('inaturalist-open-data')) return false;
  // Par défaut on considère non-perso pour rester sobre
  return false;
};
```

### 2. Reclasser dans la query `marcheur-contributions-bento`

Pour chaque ligne `marcheur_observations` :
- Si `isOwnPhotoUrl(photo_url)` → toujours `hasOwnPhoto = true`, `ownPhotos.push(photo_url)`, `primaryPhoto = photo_url`, `source = 'marcheur'`.
- Sinon (URL iNat ou null) → on enregistre l'espèce mais on **n'incrémente pas** `ownPhotos`, on laisse `hasOwnPhoto = false` et `primaryPhoto = null` à ce stade. La photo iNat sera ré-affectée correctement à `primaryPhoto` plus tard dans le bloc d'enrichissement iNat (qui pose `source = 'inaturalist'`).

### 3. Récupérer en plus les photos `marcheur_medias` (storage)

Nouvelle sous-requête (en parallèle de la requête actuelle) :

```ts
supabase
  .from('marcheur_medias')
  .select('url_fichier, external_url, marche_event_id')
  .eq('is_public', true)
  .eq('type_media', 'photo')
  .or(`user_id.eq.${userId},attributed_marcheur_id.eq.${crewId}`)
  .in('marche_event_id', explorationEventIds)
```

Construire un `Set<string>` des URLs de stockage du marcheur (`ownMediaUrls`).

Puis, dans le bloc d'enrichissement iNat (snapshots), pour chaque `sp.photos[]` :
- Si l'URL est dans `ownMediaUrls` → c'est une photo perso liée à cette espèce. Promouvoir l'entrée : `hasOwnPhoto = true`, `primaryPhoto = url`, `source = 'marcheur'`, `ownPhotos.push(url)`.

Ainsi on capte les uploads marcheur même quand seul le snapshot fait le lien espèce↔photo.

### 4. Aucune modification du badge/UI

Le composant `renderTile` reste tel quel : il s'appuie sur `variant === 'own'` (déduit de `hasOwnPhoto`) — qui maintenant correspond strictement à une URL Supabase storage. Conséquence visible :
- La section **"Vos captures personnelles"** ne contiendra plus que de vraies photos uploadées par le marcheur (souvent moins nombreuses, parfois zéro).
- Les espèces backfillées depuis iNat (avec photo iNat) atterriront dans **"Repérées dans le périmètre"**, sans liseré emerald.
- Le hint *"Aucune photo perso encore. Uploadez vos clichés depuis l'onglet Observations."* déjà en place s'affichera correctement.

## Robustesse

- **Pas de migration DB** : pure logique frontend.
- **Pas de re-fetch supplémentaire coûteux** : un seul `select` léger sur `marcheur_medias` (déjà indexé par `user_id`/`attributed_marcheur_id`).
- **Garde-fou** : si `userId` et `crewId` sont tous deux nuls, on saute la requête `marcheur_medias` (cas observateur tiers consultant une fiche).
- **Idempotent** : `ownMediaUrls` est un Set → pas de doublon. La promotion d'une entrée iNat existante ne crée pas de doublon dans `byKey`.
- **Compatibilité** : la mémoire *"Score iNat fusion"* (Fréquence) n'est pas impactée — ce changement ne touche que l'affichage du sous-onglet Contributions.

## Fichier touché

- `src/components/community/exploration/MarcheursTab.tsx` (composant `ContributionsSubTab` ~ lignes 431-540) :
  - Ajouter `isOwnPhotoUrl`.
  - Réécrire la boucle `marcheur_observations` pour ne marquer `hasOwnPhoto` que si l'URL est Supabase.
  - Ajouter le fetch `marcheur_medias` → `ownMediaUrls`.
  - Étendre la boucle d'enrichissement iNat pour promouvoir les URLs présentes dans `ownMediaUrls`.

## Hors scope

- Ne pas changer l'edge function `backfill-marcheur-inaturalist` (l'iNat URL reste utile pour la fiche espèce et la galerie globale).
- Ne pas modifier `useSpeciesMarcheurPhotos` (utilisée par la modale espèce — comportement actuel correct car les deux sources sont rendues côte à côte).
- Pas de carrousel multi-photos perso (V2).
