# Preuves de terrain : une planche qui s'adapte au nombre de vignettes

À 12 vignettes, la dernière rangée est coupée : les photos débordent en bas de page et les légendes (date · emplacement) disparaissent.

## Pourquoi ça déborde

Mesures réelles du gabarit A4 actuel (padding 16/16/14 mm) :

```text
Hauteur utile ........................ 267 mm
En-tête (Preuves de terrain + titre)  ~28 mm
Pied de page .........................  ~9 mm
Reste pour la grille ................. 230 mm

Vignette actuelle (3 colonnes, photo carrée) :
  largeur cellule = (210 - 32 - 12) / 3 = 55,3 mm
  photo 1/1 ........ 55,3 mm
+ légende .......... ~6 mm
= 61 mm par rangée

4 rangées + 3 gouttières de 6 mm = 262 mm  →  32 mm de débord
```

La photo carrée est la cause, exactement comme pour l'Atlas du cortège.

## Ce qu'on change — densité adaptative

La planche calcule sa densité selon le nombre réel de vignettes de la page et applique le gabarit correspondant :

| Vignettes | Grille | Photo | Légende |
|---|---|---|---|
| 1–4 | 2 × 2 | 4/3 généreux | 8 pt, note sur 2 lignes |
| 5–6 | 3 × 2 | 4/3 | 7,5 pt |
| 7–9 | 3 × 3 | 4/3 | 7 pt |
| 10–12 | 3 × 4 | 3/2 paysage | 6,4 pt, une ligne + ellipse |

Principes communs :

- **Rangées verrouillées** (`grid-template-rows: repeat(n, 1fr)`) : la page est mathématiquement close, aucune rangée ne peut sortir quel que soit le contenu.
- **Photo élastique** : la photo prend la hauteur restante de la cellule (`flex: 1; min-height: 0`), la légende garde toujours sa place réservée en bas.
- **Format paysage** au lieu du carré : le cadrage `object-fit: cover` conserve le sujet centré, la lisibilité du prélèvement reste excellente en 55 × 37 mm.
- **Légende compacte et hiérarchisée** en mode dense : date en gras, emplacement à la suite, note en italique tronquée par ellipse — plus jamais coupée par le bas de page.
- **Pastille de prélèvement** (A, C, E…) réduite à 4,2 mm en mode dense pour ne pas manger la photo.
- Au-delà de 12, le comportement actuel est conservé : planche « suite 2/N ».

## Détails techniques

- `src/components/propriete/analyze/print/TestMediaPrintPlates.tsx` : ajout d'une classe de densité sur la grille (`combined-print-plate-grid--d4 / d6 / d9 / d12`) dérivée de `plate.photos.length`, et passage du nombre de rangées en variable CSS `--plate-rows`.
- `src/index.css`, bloc « Planches Preuves de terrain » (l. 1451-1490) :
  - `.combined-print-plate-grid` : `grid-template-rows: repeat(var(--plate-rows), 1fr)`, `gap: 4mm`, `align-content: stretch`, `min-height: 0`.
  - `.combined-print-thumb` : `display: flex; flex-direction: column; min-height: 0`.
  - `.combined-print-thumb-frame` : `flex: 1; min-height: 0`, `aspect-ratio` piloté par la classe de densité (4/3 puis 3/2).
  - `.combined-print-thumb-cap` : tailles par densité, `--d12` en 6,4 pt avec troncature `nowrap` + ellipse sur la note.
  - `.combined-print-thumb-pin` : 4,2 mm / 7 pt en densité 12.
- Aucun changement de données, de tri des médias ni de logique de découpe en planches.
