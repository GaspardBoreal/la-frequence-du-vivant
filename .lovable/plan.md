## Constat

La brique IA existe déjà mais reste invisible :

- Edge function `suggest-bbch-stage` (Gemini 3 Flash Vision) → analyse 1 photo vs les 10 stades BBCH de la culture, retourne `macro`, `confidence`, `rationale`, `alternative_macro`, cache `pheno_ai_suggestions`.
- Hook `useBbchStageSuggestion` + bandeau « Suggestion IA » dans `PhenoStageSelector` (badge ✨ IA sur la tuile, bouton « Accepter »).
- Câblé dans `SpeciesGalleryDetailModal` avec la 1ère photo marcheur.

**Mais** : (1) le CTA orange dit « Noter le stade phénologique » sans annoncer l'IA, (2) l'analyse ne se déclenche qu'après ouverture du sheet, (3) une seule photo est lue alors que la marche en contient souvent 5–20 sur la même culture, (4) aucune restitution scientifique (timeline, export, accord inter-marcheurs).

## Plan en 3 vagues

### Vague 1 — Rendre la capacité visible (quick wins, sans nouveau backend)

1. **CTA explicite IA** dans `PhenoCtaButton.tsx`
  - Renommer en *« Détecter le stade BBCH ✨ IA »* quand `photoUrl` présent, garder *« Noter le stade »* en fallback.
  - Micro-pastille animée + tooltip « Analyse "LMDV Vision" vs référentiel INRAE/AgroPortal ».
2. **Pré-analyse au survol/ouverture de la fiche** (avant d'ouvrir le Sheet)
  - Lancer `useBbchStageSuggestion` dès que la modal espèce s'ouvre (photo déjà connue) → quand l'utilisateur clique le CTA, le résultat est déjà cached, perception « instantanée ».
3. **Choix intelligent de la photo source** dans `SpeciesGalleryDetailModal`
  - Sélectionner la photo marcheur la plus récente ET ≥ 1024 px (via `safeZoomSrc`/`highResDetailSrc`) plutôt que la 1ʳᵉ slide. La nuance phéno (siliques, boutons accolés) exige de la résolution.

### Vague 2 — Consensus multi-photos (disruptif côté UX scientifique)

Une marche contient souvent plusieurs photos du même colza. Une seule photo = bruit ; N photos = phénologie robuste.

4. **Nouvelle edge `suggest-bbch-stage-consensus**` (ou flag `photo_urls[]` sur l'existante)
  - Envoie jusqu'à 6 photos dans 1 seul appel multimodal Gemini (tableau `image_url`) avec un schéma tool : `[{photo_index, macro, confidence, rationale}, ...]` + champ agrégé `consensus_macro` + `dispersion`.
  - Cache par hash trié des URLs (`pheno_ai_suggestions_consensus`).
5. **Bandeau « Consensus IA sur N photos »** dans `PhenoStageSelector`
  - Petite frise de vignettes → chacune annotée du BBCH détecté + confiance.
  - Si dispersion > 1 stade, affiche « Transition en cours BBCH 6 → 7 » (signal phéno réel).

### Vague 3 — Posture chercheurs / agronomes

6. **Timeline phénologique de l'exploration** : nouvel onglet « Phéno » dans la fiche espèce.
  - X = date d'observation (depuis `marcheur_observations.observed_at`), Y = BBCH macro, points colorés par confiance IA, courbe spline.
  - Repères verticaux : dates clés agro (semis estimé, floraison observée, récolte théorique selon GDD).
7. **Enrichissement du prompt IA** (gain de précision marqué)
  - Injecter : mois courant, latitude/longitude (→ zone climatique), photos antérieures de la même parcelle ("le 15/03 c'était BBCH 2, aujourd'hui ?"), météo Open-Meteo (déjà disponible via `open-meteo-data`) → GDD cumulés.
  - Optionnel : passer en `google/gemini-3.1-pro-preview` pour les cultures à stades visuellement proches (blé/orge, vigne).
8. **Boucle de validation expert → fine-tuning futur**
  - Quand un marcheur accepte/refuse la suggestion, on stocke déjà `ai_accepted`. Ajouter un dashboard admin `/admin/pheno/qualite-ia` : taux d'acceptation par culture × stade, matrice de confusion → identifier les stades à ré-entraîner.
  - Export CSV (photo_url, crop, bbch_ia, bbch_validé, gps, date) pour fine-tuning éventuel d'un modèle dédié (PlantNet-Pl@ntNet, ou LoRA Gemini quand dispo).
9. **API publique « Phéno-as-a-Service »**
  - Nouvelle route `/api/pheno/v1/observations?bbox=…&crop=colza` (RPC `get_public_pheno_observations`) → JSON-LD compatible PPDO/PPD-CR (ontologie déjà référencée dans `bbchStages.ts`).
  - Argument décisif pour INRAE, chambres d'agriculture, étudiants AgroParisTech.

## Détails techniques

- **Modèles** : `google/gemini-3-flash-preview` (défaut, déjà en place), upgrade conditionnel à `gemini-3.1-pro-preview` si `confidence < 0.5` (retry automatique).
- **Quota** : cache serveur déjà actif (`pheno_ai_suggestions` UNIQUE `photo_url,crop_key`) → un seul appel par photo, jamais ré-analysé.
- **Schéma tool consensus** :
  ```text
  { per_photo: [{idx, macro, confidence, rationale}],
    consensus_macro: int, consensus_confidence: float,
    transition: { from: int, to: int } | null,
    unknown_count: int }
  ```
  &nbsp;
- **Storage** : nouvelle table `pheno_ai_consensus` (`hash_key`, `crop_key`, `photo_urls jsonb`, `result jsonb`, `created_at`).
- **Sécurité** : edge en mode JWT (déjà fait), RLS lecture publique sur snapshots agrégés uniquement.
- **Coût estimé** : Gemini Flash vision ≈ 0,0003 €/photo. 6 photos × 100 obs/jour ≈ 0,18 €/jour.

## Livrables par vague


| Vague | Effort | Impact                          | Fichiers principaux                                                          |
| ----- | ------ | ------------------------------- | ---------------------------------------------------------------------------- |
| 1     | S      | Rend l'IA visible immédiatement | `PhenoCtaButton.tsx`, `SpeciesGalleryDetailModal.tsx`                        |
| 2     | M      | Robustesse scientifique         | edge `suggest-bbch-stage` (+param), `PhenoStageSelector.tsx`, nouvelle table |
| 3     | L      | Positionnement chercheurs       | nouvel onglet Phéno, dashboard admin, RPC publique, doc API                  |


Je propose d'enchaîner **Vague 1 maintenant** (≈ 1 itération) puis Vague 2, et Vague 3 selon retour terrain.