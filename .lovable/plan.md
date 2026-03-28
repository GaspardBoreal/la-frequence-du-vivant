

# Corriger l'absence de données dans le Carnet Vivant

## Diagnostic

Le probleme est un **decalage de source de donnees** :

- La page **bioacoustique** (COPIE 1) appelle l'edge function `biodiversity-data` en temps reel avec les coordonnees GPS de la marche → elle recupere bien les donnees GBIF/iNaturalist/eBird
- Le **Carnet Vivant** (COPIE 2) cherche dans la table `biodiversity_snapshots` avec `marche_id` → cette table est **vide** pour cette marche (aucun snapshot n'a ete genere)

La marche "Nous deux a Nouaille" a bien des coordonnees (lat: 46.51, lng: 0.41) mais personne n'a lance la collecte de snapshots pour elle. Les snapshots existent uniquement pour les marches historiques de la Dordogne.

## Solution

Plutot que d'exiger un snapshot pre-calcule, le VivantTab doit **appeler l'edge function `biodiversity-data` en fallback** quand aucun snapshot n'existe. Cela reproduit exactement ce que fait la page bioacoustique.

### Logique

1. Query `biodiversity_snapshots` par `marche_id` (comme actuellement)
2. Si aucun snapshot → charger les coordonnees de la marche depuis `marches`
3. Appeler `biodiversity-data` edge function avec lat/lng
4. Afficher les resultats dans le meme format (especes, index, top especes)

### Avantage

- Zero migration, zero nouvelle table
- Le marcheur voit les memes donnees que sur la page bioacoustique
- Si un snapshot existe (marches plus anciennes), on l'utilise directement (plus rapide)

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Dans `VivantTab` : ajouter une query de fallback qui charge les coords de la marche puis appelle l'edge function `biodiversity-data` quand `snapshot` est null. Adapter l'affichage pour accepter les deux formats de donnees (snapshot table vs reponse edge function) |

## Detail technique

```text
VivantTab(marcheId)
  │
  ├─ Query 1: biodiversity_snapshots WHERE marche_id = X
  │   └─ snapshot trouvé? → afficher directement
  │
  └─ Query 2 (enabled si !snapshot):
      ├─ Charger marches.latitude/longitude WHERE id = X
      └─ Appeler edge function biodiversity-data(lat, lng, radius: 5000)
          └─ Transformer la reponse en format affichable
              (total_species, birds, plants, top species avec photos)
```

