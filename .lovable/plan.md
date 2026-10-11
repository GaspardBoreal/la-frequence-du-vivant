# Buse variable de « Jardin Monde » : diagnostic et prévention

## Constat (vérifié en base)
- L'observation iNaturalist n° 407258720 (Buse variable, Les Marches du Vivant, prise le 10.10.2026) **est bien enregistrée** aujourd'hui à 11h18 (heure de Paris), sur 5 points de l'événement (C 865, C 0867, Point 00…), dans un rayon de 500 m.
- Elle n'apparaissait pas avant parce que les données iNaturalist se mettaient à jour **une fois par jour**, ou quand on ouvrait la page et que la dernière mise à jour avait plus de 2 h. Entre-temps, l'écran affiche l'ancienne liste, sans rien signaler.
- Rien n'est perdu : c'est un **retard**, pas un rejet.

## Ce qui change
1. **Indication de fraîcheur** dans l'onglet Biodiversité : « Données iNaturalist à jour il y a X min », et « Mise à jour en cours… » pendant la synchronisation.
2. **Bouton « Actualiser depuis iNaturalist »** (organisateurs et admin) pour récupérer immédiatement une observation qu'on vient de poster.
3. **Mise à jour automatique de l'écran** dès que de nouvelles données arrivent : la Buse apparaît sans recharger la page.
4. **Surveillance prioritaire du compte de l'association** : une vérification toutes les heures des nouvelles observations de @les-marches-du-vivant et des marcheurs inscrits ; si une observation tombe dans le rayon d'une marche et n'apparaît pas encore, collecte ciblée de cette marche.
5. **Alerte admin** quand une observation de l'association ou d'un marcheur, prise dans le rayon, reste absente plus de 3 h (liste dans Admin → Outils, avec lien iNaturalist et motif : hors rayon, coordonnées masquées, date hors période, espèce non identifiée).

## Vérifications
- La Buse variable s'affiche dans Jardin Monde (Taxons observés, Herbier, Carte).
- Une nouvelle observation test de l'association apparaît en moins d'une heure, ou tout de suite avec « Actualiser ».

## Détails techniques
- Fraîcheur : `max(created_at)` des `biodiversity_snapshots` des marches de l'exploration ; `isSyncing` exposé par `useSnapshotsResyncOnView`.
- Bouton : `useTriggerBiodiversityCollection({ explorationId, force: true })`, déjà existant.
- Temps réel : abonnement Supabase sur `biodiversity_snapshots` (filtré sur les marches de l'exploration) dans un `useEffect` avec nettoyage, puis invalidation des mêmes clés que `useTriggerBiodiversityCollection`.
- Nouvelle edge `watch-inat-accounts` (cron horaire) : `api.inaturalist.org/v1/observations?user_id=…&updated_since=…`, test Haversine contre le rayon de chaque marche, appel de `collect-event-biodiversity` avec `marcheIds` ciblés ; journal dans une table `inat_watch_misses` (GRANT et RLS admin).
