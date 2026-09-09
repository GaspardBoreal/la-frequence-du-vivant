---
name: Console admin Propriétés à grande échelle
description: /admin/proprietes = console liste (KPI cliquables, filtres URL, Table|Carte|Tableau de bord|Analyse, pagination serveur) ; fiche plein écran /admin/proprietes/:id et /nouvelle
type: feature
---

Console de gestion des propriétés dimensionnée pour 1000+ fiches (campagne Fréquence Jardin).

- **Liste** `/admin/proprietes` : KPI cliquables (Actives/Archivées/Géolocalisées/Avec sondes), filtres persistants dans l'URL (`q, statut, region, dept, entreprise, gps, sondes, intention, vue, tri, dir, page, ps`), bascule Table|Carte|Tableau de bord|Analyse, pagination serveur `.range()` + `PaginationControls`.
- **Filtre Portrait · Intention** : `intention=vide` correspond uniquement à `onboarding_preferences IS NULL` ou `'{}'::jsonb` ; `intention=renseignee` exclut ces deux cas. Un parcours commencé mais sans `completed_at` reste « renseigné ».
- **Fiche** `/admin/proprietes/:id` + `/nouvelle` : en-tête fixe (Enregistrer/Supprimer), sommaire ancré (pastilles défilantes mobile), sections Identité (photo hero via `ImageUploadField`), Localisation (géocodage + `ProprietePositionPicker` marqueur déplaçable), Rattachements, puis Marcheurs/Entreprises/Événements après création.
- **Tableau de bord fiche** (`sec-tableau-de-bord`) : 2 cartes biodiversité (`ProprieteBiodiversityCards` + `usePropertyBiodiversityKpis` : espèces distinctes par règne via `get_exploration_species_pool` des explorations rattachées, alliés = espèces à fonction écologique, cascade curation > KB > auto factorisée dans `src/lib/ecoFunctionsCascade.ts`) puis 8 cartes modules (`ProprieteDashboard` + `useProprieteDashboard`), lecture seule, état vide plutôt que zéro trompeur.
- **Intention dans la fiche** (`sec-intention`, `ProprieteIntentionSection`) : réutilise `PortraitIntention` en mode contrôlé (`section`/`onSectionChange`/`hideHeader`). Export CSV/JSON/PDF via `src/lib/intentionExport.ts`, incluant le bloc « Biodiversité » (jamais exporté tant que les chiffres ne sont pas chargés).
- **Suppression** : `DeleteProprieteDialog` — inventaire des liaisons (marcheurs, entreprises, événements, sondes IoT) + retaper le nom exact pour armer le bouton.
- **Schéma réel** `proprietes` : `is_active` (pas `archive`), `surface_hectares` (pas m²), `owner_company_id`, `main_walker_id`, `geofence_buffer_m`. Liaisons : `propriete_marcheurs` (community_profile_id, role, is_main), `propriete_companies` (company_id, role), `propriete_marche_events`.
- Cartographie : réutilisation stricte de `SafeMapContainer` + `DynamicTileLayer` + `MapStyleToggle` ; marqueurs en `L.divIcon` (jamais l'icône Leaflet par défaut, cassée sous Vite).
- Compteur sondes : chargement groupé de `iot_capteurs.propriete_id` (table petite) puis map en mémoire — pas de join.
