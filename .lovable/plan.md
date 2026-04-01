
Objectif
- Enrichir la section “Comment ça marche ?” sur `/marches-du-vivant/explorer` en ajoutant une nouvelle étape 01 “Choisir”, puis décaler les 3 étapes existantes à 02, 03 et 04 sans modifier leurs textes actuels.

Constat
- La section est pilotée par un tableau `etapes` dans `src/pages/MarchesDuVivantExplorer.tsx`.
- Chaque carte d’étape est générée via `etapes.map(...)`, donc la modification est simple, propre et cohérente avec l’existant.
- Le sous-titre actuel dit “Trois étapes...”, il devra être mis à jour pour rester aligné avec 4 étapes.

Ce que je vais modifier
1. Mettre à jour le tableau `etapes`
- Ajouter en tête une nouvelle entrée :
  - `num: '01'`
  - `titre: 'Choisir'`
  - un texte inspirant expliquant que le marcheur choisit la forme de marche qui lui ressemble : éco poétique, éco tourisme ou agroécologique
- Conserver les 3 étapes existantes à l’identique sur le fond, en les renumérotant :
  - `Marchez` devient `02`
  - `Explorez les zones blanches` devient `03`
  - `Progressez` devient `04`

2. Ajuster le texte d’introduction de section
- Remplacer “Trois étapes pour devenir acteur de la connaissance du vivant.” par une version équivalente avec “Quatre étapes...”

3. Respecter totalement la présentation existante
- Aucun changement de structure visuelle
- Même composant de carte
- Même rythme, mêmes icônes sauf ajout d’une icône cohérente pour “Choisir”
- Responsive conservé automatiquement puisque la section repose déjà sur une pile verticale de blocs

Proposition éditoriale pour la nouvelle étape 01
- Titre : `Choisir`
- Texte visé : inspirant, simple et orienté projection
- Intention :
  - montrer qu’il existe plusieurs portes d’entrée
  - aider le visiteur à se reconnaître dans un type de marche
  - préparer naturellement la suite du parcours

Formulation recommandée
- “Choisissez la marche qui vous appelle : éco poétique pour ressentir et écrire, éco tourisme pour découvrir les territoires, agroécologique pour observer finement le vivant et ses équilibres.”

Détail technique
- Fichier à modifier : `src/pages/MarchesDuVivantExplorer.tsx`
- Zones concernées :
  - déclaration de `const etapes = [...]`
  - sous-titre de la section “Comment ça marche ?”

Résultat attendu
- La section passe de 3 à 4 étapes sans casser le design.
- La première étape valorise clairement les 3 types de marches.
- Le récit devient plus logique : d’abord choisir son type de marche, puis marcher, explorer, progresser.
