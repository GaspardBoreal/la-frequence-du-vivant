# Cohérence de l'alerte « Lovable AI Gateway »

## Le problème constaté

L'alerte rouge et le message « aucune espèce nouvelle à classifier » se contredisent, et c'est un défaut de mesure, pas un vrai incident.

Aujourd'hui l'état de santé de Lovable AI Gateway est calculé sur **la date de la dernière espèce classifiée** (8/07/2026). Cette date ne bouge que lorsqu'une nouvelle espèce est ajoutée à la base de connaissances. Comme toutes les espèces connues sont déjà étiquetées, plus rien ne s'écrit, la date vieillit indéfiniment, et l'indicateur passe orange puis rouge — alors que le service fonctionne parfaitement et n'a simplement rien à faire.

Le même piège guette toute intégration « à la demande » : l'absence de travail est interprétée comme une panne.

## Ce qui change

1. **Mesurer le retard, pas l'ancienneté.** Pour Lovable AI Gateway, l'état devient : combien d'espèces observées attendent encore d'être étiquetées.
   - 0 espèce en attente -> vert, libellé « à jour, rien à classifier ».
   - 1 à 30 en attente -> orange.
   - plus de 30, ou une vérification impossible -> rouge.
2. **Mémoriser la dernière vérification.** Chaque relance (et chaque calcul de santé) enregistre une date de « dernier contrôle ». La fiche affiche donc deux informations distinctes : « dernière classification » et « dernier contrôle », ce qui lève l'ambiguïté actuelle.
3. **Alerte de silence prolongé.** Si aucun contrôle n'a eu lieu depuis plus de 7 jours, l'API repasse orange — on surveille l'absence de surveillance, pas l'absence de travail.
4. **Message de relance cohérent.** Quand il n'y a rien à faire, la relance affiche « Vérification effectuée : 0 espèce en attente, base à jour » et l'alerte disparaît immédiatement de l'encadré du haut.
5. **Popup Info mise à jour** pour expliquer ce nouveau critère (retard de classification) au lieu de l'ancienneté de la dernière écriture.
6. **iNaturalist / GBIF restent sur la fraîcheur des observations** (24 h / 72 h) : là, la donnée doit réellement arriver en continu, le critère est pertinent.

## Détails techniques

- Nouvelle table légère `api_mcp_checks` (`slug`, `checked_at`, `backlog`, `note`) ou colonne `last_checked_at` sur `api_mcp_registry`, écrite en service-role, lecture admin — retenue : table `api_mcp_checks`, un enregistrement par contrôle, avec index sur (`slug`, `checked_at desc`).
- `get-api-mcp-health` : introduire un type de métrique `backlog` pour `lovable-ai`, calculé comme le nombre de `scientific_name` distincts de `biodiversity_snapshots` absents de `species_eco_tags_kb`, via une fonction SQL `count_species_awaiting_eco_tags()` (SECURITY DEFINER, stable) pour éviter de rapatrier des milliers de lignes. Le calcul écrit aussi une ligne dans `api_mcp_checks`.
- La réponse de santé expose `backlog`, `lastCheckedAt` en plus de `volume`/`freshness`/`status`; les seuils restent centralisés dans la fonction edge.
- `api-mcp-remediate` : pour `lovable-ai`, réutiliser la même fonction SQL de comptage, journaliser l'incident avec `outcome: 'success'` et le détail chiffré, et forcer un rafraîchissement de la santé côté client.
- Front : `useApiMcpHealth` typé avec les deux nouveaux champs, `ApiCard`/`ApiStoryDrawer`/`AdminApiMcp` affichent « dernier contrôle » et « en attente : n », `ApiRemediateInfo` reformulé.
