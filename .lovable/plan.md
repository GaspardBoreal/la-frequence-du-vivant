

# Analyse des resultats — Poitiers, 16 zones scannees

## Diagnostic

J'ai appele la fonction edge en direct avec les coordonnees de Poitiers (46.58, 0.34). Voici les **resultats reels** :

```text
Zone                    | Distance | Observations | Niveau
------------------------|----------|-------------|----------
Poitiers (N)            |   5 km   |    8 920    | Symphonie
Buxerolles (NE)         |   5 km   |    3 810    | Chœur
Poitiers (E)            |   5 km   |    5 917    | Symphonie
Mignaloux-Beauvoir (SE) |   5 km   |   10 890    | Symphonie
Smarves (S)             |   5 km   |    9 083    | Symphonie
Croutelle (SO)          |   5 km   |    6 761    | Symphonie
Vouneuil-sous-Biard (O) |   5 km   |   10 619    | Symphonie
Migne-Auxances (NO)     |   5 km   |    6 947    | Symphonie
Chasseneuil-du-Poitou   |  10 km   |    2 192    | Chœur
Montamise               |  10 km   |    5 278    | Symphonie
Sevres-Anxaumont        |  10 km   |   31 668    | Symphonie
Nouaille-Maupertuis     |  10 km   |    4 130    | Chœur
Smarves (S loin)        |  10 km   |    4 546    | Chœur
Liguge                  |  10 km   |    7 811    | Symphonie
Beruges                 |  10 km   |   13 465    | Symphonie
Cisse                   |  10 km   |    6 485    | Symphonie
```

**Resultat : 0 Silence, 4 Choeur, 12 Symphonie.** C'est correct ! Poitiers est une zone tres bien documentee sur GBIF. Il n'y a logiquement aucune zone blanche a proximite.

## Le vrai probleme : la valeur pour l'ambassadeur

Le detecteur fonctionne, mais quand tout est vert fonce, il n'apporte pas grand-chose. Voici les ameliorations a apporter :

### 1. Afficher les compteurs d'observations sur chaque point

Actuellement on voit juste des ronds verts identiques. Afficher le nombre d'observations dans le tooltip/popup ET varier la **taille du marqueur** proportionnellement (cercle proportionnel) pour reveler les contrastes meme entre zones riches.

### 2. Montrer le gradient relatif (pas seulement absolu)

Ajouter un mode "relatif" : au lieu de seuils fixes (0/50/500/5000), normaliser par rapport au min/max de la zone scannee. Chasseneuil (2192) apparaitrait alors comme une zone plus "faible" comparee a Sevres-Anxaumont (31668). Cela cree de la valeur meme sans zones blanches.

### 3. Enrichir les especes echantillons

Actuellement seules 2 zones sur 16 ont des especes (les 4 avec le moins d'observations). Afficher les especes pour TOUTES les zones enrichirait le contenu narratif.

### 4. Scanner plus loin pour trouver le silence

Ajouter un 3e rayon a 20km (8 points supplementaires) pour augmenter les chances de trouver des zones moins documentees en peripherie.

## Plan d'implementation

### Fichier : `supabase/functions/detect-zones-blanches/index.ts`
- Ajouter `DISTANCES_KM = [5, 10, 20]` (24 points au total)
- Augmenter le sampling a 6 zones frontier au lieu de 4

### Fichier : `src/components/zones-blanches/DetecteurZonesBlanches.tsx`
- **Taille proportionnelle des marqueurs** : `mapRadius` calcule dynamiquement entre 6 et 16 pixels en fonction du ratio `observations / maxObservations`
- **Afficher le compteur** dans le tooltip au hover (deja present dans le popup, l'ajouter en gros dans la bulle)
- **Mode relatif** : ajouter un toggle "Absolu / Relatif" qui recalcule les niveaux d'intensite par rapport au min/max local au lieu des seuils fixes
- **Afficher les especes** pour toutes les zones qui en ont (pas seulement 4)

Cela transforme le detecteur d'un simple "detecteur de vide" en un **outil de cartographie comparative de la connaissance du vivant**, utile meme dans les zones bien documentees.

