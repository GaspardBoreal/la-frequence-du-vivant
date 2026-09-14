# Améliorer la lisibilité des réponses de l’Assistant du jardin

## Constat vérifié

- Les réponses sont déjà interprétées comme du texte structuré, mais les titres de niveaux 1, 2 et 3 ont presque la même taille que le corps du texte.
- Les paragraphes, listes et étapes sont trop rapprochés, ce qui transforme les réponses longues en blocs compacts.
- L’Assistant reçoit une consigne générale de produire des « titres courts, listes, gras », sans format précis pour les étapes numérotées ni obligation de sauts de ligne.
- Le rendu actuel est un composant de conversation fait sur mesure. L’amélioration s’appuiera sur les composants de conversation AI Elements recommandés, sans changer le fonctionnement ni les données de l’Assistant.

## Présentation proposée

### 1. Des étapes immédiatement repérables

- Afficher chaque grand titre numéroté sous la forme d’un véritable intertitre : numéro dans une pastille, intitulé plus grand et plus contrasté, espace généreux avant et après.
- Différencier clairement les trois niveaux : grand chapitre, sous-partie, précision.
- Conserver un rendu sobre, cohérent avec les thèmes clair et sombre du jardin.

### 2. Une lecture plus aérée

- Donner de vrais espacements aux paragraphes, listes, citations et tableaux.
- Respecter les lignes vides produites par l’Assistant et réparer les réponses compactes courantes lorsqu’un titre numéroté est collé au texte précédent.
- Améliorer l’interligne et l’indentation des listes sur mobile, sans élargir excessivement les réponses sur ordinateur.

### 3. Un format de réponse plus fiable

- Demander explicitement à l’Assistant d’écrire les grandes étapes comme `## 1. Titre`, `## 2. Titre`, avec une ligne vide avant et après chaque section.
- Garder les listes pour les détails et les actions, sans transformer tous les nombres en grands titres.
- Préserver le mode vocal court, les tableaux exportables, les noms d’espèces et les réponses déjà enregistrées.

## Mise en œuvre technique

- Installer et composer les primitives AI Elements nécessaires au rendu des messages, puis conserver les fonctions existantes : diffusion progressive, Markdown, copie, lecture audio, images et tableaux.
- Ajouter un rendu dédié des titres Markdown avec pastille numérotée, hiérarchie typographique et espacements adaptés au mobile.
- Étendre prudemment la réparation Markdown existante pour séparer les titres numérotés manifestement collés, sans modifier le contenu des phrases ni les tableaux.
- Renforcer uniquement les consignes de présentation de l’Assistant du jardin ; aucune modification de ses connaissances ou de sa logique métier.

## Vérifications

- Tester une réponse avec au moins trois parties numérotées, paragraphes, liste à puces et tableau.
- Vérifier la réponse pendant son écriture puis une fois terminée, en thèmes clair et sombre, sur mobile et ordinateur.
- Contrôler que les boutons Copier et Écouter, les photos jointes et les tableaux restent utilisables.
