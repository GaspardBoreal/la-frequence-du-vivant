# Plan de correction

## Objectif
Permettre de naviguer vers chaque fiche issue de la recherche, y compris chaque occurrence listée sous une espèce comme « Clématite », avec un comportement rapide, clair et fiable.

## Ce que je propose

### 1. Rendre chaque sous-résultat cliquable
Aujourd’hui, dans la carte espèce, les occurrences récentes affichées en dessous sont seulement informatives.
Je vais transformer chaque ligne de contexte en action explicite :
- clic sur une occurrence = ouverture de la fiche espèce
- en transmettant aussi la marche concernée
- avec fermeture immédiate de l’overlay

Résultat : on pourra cliquer directement sur « BORDEAUX / Patio végétalisé ISEG », « DEVIAT C 865 », etc.

### 2. Faire consommer réellement le `marcheId` côté destination
Le moteur de recherche renvoie déjà un `marcheId` dans l’URL pour les espèces, mais la page cible ne l’exploite pas assez pour différencier les occurrences.
Je vais compléter le flux pour que, lors de l’ouverture depuis la recherche :
- la page biodiversité s’ouvre au bon onglet
- l’espèce concernée s’ouvre
- la marche ciblée soit utilisée pour mettre en avant la bonne occurrence/contexte

Résultat : on n’ouvre plus une fiche générique, mais la bonne entrée contextualisée.

### 3. Ajouter une navigation robuste même si on reste sur la même page
Comme beaucoup de résultats pointent vers la même route d’exploration, React Router peut rester sur la même page sans donner l’impression qu’il s’est passé quelque chose.
Je vais rendre ce cas robuste en déclenchant systématiquement un focus interne quand :
- la route change
- ou la route est identique mais le focus/marche change

Résultat : la navigation fonctionne aussi entre plusieurs résultats d’une même exploration sans impression de clic “mort”.

### 4. Améliorer la lisibilité de l’action dans l’UI
Je vais clarifier visuellement quelles zones ouvrent quoi :
- chaque occurrence récente aura un état hover/tap clair
- libellé/action cohérents
- éviter l’ambiguïté entre “déplier” et “ouvrir”

Résultat : on comprend immédiatement où cliquer pour aller vers une fiche précise.

## Détail technique
- Mise à jour de `SearchResultCard` pour donner un `onOpenContext(...)` aux lignes d’occurrences des espèces.
- Enrichissement du payload de navigation/focus avec `marcheId` par occurrence.
- Ajustement du flux `GlobalSearchOverlay` pour supporter l’ouverture d’un sous-résultat précis.
- Renforcement du mécanisme `useFocusFromUrl` / `focusBus` pour rejouer correctement un focus même sur même route.
- Branchement dans la vue biodiversité / `SpeciesExplorer` pour sélectionner l’espèce et exploiter la marche ciblée.

## Résultat attendu
Après implémentation, une recherche comme « cléma » permettra :
- de cliquer sur la carte espèce entière pour ouvrir la fiche générale
- de cliquer sur chaque occurrence listée pour ouvrir la même espèce, mais ancrée sur la bonne marche
- d’obtenir une réaction immédiate et cohérente, même sans changement visible d’URL de page