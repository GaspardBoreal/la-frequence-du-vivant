# Sélecteur d'espaces : une entrée claire, même avec beaucoup de jardins

Aujourd'hui la fenêtre « Bienvenue Gaspard » empile toutes les cartes dans une seule colonne scrollable : les titres se font couper par les bords du scroll, les libellés « Toujours ouvrir cet espace » alourdissent chaque ligne, et au-delà de 5–6 espaces la lecture devient pénible.

## Ce que je propose

### 1. Une recherche instantanée
- Champ « Rechercher un espace… » en haut, autofocus sur desktop, filtrant par nom et par ville en direct.
- Navigation clavier : flèches pour parcourir, Entrée pour ouvrir, Échap pour fermer.
- Le champ n'apparaît qu'à partir de 6 espaces, pour ne pas alourdir les comptes plus légers.

### 2. Des sections lisibles, en-têtes collantes
- Trois groupes nets : **Marcheur**, **Vos jardins & propriétés** (avec compteur), **Vos espaces partenaires**.
- Les titres de section restent collés en haut pendant le défilement, avec un léger flou de fond — plus de titre coupé au milieu.
- Dégradés de fondu haut/bas sur la zone scrollable pour signaler qu'il reste du contenu.

### 3. Cartes plus denses et plus propres
- Passage en **grille 2 colonnes** sur desktop (1 colonne sur mobile) : deux fois plus d'espaces visibles sans scroll.
- Carte compacte : vignette 44 px, nom sur une ligne (troncature propre), ville + rôle en une seule ligne discrète.
- Les badges « Principal » / « Propriétaire » / « Partenaire IoT » deviennent plus petits et alignés, sans casser la ligne du titre.
- Le lien « Toujours ouvrir cet espace » devient une **étoile discrète en survol/focus** en coin de carte (avec infobulle), au lieu d'un lien texte sur chaque ligne.

### 4. Accès rapides
- Les espaces marqués « Principal » remontent en tête de leur section.
- Rappel de l'espace ouvert par défaut, s'il y en a un, avec un bouton « Ne plus ouvrir automatiquement ».
- Pied de fenêtre inchangé (rappel du sélecteur en haut de page).

## Détail technique
- Modifications limitées à `src/components/community/AppChoiceDialog.tsx` (et petits ajustements de `ProprieteTile` pour une taille compacte).
- Aucun changement de données, de route, ni de logique de navigation : `go(target, remember)` reste le point d'entrée unique.
- Filtrage/tri en mémoire (`useMemo`), gestion clavier locale, aucun paquet supplémentaire.
- Couleurs prises dans les tokens existants du dialogue (émeraude/teal), cohérentes avec le thème sombre actuel.
