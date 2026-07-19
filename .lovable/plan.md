## Diagnostic

Les deux vues sont **cohérentes** mais montrent des granularités différentes :

- **App Marcheurs / Taxons observés** affiche des **espèces** → 2 fiches (`Weigela florida` + `Weigela`)
- **Curation taxonomique / Carte** affiche des **observations** → 3 points GPS regroupés en 1 constellation (2 formes)

Le "3" est un compte d'observations (2× *Weigela florida* iNaturalist + 1× *Weigela* upload marcheur), pas un troisième taxon. Il n'y a donc pas d'incohérence de comptage — mais il reste **deux problèmes de qualité de données** à résoudre :

1. **Doublon taxonomique** : « Weigela » (rang genre, upload marcheur) et « Weigela florida » (binomiale iNat) désignent la même plante → doivent fusionner en une seule fiche
2. **Observation hors périmètre** : une des obs iNat est à 72 m du point marche le plus proche (signalée en rouge)

## Actions proposées

### 1. Fusion taxonomique persistante (règle le doublon partout)
Depuis `/admin/outils/taxonomie` → cluster « weigela » → **Fusionner vers « Weigela florida »**.

Effet immédiat via le système d'alias déjà en place (`species_taxonomy_aliases` + triggers) :
- Réécriture des observations existantes (`marcheur_observations`) vers le nom canonique
- Réécriture des snapshots JSON historiques
- Toutes futures obs iNat/Pl@ntNet libellées « Weigela » seront automatiquement réattribuées
- L'app Marcheurs n'affichera plus qu'**une seule fiche** avec 3 observations cumulées
- Le compteur passe de 224 → 223 espèces sur DEVIAT

### 2. Traitement de l'observation hors périmètre (72 m)
Deux options selon le cas réel :

- **Si la plante existe bien à cet endroit** (jardin voisin, haie limitrophe) → laisser telle quelle ; le badge "hors périmètre" est informatif, pas bloquant
- **Si erreur GPS iNat** (ex. photo prise depuis un point mais tag GPS drifté) → repositionner via l'outil GPS curator déjà en place dans le drawer iNat plein écran (RPC `reposition_marcheur_observation_gps`, audit conservé)

### 3. Renforcement long terme — protocoles qualité
Pour éviter que ce cas se reproduise à chaque nouvelle marche :

- **Pré-fusion suggérée** : ajouter un badge « Fusion suggérée » automatique quand un rang genre coexiste avec exactement 1 espèce binomiale du même genre dans la même marche (règle déjà codée dans `taxonomyMerge.ts` pour la fusion visuelle — la remonter comme suggestion actionable dans la liste de curation)
- **Batch review post-sync** : après chaque synchronisation iNat, notification admin listant les nouveaux clusters de doublons probables (≥ 2 formes du même genre)
- **Guide rédaction upload marcheur** : encourager les marcheurs à choisir le rang le plus précis via Pl@ntNet plutôt que le genre seul quand l'app propose une binomiale confiante

## Ce que je vais implémenter (si validé)

Périmètre code minimal, focalisé sur les points 1 et 3 (le point 2 est un geste ponctuel par observation) :

- **Badge « Fusion suggérée »** dans `AdminTaxonomyCuration.tsx` : marquer visuellement les clusters où `isGenusOnly(A)` + 1 seule espèce binomiale du même genre → tri "Fusion suggérée" en premier de la liste
- **Compteur global** dans le bandeau : « X fusions suggérées détectées » avec filtre rapide
- **Aucune modification** du système d'alias / triggers (déjà robuste) ni de l'app Marcheurs (elle reflète automatiquement la fusion)

## Note technique

Le pipeline existant (`species_taxonomy_aliases` + trigger de réécriture + RPC `upsert_species_taxonomy_alias`) est déjà la bonne architecture "haute qualité" : une fusion = une règle persistante, applicable rétroactivement et à toute donnée entrante. Le seul manque aujourd'hui est **l'assistance à la décision** (surfacer les fusions évidentes) — d'où l'ajout ciblé du badge et du tri.