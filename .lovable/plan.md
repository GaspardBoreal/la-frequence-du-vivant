## Contexte

L'onglet **J'identifie** actuel (`TabIdentify.tsx`) est un simple check-list de 6 « enjeux vivants ». Il ne reflète pas la Méthode D.S. Le PDF (pages 9-13) définit une démarche pro : cocher les plantes bio-indicatrices, calculer l'intensité des indices EAU/TEXTURE/NUTRITION/pH, comparer avec l'étape 2 (sol), et produire un **Indice de Cohérence Globale (ICG /100)**.

## Objectif

Reproduire fidèlement l'Étape 3 dans le même carnet crème/vert forêt/or que les étapes 1 & 2, avec pictos botaniques SVG dessinés main (aquarelle animée), et calculs automatiques.

## Écran d'entrée : porte optionnelle (page 13)

Bandeau discret en haut de l'onglet — 2 cartes horizontales :
- **Oui, je poursuis** (diagnostic renforcé) → déroule les 5 blocs.
- **Passer cette étape** → collapse tout, badge « Étape sautée » et bouton « Reprendre plus tard ».

Choix mémorisé (autosave `skip_bioindication bool`).

## Les 5 blocs à construire

**1. Le cortège floristique (35 plantes bio-indicatrices)**
Grille responsive de vignettes cochables regroupées en 4 familles avec compteurs :
- **Herbacées (15)** · Ortie, Épilobe, Pissenlit, Gaillet, Achillée, Renoncule, Lamier, Bardane, Trèfle, Consoude, Thym serpolet, Lotier, Carotte sauv., Sénéçon, Oseille.
- **Arbustes (10)** · Sureau, Cornouiller sanguin, Poirier cœur, Troène, Cytise, Cornouiller mâle, Camérisier, Églantier, Genêt, Callune.
- **Lianes/grimpantes (5)** · Lierre, Clématite, Houblon, Liseron, Ronce.
- **Arbres (5)** · Saule blanc, Sorbier, Frêne, Châtaignier, Peuplier tremble.

Chaque vignette : mini-picto SVG botanique (silhouette feuille dessinée main), nom scientifique italique + nom vernaculaire, tap = check + micro-animation « feuille qui bruisse ». Bouton flottant « + Ajouter via PlantNet » (deep-link `plantnet://` mobile, fallback lien web) — pas de scan intégré (hors scope).

Compteur global : « 12 / 35 plantes observées ».

**2. Ce que racontent les plantes — Intensité des indices (page 11)**
Auto-calculé à partir des plantes cochées. Table des scores écologiques via `computeIndicatorScores(selectedPlants)` qui somme les valeurs (● =1, ●● =2, ●●● =3) issues d'une constante `PLANT_INDICATOR_KB` (transcrite du tableau page 10).

Affichage : 8 lignes (EAU frais/sec, TEXTURE limono-sableux/argilo-limoneux, NUTRITION riche/pauvre, pH acide/calcaire), chacune une **jauge horizontale segmentée** 0→30+ avec :
- Palette dégradée bleu clair (faible) → vert profond (fort).
- Curseur goutte/feuille SVG animé à la position exacte.
- Badge auto « Très faible / Faible / Moyen / Fort / Très fort ».

**3. Conclusion de la flore (page 11 bas)**
Phrase auto-générée éditable : *« D'après la flore observée, le sol serait [texture] à tendance [pH], plutôt [nutrition] et [eau]. »* — récap chips cliquables des tendances dominantes.

**4. Comparaison avec l'étape 2 — Concordance sol/flore (page 12)**
Tableau 4 critères × 2 niveaux (8 lignes), 3 colonnes de résultat :
- Colonne « Sol » (Faible/Moyen/Fort auto depuis `usePropertySoil` : texture/structure/pH/vitalité mappés).
- Colonne « Flore » (Faible/Moyen/Fort auto depuis bloc 2).
- Colonne « Concordance » : pastille cliquable Oui (●, vert) / Partiel (◐, or) / Non (○, sépia). L'utilisateur peut ajuster manuellement.

Design : chaque ligne = mini-carte crème avec picto critère à gauche (goutte, motte, épi, réglette pH).

**5. Indice de Cohérence Globale (ICG /100)**
Cercle SVG animé (compteur qui tourne), formule : `ICG = (score/16) * 100` avec Oui=2, Partiel=1, Non=0.

Badge sémantique :
- **80-100** → « Bonne cohérence » (vert forêt).
- **60-79** → « Cohérence moyenne » (or).
- **0-59** → « Faible cohérence » (sépia + encart conseil « Reprenez vos observations : prélèvements, autres zones, contexte »).

## Design system (aligné étapes 1 & 2)

- `AnalyzeCard`-like wrapper renommé `IdentifyCard` (mêmes tokens `--ds-cream`, `--ds-forest`, `--ds-gold`).
- Header étape avec `<StepHeader current={3} />` (les points 1-2-3 remplis).
- Illustration hero botanique 16/7 par bloc (aquarelle).
- Compteur `x / 5 blocs renseignés` + badge « Terminée le JJ/MM » identique aux étapes 1-2.
- Bouton « Marquer l'étape comme terminée » : même variante blanche au repos.

## Pictos wahouh (SVG maison, `src/components/propriete/identify/pictos/`)

- `PlantLeafSet.tsx` : 35 silhouettes de feuilles distinctives dessinées main (trait sépia, remplissage aquarelle vert au hover/selected). Micro-animation `pathLength` Framer Motion.
- `CriteriaIconSet.tsx` : goutte EAU, motte TEXTURE, épi NUTRITION, réglette pH — dessinés cohérents avec ceux de l'étape 2.
- `ConcordanceBadges.tsx` : cercle plein / demi / vide, animation morph au clic.
- `ICGRing.tsx` : cercle SVG progressif, feuille au bout du tracé.

Palette limitée : sépia `#3a2f28`, vert forêt `#2f5d3a`, or `#c9a24b`, crème `#f7f3ea`.

## Persistance

Nouvelle table **`propriete_flora_diagnostics`** (une ligne par propriété) :
- `skip_bioindication bool default false`
- `observed_plants text[]` (slugs plantes)
- `flora_conclusion text`
- `concordance jsonb` (8 clés → 'oui' | 'partiel' | 'non')
- `icg_score int`
- `completed_at timestamptz`
- RLS via même règle que `propriete_soil_diagnostics`.

RPC `upsert_propriete_flora(...)` SECURITY DEFINER, autosave debounced.

Hook `usePropertyFlora.ts` calqué sur `usePropertySoil.ts` : `state / setField / togglePlant / setConcordance / persist / markComplete`.

## Découpage fichiers

**Nouveaux**
- `src/lib/plantIndicatorKb.ts` — 35 plantes + valeurs indicatrices (transcription page 10) + helpers `computeIndicatorScores`, `computeFloraConclusion`, `computeConcordance`, `computeICG`.
- `src/components/propriete/identify/pictos/PlantLeafSet.tsx`
- `src/components/propriete/identify/pictos/CriteriaIconSet.tsx`
- `src/components/propriete/identify/pictos/ConcordanceBadges.tsx`
- `src/components/propriete/identify/pictos/ICGRing.tsx`
- `src/components/propriete/identify/IdentifyCard.tsx`
- `src/components/propriete/identify/PlantTile.tsx`
- `src/components/propriete/identify/blocks/BlockOptIn.tsx`
- `src/components/propriete/identify/blocks/BlockCortege.tsx`
- `src/components/propriete/identify/blocks/BlockIntensites.tsx`
- `src/components/propriete/identify/blocks/BlockConclusion.tsx`
- `src/components/propriete/identify/blocks/BlockConcordance.tsx`
- `src/components/propriete/identify/blocks/BlockICG.tsx`
- `src/hooks/propriete/usePropertyFlora.ts`
- Migration SQL : table + RPC + grants + RLS + trigger updated_at.

**Modifiés**
- `src/components/propriete/tabs/TabIdentify.tsx` : devient orchestrateur des 5 blocs + porte d'entrée + synthèse + progression `x/5`. Conserve `BiodiversityEvidenceBlock` en tête (bloc « Ce que la Fréquence sait déjà »).
- `src/pages/ProprieteEspace.tsx` : passe `soil` (état étape 2) en prop de `TabIdentify` pour la comparaison bloc 4.

## Détails techniques

- Jauges intensités : SVG segmenté 7 crans, curseur `motion.g` transition spring.
- `BlockCortege` : `useMemo` sur familles + collapsible par famille, compteur live.
- `BlockConcordance` : lecture directe de `usePropertySoil.state` (déjà passé en prop) + résultats bloc 2 → colonne Sol/Flore auto-calculées, override manuel possible.
- `BlockICG` : animation `motion.circle` `strokeDashoffset` sur `whileInView`.
- Tokens design déjà en place (index.css). Aucun changement global.

## Hors scope

- Intégration scan PlantNet directe (renvoi vers l'app externe uniquement).
- Étape 4 « Je synthétise » — traitée dans un prochain lot.
- Édition manuelle de la KB des plantes (constante en dur, V2 admin).
