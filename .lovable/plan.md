

# Le Pouls du Vivant — Gradient d'Intensité Biodiversité

## Concept créatif

Transformer l'affichage binaire (blanc / documenté) en un **spectre de 5 niveaux d'intensité** inspiré d'un signal sonore — cohérent avec l'univers "Fréquence du Vivant". Chaque zone scannée reçoit un **niveau poétique** basé sur le nombre d'observations GBIF :

| Observations | Niveau | Nom poétique | Couleur | Icône |
|---|---|---|---|---|
| 0 | 0 | **Silence** | Ambre | Signal vide |
| 1–50 | 1 | **Murmure** | Vert pâle | 1 barre |
| 51–500 | 2 | **Souffle** | Vert | 2 barres |
| 501–5000 | 3 | **Chœur** | Vert profond | 3 barres |
| 5000+ | 4 | **Symphonie** | Émeraude doré | 4 barres |

## Nouvelles visualisations

### 1. Barre de synthèse "Spectre du Vivant"

En haut des résultats, un **bar chart horizontal segmenté** montrant la répartition des 16 zones par niveau. Chaque segment est coloré et cliquable (filtre la liste). L'ambassadeur voit immédiatement : "8 zones en Silence, 3 en Murmure, 2 en Souffle, 2 en Chœur, 1 en Symphonie."

### 2. Indicateur de signal sur chaque zone (liste)

Remplacer le simple dot vert/ambre par un **indicateur de signal à 4 barres** (style réception téléphone). Les barres s'allument progressivement selon le niveau. Le "Silence" montre 0 barre allumée avec un petit pulse ambre animé.

### 3. Carte : cercles proportionnels + dégradé de couleur

Sur la carte Leaflet, les CircleMarkers utilisent un **rayon proportionnel au log des observations** et un dégradé de couleur du spectre. Les zones "Silence" pulsent doucement en ambre (animation CSS).

### 4. Tooltip enrichi "Fiche de terrain"

Au hover/clic (carte et liste), un mini-widget affiche :
- Nom du lieu + distance
- **Nom poétique du niveau** ("Murmure du vivant")
- Barre de signal visuelle
- Phrase contextuelle : *"Ce territoire attend ses premiers explorateurs"* (Silence) ou *"Un chœur d'espèces résonne ici — 2 340 observations"* (Chœur)

## Modifications techniques

### Fichier : `src/components/zones-blanches/DetecteurZonesBlanches.tsx`

- Ajouter une fonction utilitaire `getIntensityLevel(observations)` retournant `{ level, name, color, phrase }`
- Nouveau composant `SignalBars` — 4 barres SVG avec remplissage conditionnel
- Nouveau composant `SpectreSynthese` — barre segmentée horizontale en haut des résultats
- Refactorer `ZoneListItem` pour intégrer SignalBars + nom poétique
- Refactorer `ZonePopupContent` pour intégrer la fiche enrichie
- Carte : rayon et couleur des CircleMarkers basés sur le niveau d'intensité
- Ajout d'une animation CSS `pulse` sur les zones Silence (carte)

### Aucun changement backend

L'edge function retourne déjà le nombre d'observations par zone. Tout le classement se fait côté client.

### Un seul fichier modifié

`src/components/zones-blanches/DetecteurZonesBlanches.tsx`

