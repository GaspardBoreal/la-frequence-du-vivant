

# Evolution de /marches-du-vivant : integration du segment B2C

## Contexte

Le document de Victor Boixeda propose une offre B2C gamifiee pour "Les Marches du Vivant", basee sur :
- Un **systeme de points** (10 pts/km) avec ponderation par zone (blanche, peu frequentee, frequentee) pour inciter les marcheurs a explorer les zones pauvres en donnees
- Un **systeme de serie** hebdomadaire (inspiration Duolingo/Strava) pour fideliser les marcheurs
- Des **evenements/defis** ponctuels pour dynamiser la communaute
- Un **systeme de ligues/roles** progressif (marcheur, ambassadeur, etc.)

L'objectif strategique est de transformer les marcheurs grand public en "collecteurs de donnees qui s'amusent" — la donnee biodiversite etant le vrai produit.

## Architecture actuelle de /marches-du-vivant

La page est un hub avec 2 cards de navigation :
1. **Entreprises** -> `/marches-du-vivant/entreprises` (B2B, formations Qualiopi, RSE)
2. **Grand Public et Association** -> `/marches-du-vivant/association` (equipe, cercle d'or, FAQ)

Le probleme : la card "Grand Public" pointe vers la page **Association** (gouvernance, equipe fondatrice). L'offre B2C de Victor n'a pas de place dediee. Il faut scinder clairement les deux publics.

## Proposition d'evolution

### Passer de 2 a 3 cards de navigation

La page hub `/marches-du-vivant` passe d'une grille 2 colonnes a une grille **3 colonnes** (desktop) / **empilees** (mobile) :

```text
+---------------------+---------------------+---------------------+
|                     |                     |                     |
|    ENTREPRISES      |    GRAND PUBLIC     |    ASSOCIATION      |
|    (B2B)            |    (B2C)            |    (Gouvernance)    |
|                     |                     |                     |
|  Formation Qualiopi |  Marchez, explorez, |  L'equipe, la       |
|  RSE, CSRD          |  gagnez des points  |  mission, rejoindre |
|  Team building      |  Decouvrez les      |  l'aventure         |
|                     |  zones blanches     |                     |
|                     |                     |                     |
+---------------------+---------------------+---------------------+
```

### Detail des 3 cards

**Card 1 — Entreprises (inchangee)**
- Icone : Building2 (emerald)
- Badges : RSE, Innovation, Qualiopi
- Lien : `/marches-du-vivant/entreprises`

**Card 2 — Grand Public (NOUVELLE - couleur cyan/teal)**
- Icone : `Gamepad2` ou `Trophy` (cyan)
- Titre : "Explorez & Collectez"
- Badges : `Gamifie`, `Classement`, `Zones Blanches`
- Description : "Marchez, explorez les zones blanches, gagnez des points. Chaque kilometre compte pour la biodiversite."
- CTA : "Decouvrir le defi" -> `/marches-du-vivant/explorer` (nouvelle route, page a construire plus tard)

**Card 3 — Association (existante, requalifiee)**
- Icone : Heart (amber) — au lieu de Users
- Titre : "L'Association" (au lieu de "Grand Public et Association")
- Badges : `Mission`, `Equipe`
- Description : "Decouvrez l'equipe fondatrice, la vision et comment rejoindre l'aventure."
- CTA : "Decouvrir l'association" -> `/marches-du-vivant/association`

### Ajustements complementaires sur le hub

**Hero** : Elargir le sous-titre pour ne plus etre uniquement B2B.
- Avant : "Team Building Scientifique & Bioacoustique"
- Apres : "Science Participative, Team Building & Exploration Gamifiee"

**Differenciateurs** : Ajouter un 4e differenciateur pour le B2C :
- Icone : Trophy (cyan)
- Titre : "Exploration Gamifiee"
- Description : "Gagnez des points, explorez les zones blanches, montez dans le classement des Marcheurs."

Passer la grille des differenciateurs de 3 a 4 colonnes (`md:grid-cols-4`).

**SEO** : Mettre a jour les meta tags pour inclure les mots-cles B2C (gamification, exploration, classement, zones blanches).

## Modifications techniques

### Fichier 1 : `src/pages/MarchesDuVivant.tsx`

1. **Imports** : Ajouter `Trophy` ou `Gamepad2` de lucide-react
2. **Hero** : Modifier le sous-titre (ligne 83)
3. **Grille de cards** : Passer de `grid-cols-2` a `grid-cols-3` (ligne 102), ajouter la card B2C entre Entreprises et Association
4. **Card Association** : Requalifier le titre et la description (lignes 144-180)
5. **Differenciateurs** : Ajouter le 4e item, passer la grille en `md:grid-cols-2 lg:grid-cols-4` (lignes 205-245)
6. **Meta tags** : Enrichir avec les mots-cles B2C

### Fichier 2 : `src/App.tsx`

Ajouter la route placeholder `/marches-du-vivant/explorer` qui redirigera temporairement vers `/marches-du-vivant` ou affichera une page "Bientot disponible" en attendant la construction de la page dediee B2C.

### Aucun autre fichier impacte

Les pages existantes (Entreprises, Partenaires, Association) ne sont pas modifiees. La page dediee B2C (`/marches-du-vivant/explorer`) sera construite dans une etape suivante.

## Resultat attendu

- La page hub `/marches-du-vivant` presente clairement les 3 segments : B2B, B2C, Association
- L'offre gamifiee de Victor a une entree visible et attractive des le hub
- La card "Association" n'est plus confondue avec l'offre grand public
- La coherence visuelle est preservee (meme design system, couleurs distinctes par segment)
- La page dediee B2C sera construite ensuite sur `/marches-du-vivant/explorer`

