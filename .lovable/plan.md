
Constat rigoureux :

- Le problème n’est pas la donnée source : l’exploration `70fcd8d1-7f63-43c8-a2bd-2cd436523437` possède bien des snapshots biodiversité, et on trouve de nombreuses attributions pour `Gaspard Boréal` dans `biodiversity_snapshots.species_data.attributions`.
- Le problème est très probablement côté UI / matching :
  1. le nom du participant affiché est `Gaspard Boreal` alors que les attributions sont stockées en base comme `Gaspard Boréal`
  2. le code actuel compare les noms en simple lowercase, sans normalisation des accents
  3. le sous-onglet `Contributions` ne réutilise pas réellement le pipeline robuste de l’onglet `Empreinte - Taxons observés`

Plan de correction :

1. Sécuriser le matching marcheur ↔ attributions
- Remplacer la comparaison actuelle par une normalisation robuste :
  - lowercase
  - suppression des accents/diacritiques
  - trim + réduction des espaces
- Faire le match sur plusieurs variantes :
  - `prenom + nom`
  - forme sans accent
  - éventuellement nom seul si nécessaire, mais seulement en fallback contrôlé

2. Réutiliser la logique “source of truth” de l’onglet Empreinte
- Extraire la transformation des `biodiversity_snapshots.species_data` dans un helper commun ou une fonction locale partagée.
- Construire, pour le sous-onglet `Contributions`, une liste d’observations individuelles à partir des `attributions`, et non une simple liste d’espèces dédupliquées trop tôt.
- Garder les métadonnées nécessaires :
  - taxon
  - photo
  - royaume
  - date d’observation
  - source
  - lien original

3. Corriger le comportement métier du sous-onglet Contributions
- Afficher la liste réelle des contributions de Gaspard issues des snapshots.
- Tri par défaut en date-heure croissante, avec bascule décroissante via `SortToggle`.
- Conserver le compteur discret dans le bandeau.
- Enrichir chaque ligne avec :
  - picto Faune / Flore / Champignon / Autre
  - nom scientifique en italique
  - nom vernaculaire traduit si disponible
  - date
  - source (iNat / eBird / GBIF)
  - miniature si disponible
- Ne pas dédupliquer trop tôt par `scientificName`, sinon on masque des contributions réellement distinctes.

4. Aligner l’UX/UI avec Empreinte
- Reprendre le style visuel des taxons observés :
  - hiérarchie typographique plus nette
  - badge royaume coloré
  - cartes plus denses et élégantes
  - meilleure lisibilité mobile-first
- Garder les cartes marcheurs fermées par défaut.
- Vérifier que le badge à droite reste cohérent :
  - caméra = photos publiques
  - feuille / taxon = observations biodiversité calculées depuis snapshots si disponible

5. Vérifications à faire après implémentation
- Vérifier que `Gaspard Boreal` affiche bien ses contributions malgré l’accent présent en base (`Boréal`).
- Vérifier que les entrées apparaissent dans l’ordre croissant par défaut.
- Vérifier le toggle croissant/décroissant.
- Vérifier que le rendu reste propre sur desktop et mobile.
- Vérifier qu’on n’affiche plus l’état vide “Aucune espèce identifiée” quand des attributions existent réellement.

Fichiers à modifier :
- `src/components/community/exploration/MarcheursTab.tsx`
- éventuellement création d’un helper partagé si on veut mutualiser proprement la transformation des snapshots avec la logique d’Empreinte

Détail technique clé :
- Aujourd’hui, la vue est vide alors que la base contient bien des lignes `observer_name = 'Gaspard Boréal'`.
- Donc la priorité absolue est :
  - normaliser les noms avec suppression des accents
  - reconstruire la liste à partir des attributions unitaires des snapshots
  - éviter la déduplication par espèce avant affichage
