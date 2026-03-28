

# Corriger definitivement l'ecart de donnees : erreur d'unite du rayon

## Diagnostic definitif

J'ai appele l'edge function `biodiversity-data` avec les deux valeurs de rayon et compare les resultats :

- `radius: 0.5` → **42 especes** (identique a la page bioacoustique)
- `radius: 500` → **254 especes** (ce que le Carnet Vivant affiche)

Le probleme est une **erreur d'unite**. L'edge function interprete le rayon en **kilometres** :
- La page bioacoustique envoie `radius: 0.5` = 0,5 km = 500 metres
- Le Carnet Vivant envoie `radius: 500` = 500 km (!)

La correction precedente a change `5000` en `500`, mais le bon chiffre est `0.5`.

## Solution (mode hybride strict choisi)

### Etape 1 : Corriger le rayon dans le fallback realtime

Ligne 184 de `MarcheDetailModal.tsx` : changer `radius: 500` en `radius: 0.5`.

### Etape 2 : Mode hybride strict pour les snapshots

Avant d'utiliser un snapshot de la table `biodiversity_snapshots`, verifier que ses parametres correspondent :
- `radius_meters` du snapshot doit etre proche de 500 (= 0.5 km)
- Sinon, ignorer le snapshot et appeler l'edge function en temps reel

Cela garantit que si un snapshot a ete genere avec un rayon different (ex: batch a 5km), il ne sera pas utilise a la place des donnees temps reel a 500m.

## Detail technique

```text
VivantTab(marcheId)
  │
  ├─ Query 1: biodiversity_snapshots WHERE marche_id = X
  │   └─ snapshot.radius_meters ≈ 500 ? → utiliser
  │   └─ sinon → ignorer (passer au fallback)
  │
  └─ Query 2 (fallback):
      ├─ Charger marches.latitude/longitude
      └─ Appeler edge function avec radius: 0.5, dateFilter: 'recent'
          └─ 42 especes (identique au site web)
```

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Ligne 184 : `radius: 500` → `radius: 0.5`. Ligne 196 : ajouter condition `snapshot?.radius_meters <= 600` pour valider le snapshot avant utilisation (hybride strict). |

