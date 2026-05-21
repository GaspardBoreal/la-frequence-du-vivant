## Problème

Dans l'onglet **Apprendre → L'Œil**, sur 6 vignettes papillons, 5 affichent la photo terrain prise par les marcheurs et **Azurés (Polyommatus)** affiche la photo iNaturalist. La sélection est aléatoire selon que le snapshot iNat porte ou non une `imageUrl` pour cette espèce.

## Cause racine

Fichier : `src/hooks/useExplorationSpeciesPool.ts`

L'agrégation se fait en deux passes :

1. **Snapshots iNat d'abord** (lignes 59-83) — `imageUrl` est rempli avec l'image iNat dès qu'elle existe dans `species_data[].imageUrl`.
2. **Marcheur observations ensuite** (lignes 89-123) — la photo marcheur n'écrase l'image **que si `imageUrl` est vide** :

```ts
if (obs.photo_url && !found.imageUrl) {
  found.imageUrl = obs.photo_url;
}
```

→ Dès qu'iNat fournit une image (cas fréquent au niveau genre comme *Polyommatus*), la photo marcheur est ignorée. C'est une violation silencieuse de la règle métier « toujours la photo d'origine du terrain en premier ».

## Règle cible retenue

**Marcheur récent > Marcheur ancien > iNat (snapshot) > Placeholder**

S'il existe au moins une `marcheur_observations.photo_url` pour l'espèce, on affiche la **plus récente** (`observation_date` desc). iNat ne sert que de fallback.

## Modifications

### 1. `src/hooks/useExplorationSpeciesPool.ts` (correctif principal)

- Étendre le `select` sur `marcheur_observations` pour inclure `observation_date`.
- **Inverser la priorité** : pour chaque espèce, collecter toutes les `photo_url` marcheur, garder la plus récente, et **écraser** `imageUrl` issue du snapshot iNat avec cette photo terrain.
- Comportement nouveau :
  - 1+ photo marcheur → `imageUrl` = photo marcheur la plus récente (toujours).
  - 0 photo marcheur mais image iNat dans le snapshot → `imageUrl` = image iNat.
  - Aucune des deux → `imageUrl = null`, le fallback `useSpeciesPhoto` (iNat live) prend la main côté composant.

### 2. Audit des autres lieux d'affichage

- `src/components/community/insights/curation/CuratedSpeciesCard.tsx` : consomme `species.imageUrl` du pool → correctif automatiquement propagé.
- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` : carrousel déjà géré par `useSpeciesMarcheurPhotos` (marcheur prioritaire à date égale, déjà conforme).
- `src/components/biodiversity/SpeciesCardWithPhoto.tsx` : utilisé hors exploration, pas de source marcheur disponible → on laisse `useSpeciesPhoto` (iNat). Aucune action.
- Vues Synthèse / Trophique (`ConstellationTab`, `SpiraleTab`, `ReseauTab`) : consomment le même `pool` enrichi → correctif propagé automatiquement.
- Modale fiche espèce (trophic fullscreen) : reçoit déjà ses photos via le pool ou `useSpeciesMarcheurPhotos` → conforme.

Aucune autre modification nécessaire.

## Détails techniques

```ts
// useExplorationSpeciesPool — pseudo-code
const { data: marcheurObs } = await supabase
  .from('marcheur_observations')
  .select('species_scientific_name, photo_url, observation_date')
  .in('marche_id', marcheIds)
  .not('photo_url', 'is', null);

// Index : sci.toLowerCase() → photo la plus récente
const latestPhotoBySci = new Map<string, { url: string; date: string }>();
(marcheurObs || []).forEach(o => {
  const key = (o.species_scientific_name || '').trim().toLowerCase();
  if (!key || !o.photo_url) return;
  const ex = latestPhotoBySci.get(key);
  const d = o.observation_date || '';
  if (!ex || d > ex.date) latestPhotoBySci.set(key, { url: o.photo_url, date: d });
});

// 2e passe : écraser imageUrl avec la photo marcheur la plus récente
for (const entry of map.values()) {
  const k = (entry.scientificName || '').toLowerCase();
  const fieldPhoto = latestPhotoBySci.get(k);
  if (fieldPhoto) entry.imageUrl = fieldPhoto.url; // override iNat
}
// + créer les entries manquantes pour les espèces vues uniquement par marcheurs (logique actuelle conservée pour comptage)
```

## Hors-scope

- Pas de changement sur le carrousel détaillé (déjà conforme via `useSpeciesMarcheurPhotos`).
- Pas de mécanisme de « photo de couverture curée manuellement » (option 3 écartée).
- Pas de modification visuelle de la carte.

## Vérification

1. Recharger Apprendre → L'Œil sur Deviat (`/exploration/20dd3be8…`), filtre tag « papillon ».
2. Les 6 vignettes (dont Azurés) doivent montrer une photo marcheur (badge visuel terrain reconnaissable, pas le fond carré iNat).
3. Espèces sans aucune photo marcheur : doivent toujours afficher l'image iNat (fallback OK).
4. Vérifier Synthèse / vues trophiques : mêmes images marcheur priorisées (cohérence).
