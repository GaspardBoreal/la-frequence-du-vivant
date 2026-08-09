# Refonte de la concordance sol / flore en quatre curseurs

Chantier VDTP · P1 — Lisibilité et synthèse. Objectif : remplacer le tableau à 8 lignes par une lecture immédiate en quatre échelles à 5 crans, sans jargon, tout en conservant le détail pour les professionnels.

## Ce qu'on voit à l'écran

Un bloc « Ce que dit le site » ouvre désormais la concordance de l'Étape 3, avant tout tableau :

```text
EAU              sec  ·  ─────●───▲──  ·  frais et humide
                            sol   flore
NUTRITION        pauvre  ·  ──▲●─────  ·  riche
pH               acide  ·  ────●▲───  ·  calcaire
TEXTURE          « argilo-limoneux »
                 argile ████████░░ 60 %
                 limon  ████░░░░░░ 30 %
                 sable  █░░░░░░░░░ 10 %
                 d'après vos 4 prélèvements
```

- **Trois curseurs à 5 crans** (Eau, Nutrition, pH). Chaque curseur porte deux repères : la lecture du **sol** (Étape 2) et celle de la **flore** (Étape 3). L'écart entre les deux est matérialisé par un segment coloré : les deux voix se rejoignent, se frôlent, ou divergent.
- **La texture n'est plus un axe opposé** mais un libellé en toutes lettres (« argilo-limoneux », « limono-sableux »…) accompagné de trois jauges argile / limon / sable calculées à partir de la répartition des textures dominantes de vos prélèvements, avec la mention explicite du nombre de relevés qui la fonde.
- **Une phrase de synthèse** sous les curseurs, une seule, sans vocabulaire technique.
- **Aucun chiffre agronomique en premier rideau** : pas d'ICG, pas de points, pas de « /16 » tant qu'on n'a pas déplié.

## Ce qui passe derrière « Voir le détail »

Un dépliant discret, fermé par défaut, contient l'intégralité de l'existant, inchangé dans son calcul :
anneau ICG, bande de cohérence, indice de fiabilité, tableau des 8 lignes avec ses verdicts OUI / PARTIEL / NON, guide de lecture, remèdes en cas de faible cohérence, et note de source CNPF.

Rien n'est supprimé ni recalculé : la méthode D.S. (4 critères × 2 pôles = 16 points) reste la référence de l'ICG partout dans l'application.

## Où les curseurs apparaissent

1. **Étape 3 « J'identifie »** — en tête du bloc Concordance, à la place du tableau.
2. **Écran verrouillé de l'Étape 3** (la synthèse figée après validation) — même lecture.
3. **Onglet Synthèse** de la propriété.
4. **Impression** — planche des curseurs en tête de la page concordance ; le tableau détaillé conserve sa place en dessous.
5. **Chantier avant / après** — les mêmes curseurs en double lecture : repère « avant » et repère « projeté » sur la même échelle, en cohérence avec l'échelle ICG déjà présente.

## États

- **Chargement** : squelettes des quatre lignes de curseurs (pas de spinner plein écran).
- **Sol non renseigné** : les curseurs s'affichent avec le seul repère flore, le repère sol en pointillé et l'invitation à compléter l'Étape 2. Pas de faux zéro.
- **Aucune plante observée** : état vide explicite invitant à cocher le cortège.
- **Erreur de chargement** : message inline, sans casser le reste de l'étape.

## Détails techniques

**Nouveau module `src/lib/soilFloraScales.ts`** — dérivation pure, sans requête ni écriture :
- `toScale5(axis, soilLevel|floraLevel) → 1..5` : projette les niveaux existants (`ReadLevel` 1..3 côté sol, ratio de pôle côté flore) sur une échelle à 5 crans par facteur, en combinant les deux pôles opposés d'un même axe (`eau_sec` / `eau_frais`, `nutri_pauvre` / `nutri_riche`, `ph_acide` / `ph_calcaire`) en une position unique signée.
- `textureLabel(counts) → { word, shares }` : mot composé (« argilo-limoneux ») et parts argile / limon / sable issues du comptage de `texture_result` des prélèvements via `buildSoilReading`.
- `scaleGap(soil, flora) → 'accord' | 'nuance' | 'ecart' | 'na'` pour colorer le segment.
- Aucun changement dans `computeConcordanceDetail`, `chantierIcg.ts`, ni dans les prompts IA : l'ICG et les 8 lignes restent la source de vérité, les curseurs n'en sont qu'une projection de lecture.

**Nouveaux composants** dans `src/components/propriete/identify/scales/` :
- `ScaleRow.tsx` — une échelle à 5 crans, deux repères, segment d'écart, animation Motion sur l'entrée des repères (spring court, `prefers-reduced-motion` respecté).
- `TextureWord.tsx` — libellé + trois jauges.
- `SoilFloraScales.tsx` — l'assemblage des quatre lignes, la phrase de synthèse, les états chargement / vide / sol manquant, et une variante `print` sans animation.

**Modifications** :
- `ConcordanceBlock.tsx` — les curseurs en tête, l'existant déplacé dans un `Collapsible` shadcn « Voir le détail (ICG, tableau des 8 lignes) ».
- `IdentifySummary.tsx` — même bloc dans la vue verrouillée et dans les sections d'impression.
- `TabSynthesize.tsx` — insertion des curseurs dans la synthèse.
- `ChantierRapportLayout.tsx` / `IcgPipeline.tsx` — variante avant / projeté.
- `src/index.css` — règles `@media print` pour rendre les curseurs lisibles en niveaux imprimables, sans casser les planches existantes.

**Direction artistique** : uniquement les tokens existants (`--ds-eco-eau`, `--ds-eco-nutri`, `--ds-eco-ph`, `--ds-eco-texture`, `--ds-verdict-*`, `--ds-cream`, `--ds-line`, `--ds-forest-deep`). Aucune couleur en dur, rendu vérifié en Papier Crème et en Forêt Émeraude, à 375 px et en desktop large.

**Base de données** : aucune migration. Aucune URL publique touchée.
