

# Reorganisation des menus : "Les 4 Temps du Marcheur"

## Constat

Aujourd'hui la barre affiche jusqu'a 8 onglets plats (Accueil, Zones, Marches, Quiz, Carnet, Sons, Kigo, Territoire). Sur mobile 390px, 8 icones = illisible. Et chaque nouvel outil (Boussole, Meteo, Phenologie...) aggraverait le probleme.

## Proposition : 4 piliers permanents + 1 evolutif

Organiser l'experience autour de ce que fait concretement un marcheur :

```text
  ┌─────────┬──────────┬──────────┬──────────┐
  │ Accueil  │ Marches  │ Carnet   │ Outils   │
  │   Home   │   Map    │ BookHeart│ Compass  │
  └─────────┴──────────┴──────────┴──────────┘
        + Territoire (sentinelle uniquement)
```

### 1. Accueil (Home)
Tableau de bord personnel — inchange.

### 2. Marches (Map)
Les evenements : s'inscrire, decouvrir, mes aventures a venir. Inchange.

### 3. Carnet (BookHeart)
Le Carnet Vivant — extrait de MarchesTab, devient un onglet de premier rang. Frise des saisons, modale sensorielle. C'est la memoire du marcheur.

### 4. Outils (Compass)
Hub regroupant tous les instruments pedagogiques et pratiques. Au tap, affiche une grille de tuiles :

| Tuile | Icone | Disponible | Description courte |
|-------|-------|------------|-------------------|
| Zones | Radar | Tous | Cartographie des zones de marche |
| Quiz | Brain | Tous | Testez vos connaissances |
| Sons | Volume2 | Eclaireur+ | Ecoute bioacoustique |
| Kigo | Flower2 | Ambassadeur+ | Mots de saison japonais |
| Boussole | Compass | *a venir* | Orientation terrain |
| Meteo | CloudSun | *a venir* | Conditions & phenologie |

Les tuiles verrouillees (role insuffisant ou "a venir") apparaissent en filigrane avec un petit cadenas — cela cree du desir et montre la progression possible.

### 5. Territoire (Globe) — sentinelle uniquement
Reste un onglet dedie car c'est un espace de gouvernance, pas un outil.

## Avantages

- **Mobile** : 4 icones max (5 pour sentinelle) au lieu de 8 — lisible, aere
- **Scalable** : chaque nouvel outil s'ajoute comme tuile dans "Outils" sans toucher la nav
- **Desir** : les tuiles verrouillees motivent la progression de role
- **Carnet promu** : le Carnet Vivant obtient la place qu'il merite

## Fichiers impactes

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MonEspaceTabBar.tsx` | Reduire TabKey a 5 valeurs (accueil, marches, carnet, outils, territoire). Adapter TABS_BY_ROLE |
| `src/components/community/tabs/OutilsTab.tsx` | **Nouveau** — Grille de tuiles avec sous-navigation interne (zones, quiz, sons, kigo) et tuiles verrouillees |
| `src/components/community/tabs/MarchesTab.tsx` | Retirer la section CarnetVivant (migree vers l'onglet Carnet) |
| `src/components/community/tabs/CarnetTab.tsx` | **Nouveau** — Wrapper du CarnetVivant comme onglet autonome |
| `src/pages/MarchesDuVivantMonEspace.tsx` | Adapter le renderTab() pour les nouveaux onglets |

