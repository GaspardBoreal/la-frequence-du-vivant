
# Curation manuelle « Marches Du Vivant » — intégrité totale

Objectif : tout curateur qui valide une photo dans l'onglet **Reconnaissance IA → Carte de curation** voit en clair l'impact exact de son action et ne peut pas créer d'observation orpheline ou mal rattachée.

## 1. Schéma BDD (migration)

Ajouts sur `marcheur_observations` :
- `source` text — valeurs : `'inaturalist'`, `'manual_mdv'`, `'walker_upload'`, `'editorial'`. Backfill : `inaturalist_observation_id IS NOT NULL` → `'inaturalist'`, sinon `'walker_upload'`.
- `curated_by_user_id` uuid → `auth.users(id)` (nullable)
- `curated_at` timestamptz
- `source_media_id` uuid → `marcheur_medias(id)` (lien direct photo source)
- `ai_confidence` numeric(4,3) — confiance IA au moment de la validation (audit)
- `taxon_common_name_fr` text — évite re-fetch FR
- `kingdom` text, `iconic_taxon` text — alimente tags éco + chaîne trophique sans nouveau fetch
- Index : `(source)`, `(curated_by_user_id)`, `(source_media_id)`

## 2. RPC `get_curation_media_context(p_media_id uuid)` (SECURITY DEFINER, admin only)

Retourne en un seul aller-retour tout ce dont le drawer a besoin :
- Photo : url, gps (lat/lng/altitude/source exif|manual), date_taken
- Marche : id, nom, date, latitude/longitude centre, rayon, **distance photo↔centre en mètres**, flag `out_of_radius`
- Marcheurs candidats : liste des participants validés de la marche `[{user_id, display_name, avatar_url, slug}]`
- Marcheur déjà attribué (si `attributed_marcheur_id`)
- Impact préview : `{species_already_in_marche: bool, current_obs_count_for_species: int, will_trigger_eco_tags: bool}`

## 3. Edge function `curate-marcheur-photo` (refonte)

Body étendu :
```ts
{ mediaId, action: 'validate'|'unidentifiable',
  scientificName, commonNameFr, kingdom, iconicTaxon, aiConfidence,
  marcheurUserId,  // OBLIGATOIRE si action='validate'
  marcheId         // override optionnel
}
```

Logique `validate` :
1. Refuse si `marcheurUserId` manquant (400 `marcheur_required`).
2. Résout `marcheur_id` via `ensure_exploration_marcheur(marcheurUserId, exploration_id)`.
3. Calcule distance photo↔marche, warning serveur si > 500 m (n'empêche pas, mais log).
4. Insert `marcheur_observations` avec `source='manual_mdv'`, `curated_by_user_id=auth.uid()`, `curated_at=now()`, `source_media_id=mediaId`, `ai_confidence`, `kingdom`, `iconic_taxon`, `taxon_common_name_fr`, lat/lng/gps_source, notes propre.
5. Met à jour `marcheur_medias.attributed_marcheur_id` + `ai_status='validated_by_human'`.
6. Trigger backfill éco-tags si nouvelle espèce.

Mode batch : pareil mais exige soit un marcheur global soit fallback "curateur" (ré-confirmé côté UI).

## 4. UI — Drawer `DetailContent` (refonte)

Nouveau layout en 4 blocs :

```text
┌────────────────────────────────────────────┐
│ [Photo zoomable]                           │
├────────────────────────────────────────────┤
│ 📍 MARCHE                                  │
│ • Nom + date + bouton "voir fiche"         │
│ • Mini-carte 200px : photo + tracé marche  │
│ • Distance : 142 m du tracé ✓              │
│   (ou ⚠️ "Hors rayon : 720 m" en orange)   │
│ • Coords : 48.8286, 0.0195 · alt 182m      │
│ • Source GPS : EXIF appareil               │
├────────────────────────────────────────────┤
│ 👤 MARCHEUR ATTRIBUÉ *                     │
│ [Dropdown participants marche]             │
│   ⚠️ "Sélection obligatoire"               │
│ Avatar + nom du choisi                     │
├────────────────────────────────────────────┤
│ ✨ SUGGESTIONS IA (cliquables)              │
│   • Ail des ours · Allium ursinum · 95%    │
├────────────────────────────────────────────┤
│ 📊 APERÇU IMPACT (avant Valider)           │
│ ✓ Créera "Ail des ours" dans Marche X      │
│   (1ère observation → +1 espèce marche)    │
│ ✓ Attribuée à : Vincent Levavasseur        │
│ ✓ Déclenche classif éco-tags (plante)      │
│ ✓ Source : Identification manuelle MdV     │
├────────────────────────────────────────────┤
│ [Valider l'identification] (vert, désactivé│
│  tant que marcheur non choisi)             │
│ [Non identifiable]  [Relancer IA]          │
└────────────────────────────────────────────┘
```

Popup carte allégé : ajoute ligne « Marche : *nom* · 142 m » + « Marcheur : *nom ou Non attribué* » sous le badge.

Row liste : ajoute pastille marche (couleur) + icône warning si hors rayon.

## 5. Mode batch « Valider top-1 »

Modal de confirmation avant exécution :
- Affiche le nombre par marche
- Liste les photos sans `attributed_marcheur_id` → impose un choix global :
  - « Attribuer au curateur » (auth.uid)
  - « Attribuer marcheur par marche » (sélecteurs par marche)
  - Annuler
- Affiche le nombre de photos hors rayon en warning

## 6. Distinguer le flux côté lecture

- Hook `useExplorationSpeciesCount` : aucun changement (les obs `manual_mdv` sont déjà comptées).
- Badge « Identification manuelle MdV » visible dans la fiche espèce (carrousel + détail obs).
- Filtre admin « Source » dans la liste des observations.

## 7. Mémoire

Ajout `mem://features/admin/manual-mdv-curation-logic` : "Validation IA manuelle = source='manual_mdv', marcheur_id obligatoire, curated_by tracé, source_media_id lié, distance photo↔marche warning >500m".

## Fichiers touchés

- Migration SQL (colonnes + index + RPC `get_curation_media_context`)
- `supabase/functions/curate-marcheur-photo/index.ts` (validation marcheur obligatoire, source='manual_mdv', remplissage taxonomie)
- `src/hooks/useAiCurationMedias.ts` (joint le contexte minimal : nom marche, distance)
- `src/hooks/useCurationMediaContext.ts` (nouveau, appelle la RPC)
- `src/components/admin/marche-events/ai-recognition/AiCurationMapView.tsx` (drawer + popup + row enrichis, modal batch)
- Mémoire projet

## Hors scope

- Pas de modification du flux iNaturalist existant.
- Pas de re-déclenchement de la classification éco-tags ici (déjà géré par triggers existants côté insert `marcheur_observations`).
