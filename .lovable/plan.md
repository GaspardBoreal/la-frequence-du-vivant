
## Contexte

L'onglet actuel **J'analyse** (`TabAnalyze.tsx`) se limite à un camembert des règnes — très éloigné de la Méthode D.S. Le document (pages 6-7-8) définit précisément l'**Étape 2 : J'analyse le sol**, structurée en **6 blocs** de diagnostic pédologique, avec pictos et raisonnements pros.

## Objectif

Reproduire fidèlement l'Étape 2 dans l'esprit du carnet de terrain déjà livré pour l'Étape 1 (cartes crème, badges vert forêt, illustrations aquarellées, autosave), en poussant les **pictos** à un niveau design/wahouh (SVG dessinés main, animés, pas d'emoji).

## Les 6 blocs à construire (fidèles au PDF)

**1. Le terrain a-t-il été remanié ?** — 5 pictos-choix radio :
   - Construction récente / Remanié
   - Remblai / Apport de terre
   - Décaissement important
   - Terrain naturel
   - Je ne sais pas
   *Note contextuelle "Cette information donne du poids à vos observations"*

**2. Où et combien de prélèvements ?** — Cartes A / B / C dynamiques (add/remove), chacune avec : localisation courte, photo optionnelle, note. Rappel visuel "Éviter bords, ombre, pied d'arbre".

**3. Structure du sol** (test de la bêche / stabilité) — 3 pictos-choix majeurs illustrés :
   - **Compacte** (motte dense, eau qui stagne)
   - **Grumeleuse** (agrégats, galeries de lombric — la cible)
   - **Particulaire** (motte qui s'effondre, eau trop rapide)
   *Chaque choix révèle une définition micro-texte du PDF.*

**4. Texture du sol** — Test du boudin illustré en 4 étapes (prélever / façonner / courber / lire), puis choix parmi 3 catégories illustrées :
   - Sable → limon sableux
   - Limon sableux → limon moyen
   - Limon argileux → argiles
   + micro-radio "boudin droit / lune / cercle" → teneur estimée en argile (10 % / 10–30 % / >30 %).

**5. pH du sol** — Slider chromatique unique 4 → 9 (acide rouge → neutre vert → basique bleu), curseur draggable, valeur numérique affichée en gros, badge auto ACIDE / NEUTRE / BASIQUE.

**6. Le sol est-il vivant ?** — Grille multi-check de 6 pictos animés (vers de terre, taupinière, racines fines, micro-faune, matière organique, test CO₂ optionnel). Compteur "Signes de vie détectés : n/6" avec jauge verte.

**Synthèse finale : « Ce que je commence à comprendre »** — 3 phrases auto-générées à partir des réponses (structure + texture + vivant), éditables.

## Design system (aligné Étape 1)

- Mêmes cartes crème `bg-observation-card`, badges `bg-observation-accent`, header animé, ratio illustration **16/7**.
- Compteur `x / 6 blocs renseignés` + badge vert « Terminée le JJ/MM » identique à Étape 1.
- Bouton « Marquer l'étape comme terminée » : même variante (fond vert forêt, texte blanc au repos).

## Pictos wahouh (le point critique du brief)

Créer un jeu de **pictos SVG maison** dans `src/components/propriete/observe/pictos/soil/` — trait fin encre sépia sur fond crème, remplissage aquarelle vert forêt à l'hover/selected, micro-animation (dessin de trait, pulsation légère). Pictos requis :

- `TerrainRemanieSet.tsx` : chantier, remblai (tas), pelleteuse, prairie, point d'interrogation.
- `StructureSet.tsx` : motte compacte, motte grumeleuse (avec vers), motte particulaire.
- `TextureSet.tsx` : boudin droit / lune / cercle + 4 étapes du test.
- `VieDuSolSet.tsx` : lombric, taupinière, racines, cloporte (micro-faune), tas humus, tube à essai CO₂.
- `PhScale.tsx` : réglette chromatique + goutte curseur.

Chaque picto ≈ 80–96 px, `strokeWidth` fin, palette limitée : sépia `#3a2f28`, vert forêt `#2f5d3a`, or `#c9a24b`, crème `#f7f3ea`.

## Persistance

- Table **`propriete_soil_diagnostics`** (une ligne par propriété) — champs typés :
  `terrain_status text`, `samples jsonb`, `structure text`, `texture text`, `boudin_shape text`, `ph numeric`, `life_signs text[]`, `synthesis text`, `completed_at timestamptz`, RLS `has_propriete_access`.
- RPC `upsert_propriete_soil(...)` (SECURITY DEFINER), autosave debounced comme Étape 1.
- Hook `usePropertySoil.ts` copié du modèle `usePropertyObservation.ts` (même contrat : `local`, `set`, `persist`, `markComplete`, toast succès/erreur).

## Découpage fichiers

**Nouveaux**
- `src/components/propriete/analyze/pictos/` (5 fichiers SVG ci-dessus).
- `src/components/propriete/analyze/AnalyzeCard.tsx` (wrapper carte façon `ObservationCard`).
- `src/components/propriete/analyze/blocks/` : `BlockRemaniement.tsx`, `BlockPrelevements.tsx`, `BlockStructure.tsx`, `BlockTexture.tsx`, `BlockPh.tsx`, `BlockVieDuSol.tsx`, `BlockSynthese.tsx`.
- `src/hooks/propriete/usePropertySoil.ts`.
- Migration SQL : table + RPC + grants + RLS.

**Modifiés**
- `src/components/propriete/tabs/TabAnalyze.tsx` : devient orchestrateur des 6 blocs + synthèse + progression `x/6`, header identique à `TabObserve`, KPI règnes existant repositionné en bas comme « Ce que la Fréquence sait déjà » (données de contexte, pas cœur de l'étape).

## Détails techniques

- Pictos animés via Framer Motion (`motion.svg` `pathLength` sur `whileInView`).
- `BlockPh` : slider custom (pas Radix) sur canvas SVG chromatique pour un rendu premium.
- `BlockPrelevements` : `useFieldArray`-like, max 5 prélèvements, drag-reorder optionnel V2.
- Synthèse auto : petite fonction pure `computeSoilSynthesis(soil)` retournant 3 phrases (structure / texture+ph / vitalité), utilisateur peut éditer par-dessus.
- Aucun changement design system global — tokens déjà en place depuis Étape 1.

## Hors scope

- Test de sédimentation détaillé (mentionné "optionnel" dans le PDF) — bouton "En savoir plus" ouvrant un drawer explicatif, mais pas de saisie dédiée.
- Étape 3 « J'identifie la flore » — traitée dans un prochain lot.
