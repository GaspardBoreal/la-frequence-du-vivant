# Admin Propriétés — console de gestion à grande échelle

Objectif : préparer l'arrivée de 1000+ propriétés (campagne marketing Fréquence Jardin) en transformant `/admin/proprietes` en une vraie console de gestion : liste filtrable + carte, et une fiche plein écran structurée à la place du panneau latéral actuel.

## Ce que voit l'administrateur

### 1. Écran liste repensé (`/admin/proprietes`)

- **Barre de KPI cliquables** (même principe que l'écran Communauté, déjà validé) : Total, Actives, Archivées, Géolocalisées, Avec sondes. Un clic filtre la liste, un second clic réinitialise.
- **Barre de filtres** persistante dans l'URL (partageable) :
  - Recherche plein texte (nom, ville, code postal) — insensible aux accents ;
  - Statut (Active / Archivée) ;
  - Région, puis Département (listes dérivées des données réelles) ;
  - Entreprise propriétaire ;
  - « Sans coordonnées GPS » (pour traquer les fiches à compléter — critique à grande échelle).
- **Bascule de vue `Table | Carte`** :
  - *Table* : lignes enrichies (nom, lieu, surface, entreprise, marcheur référent, nombre de sondes, statut), tri par colonne (nom, surface, date de création), pagination identique au Journal/Alertes IoT (contrôles + page dans l'URL).
  - *Carte* : carte Leaflet réutilisant `SafeMapContainer` + `DynamicTileLayer` (même socle que le reste de l'app), un marqueur par propriété géolocalisée, popup avec nom/ville/statut et bouton « Ouvrir la fiche ». Zoom auto sur les résultats filtrés (comportement déjà éprouvé sur l'onglet Carte des marches). Les propriétés sans GPS sont listées dans un panneau latéral « À localiser ».
- Chaque ligne/marqueur mène vers la fiche plein écran.

### 2. Fiche propriété plein écran (nouvelles routes)

- `/admin/proprietes/nouvelle` (création) et `/admin/proprietes/:id` (édition), protégées par `AdminAuth` comme l'existant.
- **En-tête fixe** : nom de la propriété, slug, statut, boutons « Enregistrer » / « Supprimer » toujours visibles, retour liste avec avertissement si modifications non enregistrées.
- **Sommaire ancré** (colonne gauche sur desktop, pastilles défilantes sur mobile) qui saute aux sections :
  1. **Identité** — nom, description, photo hero (reprise de l'uploader d'images avec compression déjà construit pour l'onboarding, avec repli URL).
  2. **Localisation** — adresse, CP, ville, département, région, surface ; **mini-carte de positionnement** : bouton « Géocoder l'adresse » (via le service de géocodage existant) puis marqueur déplaçable à la souris/doigt pour ajuster finement latitude/longitude, champ `geofence_buffer_m` en avancé.
  3. **Rattachements principaux** — entreprise propriétaire + marcheur référent (sélecteurs avec recherche, repris tels quels).
  4. **Marcheurs rattachés** — ajout/rôle/suppression/étoile « propriété principale » (logique existante conservée).
  5. **Entreprises rattachées** — idem.
  6. **Événements Marches du Vivant** — idem.
- Sections 4–6 affichées uniquement après création (comme aujourd'hui).
- **Suppression sécurisée** : `AlertDialog` de confirmation qui affiche d'abord l'inventaire des liaisons (X marcheurs, Y entreprises, Z événements, N sondes IoT) et exige de **retaper le nom exact** de la propriété pour armer le bouton « Supprimer définitivement ». Un bandeau signale le risque si des sondes sont rattachées.

## Détails techniques

- `src/pages/AdminProprietes.tsx` — réécrit : devient la console liste (KPI, filtres, pagination, bascule Table/Carte). Toute la logique formulaire en est extraite.
- `src/pages/AdminProprieteFiche.tsx` — **nouveau** : page plein écran de création/édition ; reprend les mutations existantes (insert/update/delete + liaisons `propriete_marcheurs`, `propriete_companies`, `propriete_marche_events`) sans changement de logique métier.
- `src/components/admin/proprietes/` — **nouveaux** : `ProprietesKpiBar.tsx`, `ProprietesFilters.tsx`, `ProprietesMapView.tsx`, `ProprietePositionPicker.tsx` (mini-carte + marqueur draggable), `DeleteProprieteDialog.tsx`.
- `src/App.tsx` — 2 routes ajoutées sous `AdminAuth` ; l'entrée `/admin/proprietes` reste inchangée (pas de casse d'URL).
- Cartographie : réutilisation stricte de `src/components/maps/` (`SafeMapContainer`, `DynamicTileLayer`, styles partagés) — aucun nouveau socle carte.
- Compteur de sondes par propriété : requête groupée sur `iot_capteurs` (lecture seule), affichée en colonne et en KPI.
- Photo hero : réutilisation de `ImageUploadField` + `uploadGalleryImage` (compression 1600 px, bucket existant).
- **Aucune migration SQL** : la table `proprietes` (22 colonnes) contient déjà tout le nécessaire (`latitude`, `longitude`, `geofence_buffer_m`, `metadata`…). Aucun changement de RLS.
- Performance 1000+ : requêtes limitées aux colonnes utiles, pagination serveur (`.range()`), recherche/filtres côté requête pour le nom/ville/CP, région/département dérivés du résultat.

## Hors périmètre

- Import en masse (CSV) de propriétés — chantier séparé si la campagne l'exige.
- Duplication de fiche, fusion de doublons, historique d'audit des modifications.
- Toute évolution du schéma ou des politiques RLS.
