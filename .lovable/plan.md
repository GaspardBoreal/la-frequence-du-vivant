

# Traversées : Hub des Lectures Immersives

## Vision

Transformer l'onglet "Sismographe" en un portail "Traversées" regroupant plusieurs modes d'exploration poétique. Ce hub permettra à l'utilisateur de basculer entre différentes visualisations immersives du recueil, positionnant l'ouvrage comme une experience editoriale innovante.

---

## Architecture Proposee

```text
+--------------------------------------------------+
|  [Onglet: Traversées]                            |
+--------------------------------------------------+
|                                                  |
|  +-----------+  +-----------+  +-----------+     |
|  |Sismographe|  |Index Vivant|  |  + ...   |     |
|  |  Poetique |  |           |  | (futur)  |     |
|  +-----------+  +-----------+  +-----------+     |
|                                                  |
|  +--------------------------------------------+  |
|  |                                            |  |
|  |     [Contenu du mode selectionne]          |  |
|  |                                            |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

---

## Nouveaux Composants

### 1. TraverseesHub (Conteneur Principal)

Nouveau composant qui orchestre les differents modes de traversee :

- Interface a onglets internes (style minimal, typographique)
- Gestion de l'etat du mode actif
- Design epure avec transition fluide entre les modes

### 2. LivingIndex (Index Vivant)

Visualisation typographique pure et animee :

**Concept :**
- Liste verticale des lieux dans l'ordre narratif
- Chaque nom de lieu "respire" avec une animation subtile
- Opacite et taille varient selon la densite textuelle
- Pas de carte, pas d'icones : uniquement la typographie comme medium

**Interactions :**
- Survol : le lieu s'illumine, affiche le nombre de textes
- Les parties sont marquees par des separateurs typographiques (tirets longs, numero romain)
- Effet de "battement de coeur" subtil base sur l'intensite poetique

**Caracteristiques visuelles :**
- Police serif italique pour les noms de lieux
- Espacement genereux (lettrespace elargi)
- Animation de pulsation douce (opacite 0.7 a 1.0)
- Fond sobre, texte en couleur primaire du theme

---

## Modifications

### EpubPreview.tsx

1. Renommer l'onglet "Sismographe" en "Traversees"
2. Importer et utiliser le nouveau `TraverseesHub` a la place de `PoeticSeismograph`
3. Conserver les 7 onglets (pas de modification de la grille)

---

## Structure des Fichiers

```text
src/components/admin/
  +-- TraverseesHub.tsx        (nouveau - conteneur)
  +-- LivingIndex.tsx          (nouveau - Index Vivant)
  +-- PoeticSeismograph.tsx    (existant - inchange)
  +-- EpubPreview.tsx          (modifie - import du hub)
```

---

## Details Techniques

### TraverseesHub.tsx

```text
Props:
  - textes: TexteExport[]
  - colorScheme: { primary, secondary, accent, background, text }

Etat interne:
  - activeMode: 'seismograph' | 'living-index'

Rendu:
  - Selecteur de mode (boutons minimalistes)
  - Rendu conditionnel du composant actif
```

### LivingIndex.tsx

```text
Props:
  - textes: TexteExport[]
  - colorScheme: { primary, secondary, accent, background, text }

Logique:
  - Grouper par partie + marche (ordre narratif)
  - Calculer intensite par lieu (nombre de textes, variete de genres)
  - Normaliser pour animation

Animation (Framer Motion):
  - Pulsation: animate={{ opacity: [0.7, 1, 0.7] }}
  - Transition: repeat: Infinity, duration: 3-5s (varie selon intensite)
  - Entree: staggerChildren avec fadeIn + slideUp
```

---

## Exemple Visuel de l'Index Vivant

```text
+------------------------------------------+
|           TRAVERSEES                     |
|   [ Sismographe ]  [ Index Vivant ]      |
+------------------------------------------+
|                                          |
|              I                           |
|     ─────────────────────                |
|                                          |
|         B e r g e r a c                  |  <- pulsation lente
|            (12 textes)                   |
|                                          |
|       S a i n t e - F o y               |  <- pulsation moyenne
|            (8 textes)                    |
|                                          |
|              II                          |
|     ─────────────────────                |
|                                          |
|     C a s t i l l o n                   |  <- pulsation rapide
|            (15 textes)                   |
|                                          |
+------------------------------------------+
```

---

## Extensibilite Future

La structure du `TraverseesHub` permettra d'ajouter facilement de nouveaux modes :

- "Constellation Textuelle" (visualisation spatiale)
- "Cartographie Sonore" (integration audio)
- "Flux Temporel" (timeline poetique)

Chaque nouveau mode sera un composant independant ajoute au hub.

---

## Section Technique

### Fichiers a Creer
1. `src/components/admin/TraverseesHub.tsx` - Hub conteneur avec sous-navigation
2. `src/components/admin/LivingIndex.tsx` - Composant Index Vivant anime

### Fichiers a Modifier
1. `src/components/admin/EpubPreview.tsx`
   - Ligne 6 : Ajouter import de `TraverseesHub`
   - Ligne 10 : Supprimer import direct de `PoeticSeismograph`
   - Ligne 108-111 : Renommer "Sismographe" en "Traversees" et changer l'icone en `Compass`
   - Ligne 256-258 : Remplacer `PoeticSeismograph` par `TraverseesHub`

### Dependances Utilisees
- `framer-motion` (deja installe) pour les animations de pulsation
- `lucide-react` pour les icones (Compass, Activity, List)

