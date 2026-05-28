# Transparence de l'attribution trophique

Objectif : exposer discrètement la méthode utilisée pour classer chaque espèce dans la chaîne trophique (KB éditoriale, règle famille, iconic_taxon iNat) — sans bruit visuel, avec tooltip explicatif.

## 1. Nouveau composant partagé

**`src/components/biodiversity/trophic/TrophicSourceBadge.tsx`**
- Petit badge monochrome, icône Lucide + libellé court + Tooltip (shadcn) au survol/tap.
- Mapping :
  - `kb` → `BookOpenCheck` · « curé » · tooltip : *« Attribution éditoriale validée par la base de connaissances La Fréquence du Vivant. »*
  - `heuristic` → `Network` · « famille » · tooltip : *« Déduit d'une règle taxonomique (famille / genre) — fiabilité élevée. »*
  - `iconic` → `Sparkles` · « taxon » · tooltip : *« Déduit du grand groupe iNaturalist (iconic_taxon) — niveau indicatif. »*
- Style : `text-white/50 text-[10px]`, icône `w-3 h-3`, hover `text-white/80`. Aucune couleur supplémentaire.
- Variante `compact` (icône seule) et `full` (icône + label).

Prérequis : `trophicClassification.ts` distingue déjà `'kb' | 'heuristic'`. Étendre l'union avec `'iconic'` et faire retourner `'iconic'` quand l'attribution provient du fallback `iconic_taxon` (déjà branché, juste à étiqueter distinctement de `'heuristic'`).

## 2. Fiche espèce — `SpeciesTrophicPosition.tsx`

Remplacer la ligne actuelle `« attribution curée » / « règle taxonomique »` (ligne 70) par `<TrophicSourceBadge source={star.source} variant="full" />`, positionné à droite du badge de niveau L3, comme aujourd'hui mais avec icône + tooltip.

## 3. Synthèse → Analyse IA → Chaîne trophique (légende globale)

**Nouveau composant `src/components/community/synthese/trophic/TrophicSourceLegend.tsx`**
- Reçoit `chain: TrophicChainResult` (déjà calculé par `useTrophicChain`).
- Agrège les counts par `source` à partir de `chain.stars`.
- Rend une ligne discrète, centrée sous la vue, ex :
  ```
  Méthode d'attribution :  ✓ 12 curées · ƒ 28 famille · ⌬ 40 taxon
  ```
  (icônes Lucide monochromes, séparateurs `·`, texte `text-white/45 text-[11px]`)
- Chaque segment a son propre Tooltip explicatif.
- Aucune mention des UNCLASSIFIED (décidé).

**Intégration** : injecter `<TrophicSourceLegend chain={chain} />` une seule fois dans le conteneur parent des 3 onglets (Constellation / Spirale / Réseau), en dessous du graphe, indépendamment de l'onglet actif → cohérence visuelle et code DRY. Identifier le parent (probablement `TrophicChainSection` ou équivalent qui héberge déjà le switcher d'onglets) lors de l'implémentation.

## 4. Mode plein écran trophique (bonus cohérence)

`TrophicFullscreenModal` : ajouter la même `TrophicSourceLegend` en pied de modal, pour rester cohérent quand on agrandit depuis la fiche espèce.

## Détails techniques

- Utiliser `Tooltip / TooltipProvider / TooltipTrigger / TooltipContent` de `@/components/ui/tooltip`.
- Icônes Lucide : `BookOpenCheck`, `Network`, `Sparkles`.
- Aucune migration DB, aucune nouvelle requête : `source` est déjà calculé côté front par `classifyTrophic`.
- Ajustement mineur de `trophicClassification.ts` pour distinguer `'iconic'` de `'heuristic'` (actuellement les deux peuvent retourner `'heuristic'` selon la branche).
- Pas de couleur ajoutée : on respecte la sobriété informationnelle.

## Fichiers touchés

- `src/lib/trophicClassification.ts` — étendre type `source` avec `'iconic'`
- `src/components/biodiversity/trophic/TrophicSourceBadge.tsx` — créer
- `src/components/community/synthese/trophic/TrophicSourceLegend.tsx` — créer
- `src/components/biodiversity/species-modal/SpeciesTrophicPosition.tsx` — remplacer la ligne « attribution curée »
- Conteneur parent des onglets Constellation/Spirale/Réseau dans Synthèse → ajouter légende
- `TrophicFullscreenModal.tsx` — ajouter légende en pied
