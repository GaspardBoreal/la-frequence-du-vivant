## Objectif

Transformer le bloc **« Cortège floristique — Cochez les plantes »** en un outil vivant qui exploite les observations marcheurs (iNaturalist + saisies manuelles) au lieu d'être une checklist statique de 40 plantes.

## Principe disruptif : le « Cortège Révélé »

La checklist n'est plus une liste plate — elle devient une **stratification en 3 cercles** générée à partir des données marcheurs :

```text
┌──────────────────────────────────────────────────────────┐
│  🟢 CERCLE 1 — DÉJÀ RÉVÉLÉES PAR LES MARCHEURS           │
│     Plantes bio-indicatrices du KB détectées sur site    │
│     → Photo terrain + date + marcheur + pré-cochées      │
├──────────────────────────────────────────────────────────┤
│  🟡 CERCLE 2 — SIGNALES FAIBLES (à confirmer)            │
│     Genre observé mais espèce à vérifier (ex: Rumex sp.) │
│     ou 1 seule observation ancienne (> 6 mois)           │
├──────────────────────────────────────────────────────────┤
│  ⚪ CERCLE 3 — À CHERCHER SUR LE TERRAIN                 │
│     Reste du KB, filtrable par famille                   │
└──────────────────────────────────────────────────────────┘
```

## Fonctionnalités clés

**1. Matching KB ↔ observations marcheurs**

- Utiliser `usePropertySpeciesPool` (déjà agrégeant toutes les marches de la propriété).
- Matcher chaque `PlantIndicator.latin` avec `scientificName` du pool (normalisation NFD + genre-only fallback pour "Rumex spp.", "Juncus spp." déjà présents dans le KB).
- Chaque plante KB gagne : `observed_count`, `last_seen`, `field_photo_url`, `observers[]`, `confidence` (high/medium/low).

**2. Pré-cochage intelligent**

- Cercle 1 (confidence high, ≥ 2 obs OU obs < 6 mois) → **pré-coché** avec badge « Confirmé par la Fréquence ».
- L'utilisateur peut décocher (override manuel) → tracé dans `state.observed_plants`.
- Badge visuel distinguant : `manuel` vs `marcheur` vs `manuel + marcheur`.

**3. Vignette enrichie (remplace la carte plate actuelle)**

- Photo terrain marcheur en fond (via `SpeciesPhotoModeContext` déjà en place) au lieu du picto SVG quand disponible.
- Micro-métadonnées : « Vu 3× · dernière le 14/07 · par Marie »
- Clic long / bouton `i` → drawer avec toutes les observations (photos + dates + carte mini).

**4. Bandeau de tête dynamique « Ce que les marcheurs savent déjà »**

- Réplique du modèle `BiodiversityEvidenceBlock` mais scoping flore-indicatrice :
  - `X / 40` bio-indicatrices révélées
  - `Y` observations sur `Z` marches
  - Fraîcheur : pastille verte (< 3 mois) / ambre / grise
  - CTA « Actualiser depuis les marches » (invalidate query).

**5. Gestion des cas — matrice**


| Cas données marcheurs                                                  | Comportement UI                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aucune data**                                                        | Cercle 1 vide, message : « Aucune marche encore réalisée. Organisez une marche pour révéler le cortège. » + CTA vers `/marches`. Fallback = comportement actuel (checklist plate). |
| **Data récente & riche** (> 10 obs, < 3 mois)                          | Cercle 1 majoritaire, ambiance « pleine confiance », badge vert.                                                                                                                   |
| **Data ancienne** (> 12 mois)                                          | Cercle 1 grisé, bandeau : « Ces observations datent — reconfirmez sur le terrain » + suggestion nouvelle marche.                                                                   |
| **Data faible** (1-3 obs)                                              | Cercle 2 privilégié, message pédagogique : « Signaux faibles à confirmer ».                                                                                                        |
| **Observation hors KB** (ex : espèce trouvée mais pas bio-indicatrice) | Section additionnelle discrète : « N autres plantes observées, non bio-indicatrices » repliable.                                                                                   |


**6. Live updates**

- React Query avec invalidation via realtime Supabase sur `marcheur_observations` + `biodiversity_snapshots` (channel scopé aux marches liées).
- Toast discret « Nouvelle observation : Ortie dioïque par Léa » quand un delta arrive pendant la session.

**7. Impact sur l'ICG (bloc Concordance)**

- Les plantes du Cercle 1 (marcheurs) sont pondérées ×1.2 dans `computeFloraProfile` (donnée validée terrain).
- Le narratif mentionne : « Diagnostic basé sur 12 observations propriétaire + 34 confirmées par les marcheurs ».

## Détails techniques

- **Nouveau hook** `usePropertyFloraMatched(proprieteId)` : combine `usePropertyFlora` + `usePropertySpeciesPool`, renvoie `PlantIndicator & { observations, confidence, photos, lastSeen, observers }[]` + `stats`.
- **Matching** dans `src/lib/plantIndicatorMatcher.ts` : normalisation NFD, gestion `spp.`/`sp.`, matching genre pour Rumex/Juncus.
- **Refonte `CortegeBlock.tsx**` : structure en 3 sections (Révélées / Signaux faibles / À chercher), nouvelle sous-composant `PlantTile` avec 2 variants (`revealed` avec photo terrain, `hidden` façon actuelle).
- **Nouveau composant** `FloraRevealHeader.tsx` : bandeau stats + fraîcheur + CTA refresh.
- **Persistance** : `state.observed_plants` reçoit auto les IDs du Cercle 1 au premier chargement (via `useEffect` + flag `auto_confirmed_from_walkers text[]` en base pour distinguer manuel/auto). → nécessite migration mineure ajoutant cette colonne à `propriete_flora_diagnostics`.
- **Realtime** : subscription Supabase channel filtrée sur les `event_id` de la propriété.
- **Aucun impact** sur les autres blocs (Intensities/Concordance/Narrative) au-delà de la pondération dans `computeFloraProfile`.

## Questions ouvertes

1. **Pré-cochage auto** :  laisser en surbrillance mais non cochées (le propriétaire coche s'il confirme visuellement)
2. **Seuil de « fraîcheur »** : je propose 3 mois vert / 12 mois ambre / au-delà gris — OK ou autres seuils
3. **Genre-only matching** : accepter qu'une obs « Rumex crispus » révèle « Rumex » du KB (matching famille/genre) 