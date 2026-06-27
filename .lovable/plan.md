## Diagnostic

**1) Ordre/libellés "illogiques" sur Colza**
Le référentiel `src/lib/bbchStages.ts` ne définit que 4 stades spécifiques au Colza (5→8). Les 6 autres (0,1,2,3,4,9) retombent sur `GENERIC_STAGES` qui contient des libellés céréaliers — d'où l'apparition de **« Talles / pousses latérales »** et **« Élongation de la tige »** entre la levée et les boutons. L'ordre 0→9 est correct, mais ces étiquettes ne s'appliquent pas au colza : c'est ça qui paraît incohérent.

**2) Pas de suggestion IA**
Dans `SpeciesGalleryDetailModal.tsx` (l. 363), `<PhenoCtaButton>` est instancié sans `photoUrl`, `latitude/longitude` ni `marcheId`. Or dans `PhenoStageSelector`, tout le bandeau IA est gardé par `{photoUrl && …}`. Sans photo → pas de lecture multimodale → pas de recommandation.

## Plan de résolution

### Étape 1 — Référentiel BBCH complet par culture (libellés spécifiques 0→9)

Compléter `src/lib/bbchStages.ts` pour que chaque culture déjà listée définisse **les 10 stades** avec des libellés conformes à la version culture des échelles BBCH (INRAE/PPD-CR). Plus aucun fallback générique sur des plantes annuelles/pérennes connues.

- **Colza** : 0 Germination · 1 Levée / cotylédons · 2 Formation de la rosette · 3 Élongation de la tige · 4 *(non utilisé en colza — masqué)* · 5 Boutons accolés · 6 Floraison · 7 Formation des siliques · 8 Maturation · 9 Sénescence / récolte
- Même travail pour : Vigne, Blé, Maïs, Tournesol, Féverole, Betterave, Olivier, Cerisier, Prunier, Pêcher, Pommier (+ générique pour les autres).
- Ajouter un flag optionnel `na?: true` sur un stade → la tuile s'affiche grisée « non applicable » et n'est pas sélectionnable. Permet de respecter la numérotation BBCH officielle sans induire en erreur (ex. colza n'utilise pas le 4).
- `getStagesForCrop` retourne toujours les 10 stades dans l'ordre 0→9 (préservé), avec le bon libellé culture.

### Étape 2 — Brancher la suggestion IA depuis la fiche espèce

Dans `SpeciesGalleryDetailModal.tsx`, transmettre à `<PhenoCtaButton>` :
- `photoUrl` : meilleure photo disponible (cover de la fiche, sinon 1ʳᵉ photo marcheur).
- `latitude` / `longitude` : si présentes sur l'observation.
- `marcheId` : marche en contexte.

Aucune modif d'API : le drawer affichera automatiquement le bandeau "Lecture de la photo en cours…" puis la suggestion (anneau ambre + bouton « Accepter la suggestion »), déjà câblés sur `useBbchStageSuggestion` / edge `suggest-bbch-stage`.

### Étape 3 — UX du selector

- Les tuiles `na` (stade non utilisé pour la culture) : opacité 40 %, libellé « — non applicable », `disabled`.
- Conserver le tri 0→9 sur 2 colonnes (lecture naturelle gauche→droite).
- Quand l'IA propose un stade `na` (cas improbable mais possible), fallback sur le stade adjacent et signaler "ajusté".

### Étape 4 — Vérification

- Ouvrir la fiche Colza sur la marche DEVIAT : ✅ libellés colza-spécifiques, ✅ stade 4 grisé, ✅ bandeau IA chargé puis suggestion affichée avec confiance.
- Vérifier une seconde culture (Vigne) pour valider le nouveau mapping.

## Détails techniques

**Fichiers modifiés**
- `src/lib/bbchStages.ts` — étend `BbchStageOverride` avec `na?: boolean`, complète `stages` 0→9 pour chaque culture.
- `src/components/phenologie/PhenoStageSelector.tsx` — gère l'état `disabled` des stades `na` (style + click).
- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — passe `photoUrl`, `latitude`, `longitude`, `marcheId` au `PhenoCtaButton` (utiliser les médias déjà chargés dans la modal).

**Aucun changement** d'edge function ni de schéma DB.
