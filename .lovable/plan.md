# Problème identifié

Le bug n’est plus un problème d’affichage UI.

La modale visible dans **Marches → Vivant** affiche bien ce qu’elle lit dans la base :
- `Tettigonia viridissima` est actuellement enregistrée dans `species_translations`
- avec `common_name_fr = "Crapaud vert"`
- `source = 'ai'`
- `confidence_level = 'medium'`

Donc l’application affiche une **mauvaise traduction persistée en base**, pas un oubli de rendu.

## Ce que ça signifie
- les correctifs précédents sur les hooks ont bien unifié l’affichage
- mais ils affichent maintenant fidèlement une donnée erronée du cache partagé
- tant que cette ligne reste en base, elle continuera à réapparaître partout

## Signal inquiétant
Le cache contient aujourd’hui beaucoup d’entrées `source = 'ai' / confidence = 'medium'` (1579 lignes), et plusieurs ont l’air fragiles ou discutables. Le problème est donc **systémique**, pas seulement isolé à cette espèce.

# Plan de résolution robuste

## 1. Corriger immédiatement les traductions fausses connues
- Remplacer la ligne erronée pour `Tettigonia viridissima` par le bon nom français usuel : **Grande sauterelle verte**.
- Ajouter un mécanisme de **surcouche manuelle prioritaire** pour les cas validés/corrigés.
- Faire en sorte qu’une correction humaine ne puisse jamais être réécrasée par l’auto-traduction.

## 2. Sécuriser la logique de remplissage automatique
- Modifier `translate-species` pour que l’AI ne soit plus traitée comme une vérité finale.
- Ne plus insérer automatiquement une traduction AI en production sans garde-fous.
- Si la source fiable n’est pas disponible, enregistrer l’entrée comme **candidate** ou la laisser en fallback, au lieu d’afficher une fausse certitude.

## 3. Ajouter une validation avant persistance
Mettre en place une validation défensive avant `upsert` :
- ne jamais écraser une entrée `manual` / `high`
- bloquer les réponses manifestement incohérentes
- journaliser les cas douteux pour revue
- option robuste : n’afficher automatiquement que les traductions `manual` ou `high`, et garder les `ai/medium` comme suggestions internes

## 4. Rendre l’affichage plus sûr côté frontend
- Faire privilégier les traductions **validées** seulement.
- Si une traduction n’est pas validée, afficher le fallback sûr :
  - nom français manuel si disponible
  - sinon nom d’origine
  - sinon nom scientifique
- Éviter qu’une hallucination AI apparaisse comme nom principal sans indication.

## 5. Auditer le stock existant de traductions AI
- Scanner les lignes `source = 'ai'` existantes.
- Identifier les plus suspectes pour correction.
- Préparer une stratégie de nettoyage progressif du cache déjà pollué.

# Détail technique

## Fichiers à modifier
- `supabase/functions/translate-species/index.ts`
- `src/hooks/useFrenchSpeciesNamesAuto.ts`
- `src/hooks/useSpeciesTranslation.ts`
- éventuellement la logique de lecture publique des traductions pour prioriser les entrées validées

## Donnée à corriger
- table `public.species_translations`
- ligne : `scientific_name = 'Tettigonia viridissima'`

## Stratégie backend recommandée
```text
source prioritaire d’affichage
manual/high
  > inpn/high
  > ai/medium seulement si explicitement autorisée
  > fallback commonName/scientificName
```

## Résultat attendu
- `Tettigonia viridissima` s’affiche en **Grande sauterelle verte**
- les futures hallucinations AI ne polluent plus silencieusement le cache partagé
- les écrans biodiversité restent cohérents même quand une source externe fiable est indisponible