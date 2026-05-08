# Constats

Le problème vu dans **Marches → Vivant** n’est pas un oubli de traduction en base.

- Les espèces visibles sur ta capture **existent déjà en français** dans `species_translations` :
  - `Prunus persica` → `Pêcher`
  - `Salix integra` → `Saule intégral`
  - `Cardamine pratensis` → `Fleur de coucou`
  - `Prunus` → `Prunier, cerises et alliés`
- Donc le bug est dans la **couche d’affichage / résolution**, pas dans les données.

## Problème exact

Il y a aujourd’hui **deux logiques concurrentes** dans l’app :

1. **Nouvelle logique robuste**
   - `<SpeciesName />`
   - `useFrenchSpeciesNamesAuto`
   - Elle affiche toujours le meilleur nom FR disponible et auto-remplit les manquants.

2. **Ancienne logique encore active dans SpeciesExplorer / cartes / modales**
   - `useSpeciesTranslation` / `useSpeciesTranslationBatch`
   - Elle dépend encore de `LanguageContext` et de `localStorage('biodiversity-language')`
   - Si la langue stockée est `en`, elle **force l’affichage anglais**, même si la traduction FR existe déjà.

C’est pour cela que :
- certains écrans sont bien en français,
- mais **Marches → Vivant** reste en anglais.

Autrement dit : **le bug principal est architectural**.

## Risque secondaire identifié

Le hook `useFrenchSpeciesNamesAuto` fait un appel batch à l’edge function pour les noms manquants, mais son mécanisme actuel peut ne pas rejouer proprement si l’utilisateur n’est pas encore authentifié au premier rendu.

Ce n’est **pas la cause du cas de ta capture** (car les traductions existent déjà), mais c’est un vrai point de robustesse à corriger pour éviter d’autres trous plus tard.

# Solution robuste proposée

## 1. Unifier la règle produit
Faire des noms d’espèces une **couche FR centralisée par défaut** sur tout le périmètre Marches / Vivant / Apprendre / Synthèse.

Concrètement :
- on **retire la dépendance cachée** à `LanguageContext` pour les noms d’espèces sur ces écrans,
- on fait de `<SpeciesName />` ou d’un résolveur FR centralisé **la seule voie autorisée**.

## 2. Corriger les écrans encore branchés sur l’ancienne logique
Refactorer les composants qui affichent encore `translation?.commonName || species.commonName` pour qu’ils passent tous par le résolveur universel.

Priorité :
- `src/components/biodiversity/SpeciesExplorer.tsx`
- `src/components/audio/EnhancedSpeciesCard.tsx`
- `src/components/biodiversity/SpeciesDisplay.tsx`
- `src/components/biodiversity/SpeciesDetailModal.tsx`

## 3. Rendre la recherche et les filtres bilingues mais l’affichage FR
Dans `SpeciesExplorer`, la recherche doit matcher :
- nom FR résolu,
- nom commun brut d’origine,
- nom scientifique.

Ainsi :
- l’interface affiche toujours le **français**,
- mais on peut encore retrouver une espèce si une donnée source arrive en anglais.

## 4. Durcir l’auto-translation manquante
Fiabiliser `useFrenchSpeciesNamesAuto` pour que les traductions manquantes soient bien retentées quand la session/auth devient disponible.

Objectif :
- éviter les faux “ça ne traduit pas” sur des espèces jamais vues auparavant,
- garantir le remplissage progressif du cache partagé.

## 5. Verrouiller la règle dans le code
Ajouter une règle explicite de migration :
- tout affichage d’espèce doit passer par `<SpeciesName />` ou un hook reposant sur `useFrenchSpeciesNamesAuto`.
- on laisse les anciens hooks seulement comme compat technique temporaire, plus comme source d’affichage.

# Implémentation prévue

## Fichiers ciblés
- `src/components/biodiversity/SpeciesExplorer.tsx`
- `src/components/audio/EnhancedSpeciesCard.tsx`
- `src/components/biodiversity/SpeciesDisplay.tsx`
- `src/components/biodiversity/SpeciesDetailModal.tsx`
- `src/hooks/useSpeciesTranslation.ts`
- `src/hooks/useFrenchSpeciesNamesAuto.ts`
- mémoire technique espèces FR

## Résultat attendu
- **Marches → Vivant** affiche immédiatement les noms FR déjà connus.
- Les nouvelles espèces sans traduction sont auto-remplies en arrière-plan.
- La logique devient cohérente entre **Synthèse**, **Marches**, **Apprendre**, **L’œil**, **modales**, **cartes** et **listes**.
- On supprime la possibilité qu’un `localStorage` caché remette des écrans en anglais sans signal visible.

# Détail technique

- Remplacer l’affichage textuel direct par `<SpeciesName />` ou une donnée enrichie `resolvedDisplayName`.
- Faire en sorte que `useSpeciesTranslationBatch` ne soit plus piloté par `language === 'en'` pour ce domaine.
- Ajouter un retry propre côté `useFrenchSpeciesNamesAuto` quand l’auth est prête.
- Vérifier les usages de `LanguageToggle` pour qu’il ne pilote plus implicitement la langue des noms sur les vues FR métier.

# Validation

Je validerai ensuite sur le parcours réel :
- `/marches-du-vivant/mon-espace/exploration/...` → onglet **Marches → Vivant**
- **Synthèse → Taxons observés**
- **Apprendre → Ce que nous avons vu → l’œil**

avec contrôle sur les espèces de ta capture (`Peach`, `dappled willow`, `Cuckooflower`, etc.) pour confirmer le rendu final en français.