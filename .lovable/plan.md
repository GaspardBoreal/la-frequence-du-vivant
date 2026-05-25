# Diagnostic — ce qui marche déjà / ce qui manque

## Comment valider aujourd'hui (peu visible)
Dans le drawer « Curation photo », la zone **« Suggestions IA »** liste les propositions (ex : *Ail des ours – 95 % – gemini*). **Chaque carte de suggestion EST le bouton de validation** : un clic sur la carte valide cette identification. Il n'y a pas de CTA explicite « Valider », ce qui explique ta confusion.

Le clic est désactivé tant que le marcheur n'est pas sélectionné.

## Ce qui est créé à la validation (déjà OK)
L'edge function `curate-marcheur-photo` insère une ligne dans `marcheur_observations` avec :
- `source = 'manual_mdv'`
- `notes` préfixées par « Identification manuelle Marches Du Vivant — {nom FR} »
- `species_scientific_name`, `taxon_common_name_fr`, `kingdom`, `latitude`, `longitude`, `gps_source`, `marche_id`, `observation_date`, `photo_url`
- `curated_by_user_id`, `curated_at`, `source_media_id`, `ai_confidence`
- `marcheur_id` = participant sélectionné (via `ensure_exploration_marcheur`)

Puis la photo passe en `ai_status = validated_by_human`.

→ L'observation apparaît immédiatement dans la liste d'espèces de la marche, sur la carte, dans la synthèse, le carnet du marcheur, le Pack Vivant, etc.

## Ce qui manque pour que TOUT fonctionne
1. **CTA manquant** : pas de bouton « Valider » explicite, juste la carte cliquable.
2. **`iconic_taxon` toujours NULL** : la table `marcheur_photo_ai_suggestions` ne stocke pas `iconic_taxon` (uniquement `kingdom`). Conséquence :
   - Trophiques *Plantae / Fungi / Chromista* → OK (le kingdom suffit, classification heuristique).
   - Trophiques *Animalia* → dégradés : la chaîne trophique tombe sur le fallback générique faute d'`iconic_taxon` (Aves / Insecta / Mammalia…).
3. **Aucun aperçu d'impact** dans le drawer (le RPC renvoie déjà `impact.species_already_in_marche` et `current_obs_count_for_species`, mais l'UI ne l'affiche pas).

# Plan de correction (UI + enrichissement post-validation)

## 1. UI drawer — Validation explicite
Dans `src/components/admin/marche-events/ai-recognition/AiCurationMapView.tsx`, dans `DetailContent` :

- Garder les cartes de suggestion cliquables, mais **ajouter au-dessus du bloc une mini-aide** : « Cliquez sur une suggestion pour la valider, ou utilisez le bouton ci-dessous ».
- **Ajouter une section finale « Action »** avec :
  - Bouton primaire **« ✓ Valider l'identification top-1 »** (vert, full width) — utilise `useTopSuggestion=true`, désactivé sans marcheur.
  - Sous-texte d'impact : « Créera *Allium ursinum* (Ail des ours) dans *Prairie humide* — 0 obs existante. Source : Identification manuelle Marches Du Vivant. Marcheur : Vincent Levavasseur. »
  - Construit à partir de `ctx.top_suggestion`, `ctx.marche.nom_marche`, `ctx.impact.current_obs_count_for_species` et `selectedCandidate.display_name`.
- Renommer visuellement les cartes de suggestion en ajoutant une icône ✓ au survol pour signaler qu'elles sont validables.

## 2. Enrichissement `iconic_taxon` côté edge function
Dans `supabase/functions/curate-marcheur-photo/index.ts`, après détermination du `sci` et avant l'INSERT :

- Si `iconic_taxon` est NULL, **interroger l'API iNaturalist taxa** (`/v1/taxa?q={sci}&rank=species`) — déjà utilisé ailleurs dans le projet.
- Récupérer `iconic_taxon_name` du premier résultat correspondant.
- Persister dans la nouvelle observation. En cas d'échec API, laisser NULL et marquer en notes pour backfill ultérieur.
- Fallback dérivé du kingdom si iNat ne répond pas :
  - `Plantae` → `Plantae`
  - `Fungi` → `Fungi`
  - `Animalia` sans détail → laisser NULL (à backfill plus tard, ne pas mentir)

## 3. (Optionnel, hors scope si tu préfères) Réutiliser le backfill existant
La fonction `backfill-snapshots-taxonomy` existe déjà pour combler `iconic_taxon` rétro­actif­ement sur les snapshots. On pourrait l'appeler en `fire-and-forget` après chaque validation manuelle pour aligner aussi les obs MdV. À confirmer.

# Fichiers modifiés
- `src/components/admin/marche-events/ai-recognition/AiCurationMapView.tsx` (UI : CTA + preview impact)
- `supabase/functions/curate-marcheur-photo/index.ts` (lookup iNat → `iconic_taxon`)

# Validation
1. Recharger la carte de curation, ouvrir « Ail des ours ».
2. Choisir « Vincent Levavasseur ».
3. Voir le nouveau bouton vert « ✓ Valider l'identification top-1 » + le résumé d'impact.
4. Cliquer → toast « Identification validée ».
5. Aller dans l'onglet *Espèces* de l'événement : *Ail des ours* apparaît avec source MdV.
6. Aller dans la chaîne trophique : positionné en L1 (producteur primaire) ✅.
