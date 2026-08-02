## Ce qui se passe

L'écran n'est pas « cassé » au hasard : trois mécanismes se marchent dessus dès qu'on **édite un prélèvement puis qu'on en crée un autre**.

1. **L'ajout renvoie un identifiant fantôme.** Dans `usePropertySoil`, `addSample` calcule l'id *à l'intérieur* de la fonction de mise à jour d'état, puis le retourne. React exécute cette fonction plus tard (et deux fois en développement) : l'appelant reçoit souvent une chaîne vide. Résultat : le nouveau prélèvement n'est pas ciblé, la ligne reste « Nommer ce prélèvement » grisée et inerte (le F de la copie d'écran).

2. **Le semis automatique des coordonnées écrase la saisie.** L'effet qui donne une position aux prélèvements sans GPS reconstruit **tout le tableau** à partir d'une photo figée des prélèvements, puis l'écrit d'un bloc (`onBulkSet`). S'il se déclenche pendant qu'on tape un nom, la frappe en cours est perdue. En plus il ne se déclenche que si le *nombre* de prélèvements change : après une suppression suivie d'un ajout, le nouveau point reste sans coordonnées et n'apparaît jamais sur la carte. Et comme la position est choisie par *rang dans la liste*, un nouveau point peut atterrir sous un point existant ou très loin de la parcelle (le F au sud sur la copie d'écran).

3. **Le focus est repris de force à chaque rendu.** Le champ de nom se re-focalise via un `ref` recréé à chaque rendu : tant qu'une ligne est « en édition », le curseur est ramené dedans, même quand on clique ailleurs (carte, autre ligne, bouton Ajouter).

S'ajoutent deux irritants visuels : toutes les lignes passent en opacité réduite au survol d'une voisine (effet « écran qui clignote »), et l'animation de hauteur sur des lignes en `flex` fait sauter la liste.

## Correctifs proposés

### 1. Création fiable d'un prélèvement
- `addSample` calcule l'identifiant et l'étiquette **avant** la mise à jour d'état, à partir d'une référence à jour du registre, et renvoie toujours un id réel (ou `null` si le maximum de 10 est atteint).
- Le nouveau prélèvement est créé **déjà positionné** : coordonnées calculées à la création (clic carte = position du clic ; bouton « Ajouter » = premier emplacement libre), donc plus aucune dépendance au semis différé.
- Anti double-clic : garde sur la capacité au niveau de l'état, pas au niveau de la vue.

### 2. Semis de coordonnées non destructif
- Remplacer l'écriture en bloc par des mises à jour **ciblées** (`updateSample` pour chaque point sans coordonnées) : la saisie en cours n'est plus jamais écrasée.
- Déclencheur basé sur « existe-t-il un point sans coordonnées ? » plutôt que sur le nombre de points, et exécuté une seule fois par point (garde par identifiant déjà traité).
- Choix de la position : premier emplacement de la double couronne **non occupé** (distance minimale d'environ 10 m avec les points existants), au lieu du rang dans la liste.

### 3. Focus et édition maîtrisés
- Suppression du `ref` auto-focus. On utilise une demande de focus **unique** (identifiant à focaliser, consommé puis effacé) après création d'un prélèvement.
- Le nom est édité en état local de ligne et propagé au registre à la validation / perte de focus, avec `Échap` = annuler, `Entrée` = valider : plus de perte de frappe même si le registre se réécrit.

### 4. Robustesse de la suppression et du recadrage
- L'action « Annuler » du bandeau de suppression ne réinsère le prélèvement que s'il n'a pas été recréé entre-temps, et retombe en fin de liste si la position d'origine n'existe plus.
- Le recadrage automatique de la carte ne se fait qu'au premier affichage et lors d'un changement de parcelle, jamais pendant un glisser-déposer de pastille (évite les sauts de carte).
- Le clic sur une pastille n'ouvre plus la fiche carotte s'il suit immédiatement un déplacement.

### 5. Lisibilité de la liste
- Atténuation au survol supprimée (seule la ligne survolée est mise en avant) ; l'animation de hauteur est remplacée par un fondu/déplacement, sans saut de mise en page.
- Nom du prélèvement sur deux lignes possibles et infobulle : plus de texte tronqué façon « Projet "Massif Mé ».
- Message clair si l'ajout est impossible (maximum atteint) et compteur « n / 10 » conservé.

## Détails techniques

- `src/hooks/propriete/usePropertySoil.ts` : `addSample` s'appuie sur une `ref` du registre courant pour calculer id/étiquette en amont et retourner `string | null` ; `restoreSample` vérifie l'absence de doublon d'id.
- `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx` : suppression de `seedMissingCoords` + `onBulkSet` au profit d'un effet de semis par point via `onUpdate` ; nouvel utilitaire de placement libre dans `sampleRoster.ts` (`firstFreePosition(center, samples)`) ; état `focusRequestId` ; sous-composant `SampleRow` avec état de saisie local.
- `src/components/propriete/tabs/TabAnalyze.tsx` : `onBulkSet` devient inutile et est retiré du câblage.
- Aucune modification de base de données : la persistance différée (1,5 s) existante reste inchangée.
