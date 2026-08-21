# Les Secrets de Sauniers — Marche du Vivant, Île de Ré

Coopérative des Sauniers de l'Île de Ré. Deux temps : une marche inaugurale qui fait la preuve, puis un observatoire annuel du marais.

## Le déplacement proposé

Le projet reçu est une **visite patrimoniale** : belle scénographie, 8 stations, besace sensorielle, mais aucune donnée produite, le saunier raconté plutôt qu'incarné, et rien à remettre au client après coup.

On garde tout l'existant — il devient la **couche sensible** — et on lui adosse une **couche de preuve** invisible pendant la marche, spectaculaire après.

```text
AMONT  1h15  Ars-en-Ré, les 8 stations          → la couche sensible (inchangée)
AVAL   1h45  Le marais, la parole du saunier    → la couche de preuve (nouvelle)
J+15         Restitution publique + bordereau   → la valeur client
```

Principe directeur : **low-tech pendant, données après**. Les visiteurs gardent la boussole et l'argile. Ce sont le guide et 2-3 marcheurs relais qui captent. Aucun écran ne casse l'expérience.

## Les quatre éléments du saunier

Le fil narratif du parcours aval, qui est aussi la structure de nos données :

| Élément | Sur le terrain | Ce qu'on rapporte |
|---|---|---|
| **Le Sel** | Dégustation comparée, cristal à la loupe | Gradient de salinité relevé par bassin |
| **L'Eau** | Lecture du circuit vasière → aires saunantes | Parcours de l'eau cartographié, waypoints GPS |
| **L'Argile** | Malaxage, test de plasticité | Prélèvements photographiés et documentés |
| **Le Vivant** | Observation guidée des halophytes et de l'avifaune | Observations géolocalisées versées à iNaturalist |

Le marais salant est un écosystème exceptionnellement lisible : salicorne, obione, soude, aster maritime côté flore ; avocette, échasse blanche, gravelot, tadorne côté avifaune. Chaque marche produit un relevé daté, situé, vérifiable.

## Le saunier au centre

Un saunier de la coopérative tient une station — pas en figurant, en **témoin**. Son geste (le simoussi, le tirage de la fleur de sel) est filmé et son savoir enregistré : la lecture du vent, la gestion des niveaux d'eau, ce qu'il voit changer depuis vingt ans.

Ce témoignage devient un actif de la coopérative : audio publié sur la page de marche, transcription versée au corpus, citation reprise dans la restitution. La coopérative n'expose plus un produit, elle expose un **métier vivant**.

## Ce qu'on livre

**Pendant** — l'expérience telle qu'imaginée, augmentée de la parole du saunier et d'un temps d'écoute du marais (le silence des salines est une donnée en soi).

**Après (J+15)** — une page publique aux couleurs de la coopérative :
- la carte des observations, station par station
- l'inventaire des espèces du marais, noms français, photos
- les prélèvements d'argile et le gradient de salinité
- les témoignages sauniers et les textes des marcheurs
- un bordereau exportable (PDF, Excel, GeoJSON) au nom de la coopérative

**Ensuite** — cette page devient le point de départ de la proposition d'observatoire : même marche à quatre saisons, courbes comparées, indicateurs de santé du marais. Argument RSE, argument label, argument presse.

## Ce qu'il faut construire dans l'app

### 1. L'événement et sa page publique
- Créer l'événement dans `marche_events` (type `eco_tourisme`), lieu Ars-en-Ré, avec les 8 stations amont + les 4 stations aval en `exploration_waypoints`.
- Activer la publication publique : la page vit sur `/m/:slug` en lecture seule, avec inscriptions et partage social.
- **Scénographie dédiée** : le fichier joint est réécrit en composant de scénographie par événement (le système existant permet un TSX custom en base, rendu en iframe sandbox). On conserve la palette teal/ambre, la timeline des étapes, la besace — et on ajoute les blocs « Le marais », « La parole du saunier », « Ce que nous avons relevé ».
- Deux états de la page : **avant** la marche (promesse, réservation, QR code d'inscription) et **après** (restitution nourrie des données réelles). Même URL, contenu qui se remplit.

### 2. Le parcours de données
- Les 4 stations aval sont des waypoints géolocalisés : la collecte biodiversité s'exécute dessus, les espèces du marais remontent automatiquement.
- Les prélèvements d'argile et relevés de salinité sont saisis comme médias documentés (photo + note + GPS), sur le modèle des prélèvements de sol existants.
- Le témoignage saunier est déposé en audio de marche, avec description enrichie.
- Aucun capteur IoT sur cette phase : les données proviennent uniquement de la marche.

### 3. La restitution
- Le bordereau et le Pack Vivant existants (PDF + Excel + CSV + GeoJSON + KML) sont générés au nom de la coopérative — c'est le livrable qui verrouille la phase 2.
- Une synthèse éditoriale courte : ce que le marais nous a dit ce jour-là.

## Ce qu'il me faut de votre côté

Avant de coder, trois informations de terrain :
1. Le tracé exact du parcours aval et les coordonnées des 4 stations dans le marais.
2. L'identité du saunier témoin et son accord pour l'enregistrement.
3. Le logo et la charte de la coopérative, pour la scénographie de la page.

## Ordre de réalisation

1. Événement + waypoints + page publique en mode « promesse », scénographie Sauniers.
2. QR code d'inscription et email de bienvenue aux couleurs de la coopérative.
3. Après la marche : collecte, curation des espèces, audio saunier, bordereau.
4. Bascule de la page en mode « restitution » et dossier de proposition observatoire.
