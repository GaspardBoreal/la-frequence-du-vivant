# Enrichir la fenêtre « Analyse du sol » avec les fiches Carotte de sol

## Objectif

Remplacer la liste technique actuelle par une lecture visuelle et agronomique de chaque point d’analyse. L’administrateur doit comprendre immédiatement ce que révèle chaque carotte, comparer les points et pouvoir revenir à la synthèse du tableau de bord sans perdre sa position.

## Ce que l’on construit

### 1. Une synthèse générale du registre

En tête de fenêtre :
- nombre de prélèvements, nombre complets et nombre géolocalisés ;
- phrase de lecture dominante issue des résultats existants : structure, texture, pH et vie du sol ;
- signalement discret des points encore incomplets, sans transformer une absence de mesure en résultat.

### 2. Une galerie de carottes, une par point d’analyse

Chaque prélèvement devient une carte cliquable, adaptée au téléphone, avec :
- lettre du point, lieu et état géolocalisé ou non ;
- mini-carotte verticale à quatre strates : structure, texture, acidité, vie du sol ;
- résultats lisibles : « Grumeleuse », « Limoneux », « pH 8 · Très basique », « Vie installée » ;
- détails utiles lorsqu’ils existent : méthode de test, forme du boudin et teneur en argile estimée, nombre de vers, indices de vie observés ;
- état « À compléter » explicite pour chaque mesure absente.

Les couleurs, libellés et calculs seront strictement ceux déjà utilisés par la fiche Carotte de sol : aucune nouvelle interprétation ni valeur inventée.

### 3. Une fiche détaillée sans quitter la fenêtre

Un clic sur une carotte ouvre une sous-vue dans la même fenêtre :
- grande carotte illustrée ;
- quatre blocs de résultats avec leur lecture agronomique existante ;
- jauge de pH, indice de vie sur 100 et liste des signes observés ;
- navigation précédent/suivant entre les prélèvements ;
- bouton « Revenir à la synthèse » toujours visible.

Le bouton final « Ouvrir dans l’espace jardinier » conserve l’accès à l’analyse complète dans un nouvel onglet. Fermer la fenêtre ramène au tableau de bord, à la même position.

### 4. États et accessibilité

- Chargement, erreur et registre vide restent traités clairement.
- Les cartes sont accessibles au clavier, avec intitulés explicites.
- Sur téléphone, la synthèse se lit en une colonne et la fiche détaillée devient un panneau fluide, sans tableau horizontal.
- Les animations restent légères et respectent la réduction des mouvements.

## Détails techniques

- Étendre le détail `sol` pour retourner les `SoilSample` complets et une synthèse calculée avec `buildSoilReading`, au lieu de convertir les objets en texte brut.
- Ajouter une vue spécialisée au module sol dans `ProprieteModuleDialog`, plutôt que d’utiliser la ligne générique des autres modules.
- Réutiliser les sources existantes : `SampleCoreSvg`, `RESULT_SHORT`, `TEXTURE_SHORT`, `classifyPh`, `scoreLife`, `LIFE_SIGN_MAP` et les lectures agronomiques associées.
- Ne pas ouvrir le tiroir global de saisie depuis la fenêtre admin : la sous-vue reste en lecture seule et contenue dans la fenêtre du tableau de bord.
- Aucune migration ni modification des données : les informations sont déjà présentes dans `propriete_soil_diagnostics.samples`.

## Vérification

- Contrôler le jardin « Maison sous Blossac », qui contient actuellement 7 points aux niveaux de complétude variés, afin de valider les résultats partiels, complets et vides.
- Vérifier l’ouverture d’une carotte, le passage au point suivant, le retour à la synthèse et la fermeture du dialogue sur ordinateur et téléphone.
- Vérifier les types et l’absence d’erreur dans la console.
