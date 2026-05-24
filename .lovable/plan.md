# Reconnaissance photos marcheurs — Pipeline Wahuhhh

Deux flux complémentaires partageant la même edge function de reconnaissance (`recognize-marcheur-photos`) et la même logique de fallback GPS.

---

## 1. Onglet admin "Reconnaissance IA" sur fiche événement

Nouvel onglet dans `/admin/marche-events/:id` (à côté de Médias / Synthèse).

### Bandeau de configuration

- Slider seuils (auto ≥85 / curation 60-85 / rejet <60 par défaut, persistés sur `marche_events.ai_recognition_config` jsonb).
- Compteur live : `X photos analysables / Y déjà traitées / Z en curation`.
- Bouton **"Lancer l'analyse"** (batch async, progress bar realtime via Supabase channel).

### Étape 1 — Sélection des photos

- Liste paginée des `marcheur_medias` de l'événement, filtres : marcheur, date, statut (non analysé / analysé / curé / publié), présence EXIF GPS.
- Multi-select + actions groupées.

### Étape 2 — Analyse IA

Edge function `recognize-marcheur-photos` :

1. Pour chaque photo : EXIF datetime + GPS si présent.
2. Appel iNat `/v1/computervision/score_image` (lat/lng/observed_on quand dispo → biaise les suggestions vers la région/saison).
3. Stocke 5 top suggestions dans nouvelle table `marcheur_photo_ai_suggestions` (score, taxon_id, scientific_name, common_name, iconic_taxon, geo_score).
4. Routing :
  - Score ≥ seuil_auto → crée `marcheur_observations` automatiquement.
  - Entre seuils → flag `pending_curation`.
  - Sous rejet → `low_confidence`.

### Étape 3 — Fallback GPS (cascade automatique)

Pour photos sans EXIF GPS, dans cet ordre :

1. **Cluster temporel** : si une autre photo du même marcheur ±60s a un GPS → hérite.
2. **Interpolation tracé** : projette EXIF datetime sur waypoints de la marche → coordonnées ~50m.
3. **Centroïde marche** : fallback ultime.
4. **Drawer admin manuel** : pin draggable sur `<RichMap>` pour les photos restantes douteuses (badge orange).

Chaque photo conserve `geo_source` enum (`exif` / `cluster` / `interpolation` / `centroid` / `manual`) pour traçabilité.

### Étape 4 — Drawer curation pro

Pour chaque photo en `pending_curation` :

- Carrousel photo + zoom.
- Liste des 5 suggestions iNat avec vignettes, score, distribution géo.
- **Actions clés** :
  - ✅ Valider la suggestion sélectionnée
  - ✏️ Rechercher autre taxon (autocomplete GBIF / iNat)
  - 🔀 Réattribuer la photo à un autre marcheur
  - 📍 Corriger le point GPS sur la carte
  - 🗑️ Marquer "non identifiable" / déchet
  - 🔗 Fusionner avec une observation existante (doublons)
  - 💬 Note interne admin
- Raccourcis clavier (←/→ navigation, 1-5 sélection suggestion, V valider).

### Étape 5 — Validation finale & pack iNat

Bouton **"Publier N observations validées"** :

- Crée/met à jour `marcheur_observations` (attribution = marcheur).
- Trigger snapshot resync (réutilise pipeline existant).
- Génère un **Pack iNat-ready** téléchargeable (.zip) :
  - Photos renommées `YYYYMMDD_HHMMSS_taxon.jpg`
  - CSV iNat bulk import (observed_on, latitude, longitude, taxon_name, description, tag=marche-XXX)
  - README avec instructions upload iNat
- Bouton "Envoyer le pack à Vincent par email" (Resend).

---

## 2. App marcheur — Onglet Carte → bouton Appareil photo

Quand le marcheur tape l'icône caméra : drawer de sélection de mode.

### Sélecteur de mode (drawer)

```
┌─────────────────────────────────────┐
│ 📍 Déposer une photo                │
│    Voir sa position GPS             │
│    (fonction existante)             │
├─────────────────────────────────────┤
│ 🔍 Identifier une espèce  ✨        │
│    Photo → IA → reveal poétique     │
└─────────────────────────────────────┘
```

### Flux "Identifier une espèce"

1. **Capture** : `<input capture="environment">` (force caméra + EXIF GPS device).
2. **Upload + analyse** : appel `recognize-marcheur-photos` en mode single.
3. **Ritual Reveal animé** (réutilise `ritual-reveal-logic`) en 4 actes :
  **Acte 1 — Scan poétique** (2s) : ondes lumineuses sur la photo + texte "Le vivant se révèle…"
   **Acte 2 — Identification** : carte 3D flip révélant
  - Nom français (SpeciesName) + scientifique
  - Confiance % avec badge couleur
  - Photo iNat de référence
  - Si <85% : "Plusieurs pistes possibles" → 3 choix tactiles
   **Acte 3 — Carte d'identité écologique** (swipable) :
  - 🔺 **Niveau trophique** (visuel pyramide animée : producteur / herbivore / carnivore / décomposeur)
  - 🌿 **Tags écologiques** (mellifère, fixateur azote, indicateur biodiversité…)
  - 🍽️ **Chaîne trophique interactive** : "Mange : [3 espèces vues sur la marche]" / "Mangé par : [2 espèces]" → tap pour ouvrir leur fiche
  - 🌍 **Statut conservation** IUCN + tendance locale
   **Acte 4 — Impact wahuhhh** :
  - 🎯 **"Vous êtes le N°3 à observer cette espèce sur l'événement"** (compteur animé)
  - ⭐ **"+15 Fréquences"** (animation Fréquence du jour)
  - 🏆 **Badge débloqué** si applicable ("Première coccinelle !", "Sentinelle des pollinisateurs"…)
  - 🗺️ **Mini-carte** : autres observations de cette espèce sur la marche (points pulsants)
  - 📤 Bouton "Partager ce reveal" (image générée auto)
4. **Validation** : "C'est bien ça ?" → ✅ enregistre `marcheur_observations` / ❌ ouvre suggestions alternatives.

---

## Détails techniques

### Nouvelles tables

- `marcheur_photo_ai_suggestions` : `media_id, rank, taxon_id, scientific_name, common_name, iconic_taxon, vision_score, geo_score, combined_score, created_at`
- `marche_events.ai_recognition_config` jsonb : `{ auto_threshold, curation_threshold, reject_threshold, last_run_at }`
- `marcheur_medias` : nouvelles colonnes `ai_status` enum, `geo_source` enum, `geo_lat`, `geo_lng` (overrides EXIF), `curated_taxon_id`, `curated_by`, `curated_at`

### Edge functions

- `recognize-marcheur-photos` : batch mode (admin) + single mode (app). Appelle iNat CV API, applique fallback GPS, écrit suggestions.
- `enrich-species-trophic-context` : pour le reveal acte 3, retourne chaîne trophique + tags + espèces liées sur l'événement (réutilise `useTrophicChain` + `useEcologicalFunctions`).
- `generate-inat-pack` : produit ZIP CSV iNat-ready.

### Composants frontend

- `AdminAiRecognitionTab.tsx` (onglet)
- `AiPhotoCurationDrawer.tsx` (drawer curation pro)
- `GpsManualPinDrawer.tsx` (correction manuelle GPS)
- `MarcheurCameraModeSelector.tsx` (sélecteur drawer)
- `IdentifySpeciesRitualReveal.tsx` (reveal 4 actes — réutilise primitives ritual-reveal existantes)
- `TrophicChainInteractive.tsx` (acte 3)
- `WahuhhImpactCard.tsx` (acte 4)

### Sécurité & cohérence

- Edge function admin : JWT + `has_role(admin/ambassadeur)` via RPC `SECURITY DEFINER`.
- Edge function marcheur : JWT + auth.uid() pour attribution stricte.
- Toute création `marcheur_observations` → trigger snapshot resync existant (garantit cohérence Fréquence + count unifié).
- Respect `useFrenchSpeciesNamesAuto` + `<SpeciesName />` partout.

### Secret requis

- `INATURALIST_API_TOKEN` (Computer Vision endpoint authentifié, ~10K req/jour). À ajouter avant déploiement.

---

## Livraison en 3 phases

**Phase 1 — MVP admin Vincent (priorité absolue)**
Tables + edge `recognize-marcheur-photos` + onglet admin + drawer curation + fallback GPS automatique. Cible : traiter les 81 photos de Vincent en <30 min.

**Phase 2 — Pack iNat & drawer GPS manuel**
Génération ZIP + email + pin draggable carte.

**Phase 3 — App marcheur "Identifier une espèce"**
Sélecteur caméra + Ritual Reveal 4 actes + chaîne trophique interactive + impact wahuhhh.

---

## Question résiduelle bloquante

Avant Phase 3 : pour le **token iNaturalist Computer Vision** (nécessaire dès Phase 1), tu préfères que je :

- (a) utilise un compte iNat dédié : [https://www.inaturalist.org/people/gaspardboreal](https://www.inaturalist.org/people/gaspardboreal)