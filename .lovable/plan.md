Constat vérifié : la page affiche **27/06/2026** parce que le RPC `get_propriete_biodiversity` prend bien `marcheur_observations.observation_date`, mais il ignore le champ iNaturalist réellement présent dans les snapshots : `species_data[].lastSeen`.

Pour Maison Sous Blossac, les données confirment :
- `marcheur_observations` max = **2026-06-27**
- `biodiversity_snapshots.species_data[].lastSeen` max = **2026-07-14**
- le RPC actuel renvoie donc à tort **2026-06-27**

Plan de correction :

1. **Mettre à jour le RPC `public.get_propriete_biodiversity(uuid)`**
   - Ajouter `species_data[].lastSeen` dans le calcul de `lastObservationDate`.
   - Ajouter aussi les variantes robustes déjà rencontrées dans le projet : `last_seen`, `observationDate`, `observedDate`, `observedOn`, `lastObservedAt`, `observed_on`.
   - Garder uniquement les dates d’observation réelles ; ne pas utiliser `snapshot_date`, qui est une date de synchronisation et non une date d’observation.

2. **Sécuriser le parsing des dates**
   - Ne caster en date/timestamp que les chaînes au format ISO valide pour éviter une erreur SQL si un snapshot contient une valeur non standard.

3. **Conserver la logique actuelle de rayon et de propriété**
   - Continuer à parcourir tous les événements rattachés à la propriété.
   - Continuer à résoudre les marches sous-jacentes via `exploration_marches`.
   - Continuer à ne prendre que les espèces dans le rayon de marche.

4. **Valider après migration**
   - Rejouer `public.get_propriete_biodiversity()` sur Maison Sous Blossac.
   - Vérifier que `lastObservationDate` devient **2026-07-14**.
   - Vérifier que l’écran affiche ensuite **14/07/2026** dans “Dernière observation”.

Impact attendu : la carte Propriété affichera une date de dernière observation alignée avec les données naturalistes iNaturalist les plus récentes, pas seulement avec les observations marcheurs importées.