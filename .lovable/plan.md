## Réponse courte (ce qui est possible aujourd'hui)

Ces trois points sont déjà corrigeables, mais **un par un** : sur la Carte des révélations, bouton **« Contrôle GPS »** (visible car vous êtes curateur) → dans la console, sélectionner un point → **Repositionner** → cliquer l'emplacement exact sur la carte. À répéter 3 fois. La correction est une surcouche éditoriale (iNaturalist n'est pas modifié) et se propage partout (propriété, marches, exports).

## Ce que je propose d'ajouter pour que ce soit fait en un geste

### 1. Sélection multiple dans la console GPS
- Cases à cocher sur les lignes de la liste + `Maj+clic` pour une plage.
- Raccourci **« Sélectionner toutes les observations de cette espèce »** depuis la fiche du point sélectionné (exactement votre cas : 3 points, même espèce).
- Barre d'action flottante : « 3 sélectionnés · Repositionner · Écarter · Valider · Annuler correction ».

### 2. Repositionnement groupé, avec 3 façons de désigner la cible
- **Clic carte** : un clic place les N points au même endroit.
- **Coller des coordonnées** (`44.8123, 0.1456`) — utile si vous avez la position exacte depuis iNaturalist ou un GPS de terrain.
- **Copier la position d'un point de référence** : « utiliser la position de ce point » (un point déjà bien placé de la même espèce).
- Option **« léger éclatement »** (5 m) pour que les 3 marqueurs restent distinguables au lieu de se superposer.

### 3. Traçabilité
- Chaque point garde sa position d'origine (`original_lat/lon`) et le motif ; annulation possible point par point ou pour tout le lot.
- Le compteur « repositionnés / écartés » de la Carte des révélations reflète le lot immédiatement.

## Détails techniques

- `src/components/propriete/gps/GpsControlConsole.tsx` : état `selectedIds: Set<string>`, barre d'action groupée, mode `repositioning` étendu à N cibles, saisie de coordonnées, dispersion optionnelle.
- `src/hooks/propriete/useGpsOverrides.ts` : ajout d'un `useSetGpsOverridesBatch` qui boucle sur la RPC existante `set_observation_gps_override` (séquentiel, avec compte des succès/échecs et un seul toast) — aucune migration nécessaire, la RPC accepte déjà les clés UUID et les URL iNaturalist.
- Invalidation des caches `observation-gps-overrides` et `exploration-species-pool-rpc` une seule fois en fin de lot.
- Aucun changement côté base de données ni côté données sources.
