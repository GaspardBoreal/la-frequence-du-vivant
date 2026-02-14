# Plaquette "Devenez Marcheur du Vivant"

Page web imprimable sur `/marches-du-vivant/explorer` — remplace le placeholder actuel.

## Concept de design

Une page-plaquette elegante, pensee pour etre partagee (lien direct) et imprimee (CSS `@media print`). Le design s'inspire d'une brochure haut de gamme : beaucoup de blanc (respiration), typographie serif (Crimson Text), couleurs naturelles.

La page est structuree en sections verticales claires, sans animation excessive (pour l'impression), avec un rythme narratif : **Pourquoi -> Comment ca marche -> Les 3 piliers -> Votre progression -> Calendrier -> CTA**.

## Structure de la page (sections)

### 1. En-tete de navigation

Barre sobre avec lien retour "Les Marches du Vivant" (comme la page Association).

### 2. Hero / Couverture de plaquette

- Badge : "Gratuit - Ouvert a tous"
- Titre : "Devenez Marcheur du Vivant"
- Sous-titre : "Chaque pas est un acte poetique et scientifique"
- Texte d'accroche : "Vous n'allez pas collecter des donnees. Vous allez ecouter, nommer, temoigner. Et chaque kilometre parcouru enrichira votre connaissance du vivant."

### 3. "Pourquoi marcher pour le vivant ?"

Trois cards cote a cote representant les 3 piliers de l'ecosysteme :

**Card 1 — Geopoetique du Vivant** (couleur emerald)

- Icone : Leaf
- "La marche n'est pas un sport, c'est une experience du territoire. Chaque pas est un acte poetique et scientifique. Le marcheur ne collecte pas des donnees : il ecoute, il nomme, il temoigne."

**Card 2 — Technologie Frugale** (couleur blue)

- Icone : Cpu
- "Pas de surconsommation de donnees. L'application traite ce que le marcheur rapporte avec sobriete et precision. L'IA est au service du vivant, pas l'inverse."

**Card 3 — Science Participative** (couleur amber)

- Icone : Users
- "Chaque observation rejoint une base de connaissance collective. Vous contribuez a la cartographie du vivant, pour les scientifiques et pour les generations futures."

### 4. "Comment ca marche ?" — Le systeme gamifie

Explication visuelle en 3 etapes numerotees :

**Etape 1 — Marchez**  
"Choisissez un sentier, une forêt, une rivière, un parc, ouvrez l'application, marchez. Chaque kilometre vous rapporte des Frequences (points)."

**Etape 2 — Explorez les zones blanches**
"Les zones pauvres en donnees rapportent jusqu'a 4x plus de Frequences. Devenez eclaireur du vivant."

**Etape 3 — Progressez**
"Maintenez votre serie hebdomadaire, montez dans le classement, debloquez de nouveaux roles."

### 5. Systeme de progression (Roles)

Affichage horizontal de la progression :

- **Marcheur** : Premiere marche, decouverte de l'ecoute active
- **Eclaireur** : 5 zones blanches explorees
- **Ambassadeur** : Formation + animation de groupes
- **Sentinelle** : Referent territorial, formateur de futurs ambassadeurs

### 6. "Les zones blanches : le coeur du defi"

Section explicative avec une mise en page editoriale :

- Texte expliquant que les zones blanches sont des territoires ou la biodiversite n'a pas encore ete ecoutee
- Tableau simple des multiplicateurs : Zone frequentee (x1), Peu frequentee (x2), Zone blanche (x4)

### 7. Calendrier de lancement

Timeline verticale elegante :

- **8-9 mars 2026** : Premier test — Printemps des Poetes (comite reduit)
- **24-25 mai 2026** : Second test — Fete de la Nature (comite elargi)
- **21 juin 2026** : Lancement officiel — Solstice d'ete

### 8. CTA final

- "Rejoignez les premiers Marcheurs du Vivant"
- Bouton contact vers la-frequence-du-vivant.com/contact
- Mention "Gratuit, intergenerationnel, ouvert a tous"

### 9. Footer existant (composant Footer)

## Aspects techniques

### Fichier modifie : `src/pages/MarchesDuVivantExplorer.tsx`

Remplacement complet du placeholder par la page-plaquette.

### CSS d'impression

Ajout d'un bloc `@media print` dans `src/index.css` pour :

- Masquer le header de navigation et le footer
- Forcer les backgrounds blancs et texte noir
- Supprimer les ombres et bordures decoratives
- Forcer les sauts de page entre sections majeures

### Pas de nouveau fichier de composant

Tout est dans la page elle-meme pour garder la plaquette auto-contenue et facile a maintenir. Les animations framer-motion sont conservees pour le web mais ignorees a l'impression.

### Bouton "Imprimer / Partager"

Un bouton discret en haut a droite de la page (masque a l'impression) avec `window.print()` et un bouton de copie du lien pour le partage.

## Renaming strategique : "Points" -> "Frequences"

Dans la proposition de Victor, le systeme utilise des "points". Pour ancrer l'identite dans l'univers de Gaspard Boreal et de "La Frequence du Vivant", les points seront rebaptises **"Frequences"** dans toute la plaquette. Cela cree une coherence de marque totale : le marcheur "capte des frequences" du vivant, il ne "gagne des points".

## Resultat attendu

- Une page web elegante, sobre, lisible par tous (intergenerationnel)
- Imprimable en PDF propre via le navigateur (Ctrl+P)
- Partageable par lien direct
- Integrant les 3 piliers (geopoetique, IA frugale, science participative)
- Valorisant le systeme gamifie de Victor (points/frequences, zones, series, roles)
- Prete a etre montree a Victor comme preuve d'integration de son travail