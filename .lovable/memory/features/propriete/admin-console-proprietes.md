---
name: Console admin Propriétés à grande échelle
description: /admin/proprietes = console liste (KPI cliquables, filtres URL, Table|Carte, pagination serveur) ; fiche plein écran /admin/proprietes/:id et /nouvelle
type: feature
---

Console de gestion des propriétés dimensionnée pour 1000+ fiches (campagne Fréquence Jardin).

- **Liste** `/admin/proprietes` : KPI cliquables (Actives/Archivées/Géolocalisées/Avec sondes), filtres persistants dans l'URL (`q, statut, region, dept, entreprise, gps, sondes, vue, tri, dir, page, ps`), bascule Table|Carte, pagination serveur `.range()` + `PaginationControls`.
- **Fiche** `/admin/proprietes/:id` + `/nouvelle` : en-tête fixe (Enregistrer/Supprimer), sommaire ancré (pastilles défilantes mobile), sections Identité (photo hero via `ImageUploadField`), Localisation (géocodage + `ProprietePositionPicker` marqueur déplaçable), Rattachements, puis Marcheurs/Entreprises/Événements après création.
- **Suppression** : `DeleteProprieteDialog` — inventaire des liaisons (marcheurs, entreprises, événements, sondes IoT) + retaper le nom exact pour armer le bouton.
- **Schéma réel** `proprietes` : `is_active` (pas `archive`), `surface_hectares` (pas m²), `owner_company_id`, `main_walker_id`, `geofence_buffer_m`. Liaisons : `propriete_marcheurs` (community_profile_id, role, is_main), `propriete_companies` (company_id, role), `propriete_marche_events`.
- Cartographie : réutilisation stricte de `SafeMapContainer` + `DynamicTileLayer` + `MapStyleToggle` ; marqueurs en `L.divIcon` (jamais l'icône Leaflet par défaut, cassée sous Vite).
- Compteur sondes : chargement groupé de `iot_capteurs.propriete_id` (table petite) puis map en mémoire — pas de join.
