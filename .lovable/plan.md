# Étape 4 · Je synthétise — le Portrait écologique du site

Aujourd'hui, l'onglet « Je synthétise » est un vestige : un encadré et un export PDF jsPDF de 4 lignes, totalement déconnecté des étapes 1, 2 et 3. On le remplace par la page 14 de la méthode D.S., rendue au niveau des trois étapes déjà construites (carnet scellé, cachet daté, impression A4 éditoriale).

## Ce qui a été vérifié dans les données de « Jardin Monde DEVIAT »

| Source | Valeur réelle |
|---|---|
| Étape 1 | 7 blocs remplis (campagne/autre, pentu, ombre arbre+haie, brise-vent haie+bâtiment, sec + gouttière, végétation dense, ombre permanente + sécheresse), 5 champs sensoriels, intensité 3, scellée le 26/07 |
| Étape 2 | terrain naturel, 5 prélèvements A→E géolocalisés, structure grumeleuse, texture limon (A, C, E), pH 8 (B), 4 indices de vie, scellée le 24/07 |
| Étape 3 | 19 plantes bio-indicatrices, ICG 63 %, fiabilité 75 %, narration IA rédigée, scellée le 28/07 |

**Deux anomalies confirmées, à corriger dans ce chantier :**

1. `soilPoleValue()` (`src/lib/plantIndicatorKb.ts:430`) n'accepte que `sable_limon | limon_moyen | limon_argile`, alors que la base contient `texture = "limoneux"` et des prélèvements `texture_result = "limon"`. Résultat : les deux lignes Texture de la concordance sortent en « Donnée manquante », l'ICG est plafonné à 63 % et la fiabilité à 75 % alors que la donnée existe.
2. L'étape 2 calcule ses dominantes à partir des **prélèvements** (`soilReading.ts`), l'étape 3 lit les **champs globaux hérités**. Deux sources de vérité pour le même sol — la synthèse ne peut pas s'appuyer là-dessus.

## Ce qui sera construit

### 1. Une source de vérité unique pour le sol
- Nouveau `src/lib/soilLiteFromState.ts` : convertit un `PropertySoilState` en `SoilLite` en privilégiant la dominante calculée sur les prélèvements, avec repli sur les champs globaux, et normalise les libellés (`limon`/`limoneux` → `limon_moyen`, `argile` → `limon_argile`, `sable` → `sable_limon`).
- `soilPoleValue()` accepte désormais les deux vocabulaires, plus l'humidité et la structure dominantes.
- Étapes 3, 4 et impressions consomment ce convertisseur. Effet mesuré sur DEVIAT : les 2 lignes Texture deviennent évaluables, fiabilité 100 %, ICG recalculé et ré-enregistré à la réouverture de l'étape 3.

### 2. L'écran « Je synthétise »
Structure fidèle à la page 14, dans la charte carnet (crème / forêt / or) déjà en place :

- **En-tête** — `StepHeader` « Étape 4 / 5 · 80 % », objectif de la méthode, état d'avancement des 3 étapes amont (pastilles scellé / en cours / non commencé).
- **Bloc 01 · Le contexte du site** *(lu de l'étape 1)* — situation, relief, ombres portées, brise-vent, eau, particularités et notes, en pastilles ; plus **trois sélecteurs à remplir ici** : Exposition (soleil / mi-ombre / ombre), Vent (faible / moyen / fort), Humidité dominante (sec / frais / humide), chacun accompagné d'une suggestion déduite (« d'après vos observations : mi-ombre ») acceptable en un clic.
- **Bloc 02 · Le fonctionnement du sol** *(lu de l'étape 2)* — nature du terrain, structure, texture, pH sur réglette graduée, activité biologique en jauge 5 crans, humidité ; chaque valeur indique sur combien de prélèvements elle repose.
- **Bloc 03 · Validation par la flore** *(lu de l'étape 3)* — réalisée / passée, les 3 axes Eau · Texture · Nutrition, anneau ICG /100 et bandeau Bonne / Moyenne / Faible. Si l'étape 3 est passée, mention explicite « ICG non calculé » conforme à la méthode.
- **Bloc 04 · Atouts, contraintes, points de vigilance** — trois colonnes éditables (ajout / suppression / réordonnancement), pré-remplies par l'IA à partir de l'intégralité des étapes 1-3, chaque item conservant sa justification (« pente + sécheresse relevée en étape 1 »). Bouton « Régénérer » et édition libre à tout moment.
- **La Carte d'identité écologique** — pièce maîtresse plein cadre : une phrase-portrait composée automatiquement, six cartouches clés (contexte, relief, sol, pH, vie, ICG) et une signature graphique du site dérivée des valeurs, dans l'esprit du `SiteSignature` de l'étape 1.
- **Rituel de scellement** — « Synthèse verrouillée · prête pour le rapport client », cachet daté, boutons Imprimer et Rouvrir en édition, identiques aux étapes 1-3.

### 3. Impression
- Ajout de `'synthesize'` à `PrintChoiceDialog` avec sa vignette aquarelle et deux options :
  - **Synthèse seule** — 2 pages A4 : page de garde (titre, propriété, commune, date, citation « Un bon diagnostic ne consiste pas à accumuler des observations, mais à les relier entre elles ») + page de synthèse (les 4 blocs + carte d'identité).
  - **Cahier complet** — la synthèse devient la 4ᵉ partie, après « J'identifie », avec sa page de séparation Étape 4 dans le même gabarit que les étapes 1 à 3, et le compteur de pages du sommaire mis à jour.
- Réutilise `usePrintCombined` et `PrintPreparationOverlay` (progression, reprise des images).

## Détails techniques

- **Nouvelle table `public.propriete_synthesis`** : `propriete_id` unique, `exposure`, `wind_level`, `humidity` (texte), `atouts`, `contraintes`, `vigilances` (jsonb), `portrait` (texte), `notes`, `completed_at`, horodatages + `updated_by`. GRANT `authenticated` / `service_role`, RLS alignée sur `can_access_propriete()` comme les tables sœurs, plus la RPC `upsert_propriete_synthesis` sur le modèle de `upsert_propriete_soil`.
- **Hook** `src/hooks/propriete/usePropertySynthesis.ts` : même patron que `usePropertySoil` (hydratation par propriété, autosave 1,5 s, `markComplete`).
- **Génération IA** : extension de l'edge function existante `propriete-diagnostic-narration` avec un mode `synthesis` renvoyant `{ atouts[], contraintes[], vigilances[], portrait }` en sortie structurée, alimenté par les états des étapes 1-3, l'ICG et la biodiversité mesurée. Modèle `google/gemini-3.6-flash` via Lovable AI (429 / 402 remontés dans l'UI).
- **Composants** : `TabSynthesize.tsx` réécrit, `synthesize/SynthesisSummary.tsx`, `synthesize/blocks/{ContextBlock,SoilBlock,FloraBlock,AssetsBlock,IdentityCard}.tsx`, `print/SynthesizePrintLayout.tsx`, plus l'insertion dans `CombinedPrintLayout`.
- **Suppression** : l'export jsPDF actuel de `TabSynthesize` disparaît au profit du flux d'impression A4 unifié.
- **Vérification finale** sur DEVIAT : contrôle que chaque valeur affichée en étape 4 correspond bien aux lignes lues en base, et que l'ICG recalculé est cohérent avec les 8 lignes de concordance.
