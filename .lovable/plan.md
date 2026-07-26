## Ce que dit le document (p. 9 → 13) vs. ce qui existe

Vérifié dans le PDF et dans le code (`src/lib/plantIndicatorKb.ts`, `src/components/propriete/identify/blocks/*`, `TabIdentify.tsx`) :

| Document | État actuel |
|---|---|
| p.9 Objectif de l'étape + cortège 15 herbacées / 10 arbustes / 5 lianes / 5 arbres + encart « Identification par photo (PlantNet) » | Pas d'encart objectif ni de conseil photo. Le KB contient 40 plantes **qui ne correspondent pas** à la liste du document (ex. manquent Épilobe hérissé, Gaillet gratteron, Lamier blanc, Grande bardane, Thym serpolet, Lotier corniculé, Carotte sauvage, Séneçon de Jacob, Poirier à feuilles en cœur, Troène, Cytise, Cornouiller mâle, Camérisier, Églantier, Liseron des haies, Sorbier, Peuplier tremble…) |
| p.10 Tableau de lecture : lignes = plantes, colonnes = Eau (Frais/humide, Sec), Texture (Limoneux/Sableux, Argileux/Limoneux), Nutrition (Riche, Pauvre), pH (Acide, Calcaire) — pastilles d'intensité forte / moyenne / faible / neutre + 3 encarts « Comment lire », « Comment utiliser », « À retenir » + source CNPF | Aucun tableau. Seulement une grille de vignettes à cocher |
| p.11 Somme des indices (forte=3, moyenne=2, faible=1) par critère → barre 5 niveaux (Très faible → Très fort) + conclusion rédigée | Barres bipolaires en moyenne −3..+3, pas de points cumulés ni d'échelle 5 niveaux |
| p.12 Concordance sol/flore : 4 critères × 2 niveaux = 8 lignes, OUI 2 / PARTIEL 1 / NON 0, ICG = score ÷ 16 × 100 + guide de lecture + « En cas de faible cohérence » | ICG existe mais sur 4 axes (÷8) et sans guide de lecture ni encart de remédiation |

## Plan

### 1. Refonte du référentiel flore (`src/lib/plantIndicatorKb.ts`)
- Reconstituer les **35 plantes du document** (15/10/5/5) avec leurs noms latins exacts, comme liste canonique.
- Passer d'un score signé unique par axe à la **grille du document** : pour chaque plante, 8 colonnes (`eau_frais`, `eau_sec`, `tex_limon_sable`, `tex_argile_limon`, `nutri_riche`, `nutri_pauvre`, `ph_acide`, `ph_calcaire`) avec une intensité `0 | 1 | 2 | 3` (neutre / faible / moyenne / forte), valeurs dérivées de la Flore forestière française (CNPF 2018).
- Conserver les plantes existantes hors liste dans un bloc `PLANT_INDICATORS_EXTRA` (« Compléments régionaux »), affiché après le cortège officiel, pour ne rien perdre des cochages déjà enregistrés.
- Compat : garder `computeFloraProfile`/`computeConcordance` en les recalculant depuis la nouvelle grille (les axes signés restent dérivables), afin de ne pas casser l'onglet Synthèse ni `icg_score` en base.

### 2. Nouveau bloc 0 — « Ce que vous allez faire » (`IdentifyBriefBlock.tsx`)
Panneau d'ouverture éditorial, plein largeur : objectif de l'étape (lire les plantes présentes, valider ou nuancer l'étape 2), 3 gestes numérotés (Repérer → Cocher → Lire les tendances), encart latéral « Identification par photo » (PlantNet, optionnel) avec les conseils du document, et rappel « aucune plante ne donne une réponse unique ».

### 3. Bloc « Tableau de lecture écologique » (nouveau `EcoMatrixBlock.tsx`)
- Tableau plein largeur, groupé par famille (Herbacées / Arbustes / Lianes / Arbres) avec en-têtes de groupe collants.
- Colonne 1 : case à cocher + nom français + latin (+ pastille « vu par les marcheurs » réutilisant `usePropertyFloraMatched`).
- 8 colonnes d'indication, chacune rendue par une **pastille d'intensité** (disque plein / demi / anneau / vide) colorée par famille de critère : Eau bleu-vert, Texture terre, Nutrition or, pH violet/craie.
- Lignes cochées surlignées et remontées visuellement ; les colonnes majoritaires du cortège coché s'**illuminent en temps réel** (halo + compteur en pied de colonne), ce qui rend concret le « repérez les colonnes où les points sont majoritaires ».
- Mobile : bascule automatique en cartes empilées (une carte par plante, 8 pastilles en grille 4×2) — pas de scroll horizontal forcé.
- Encarts pédagogiques latéraux, reprenant mot pour mot les 3 blocs du document (« Comment lire ce tableau ? », « Comment utiliser ce tableau ? », « À retenir ») + légende d'intensité.
- Recherche et filtres famille conservés depuis `CortegeBlock` (celui-ci devient le mode « vignettes » toggleable — Tableau / Vignettes — pour garder les photos marcheurs).

### 4. Bloc « Ce que racontent les plantes observées » (refonte `IntensitiesBlock.tsx`)
- Pour chaque critère : **somme des points** du cortège coché, avec le détail (`n plantes × intensité`), et la barre 5 niveaux du document (Très faible / Faible / Moyen / Fort / Très fort) en dégradé, remplie par animation.
- Affichage par paire d'opposés (Frais/humide vs Sec, etc.) : deux barres face à face révélant la dominante, plus un verdict textuel (« Humidité du sol : 18 points · Niveau : Fort »).
- Bandeau de synthèse en tête : phrase auto-générée « D'après la flore en place, le sol serait … », copiable d'un clic dans la conclusion.
- Seuils de niveaux calculés relativement au nombre de plantes cochées (score max théorique), pour rester juste avec 3 ou 30 plantes.

### 5. Bloc « Comparaison avec l'Étape 2 » (refonte `ConcordanceBlock.tsx`)
- Tableau à 3 colonnes du document : Critère · Résultat Étape 2 (le sol) · Résultat Étape 3 (la flore) · Concordance, décliné sur les **8 lignes** (4 critères × 2 niveaux).
- Barème conforme : OUI 2 / PARTIEL 1 / NON 0, **ICG = score ÷ 16 × 100**, affiché dans l'anneau `IcgRing` existant avec le calcul déplié (« 6 oui, 1 partiel, 1 non = 13 → 81 »).
- Guide de lecture OUI / PARTIEL / NON et encart « En cas de faible cohérence » (les 3 actions du document), affiché en surbrillance quand ICG < 50.
- `computeConcordance` étendu pour produire les 8 lignes ; `icg_score` continue d'être persisté via `usePropertyFlora`.

### 6. Conclusion & sources
- `NarrativeBlock` : ajout du texte d'amorce du document et du rappel « il n'y a pas d'exactitude… », plus insertion de la phrase auto-générée.
- Nouveau pied de section **Sources**, affiché sous le tableau et repris en pied de l'impression : « Source des données écologiques : CNPF — 2018 — G. Dumé ; C. Gauberville ; D. Mansion ; J.-C. Rameau — *Flore forestière française — Guide écologique illustré — 1 Plaines et Collines* ».

### 7. Direction artistique
Continuité D.S. (crème / sépia / vert forêt / or) mais **plus colorée** sur cette étape : chaque critère écologique reçoit sa teinte propre (tokens `--ds-eco-eau`, `--ds-eco-texture`, `--ds-eco-nutri`, `--ds-eco-ph` ajoutés à `index.css`), utilisée pour les pastilles, les barres et les halos de colonne. Animations `framer-motion` : révélation en cascade des pastilles, pulsation douce des colonnes dominantes, remplissage progressif des barres.

### Détails techniques
- Fichiers modifiés : `src/lib/plantIndicatorKb.ts`, `src/components/propriete/tabs/TabIdentify.tsx`, `blocks/CortegeBlock.tsx`, `blocks/IntensitiesBlock.tsx`, `blocks/ConcordanceBlock.tsx`, `blocks/NarrativeBlock.tsx`, `src/lib/plantIndicatorMatcher.ts` (mapping sur la nouvelle liste), `src/index.css` (tokens critères).
- Fichiers créés : `blocks/IdentifyBriefBlock.tsx`, `blocks/EcoMatrixBlock.tsx`, `identify/EcoDot.tsx` (pastille d'intensité), `identify/EcoSourceNote.tsx`.
- Aucune migration : les données restent dans `propriete_flora_diagnostics` (`observed_plants text[]`, `concordance jsonb`, `icg_score`). Les ids de plantes conservés sont réutilisés tels quels ; les nouveaux ids suivent la même convention slug.
- Compteur de blocs de l'étape mis à jour (TOTAL passe de 4 à 5 avec le tableau).
