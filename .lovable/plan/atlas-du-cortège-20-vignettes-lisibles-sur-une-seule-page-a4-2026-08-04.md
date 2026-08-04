# Atlas du cortège : 20 vignettes lisibles sur une seule page A4

Aujourd'hui la planche imprimée déborde : la 5e rangée est coupée en bas de page. Les 4 premières lignes passent, la dernière est amputée (photos tronquées, noms et pastilles invisibles).

## Pourquoi ça déborde

Mesures réelles du gabarit A4 actuel (page 296 mm, marges 14/13/12 mm) :

```text
Hauteur utile ...................... 270 mm
En-tête « Atlas du cortège » ....... ~17 mm
Pied de page (légende + source) .... ~15 mm
Reste pour la grille ............... ~238 mm
5 rangées + 4 gouttières de 4 mm ... 44,5 mm par rangée disponibles

Hauteur réelle d'une vignette :
  photo carrée (1/1) sur 40,5 mm de large = 40,5 mm
+ légende (nom + latin + pastilles)       = ~11 mm
= 51,5 mm  →  7 mm de trop par rangée, soit ~35 mm de débord
```

La photo carrée est la cause : elle impose une hauteur supérieure à la place disponible.

## Ce qu'on change — planche « herbier » 4 × 5

- **Format photo en 4/3 paysage** au lieu du carré : 30,4 mm de haut au lieu de 40,5. La rangée retombe à ~41,5 mm, avec 3 mm de marge de sécurité. Le cadrage `object-fit: cover` conserve le sujet centré, la lisibilité botanique reste excellente en 40 × 30 mm.
- **Grille verrouillée en 5 rangées égales** (`grid-template-rows: repeat(5, 1fr)`), la photo occupant l'espace restant de la cellule. Résultat : quel que soit le nombre d'espèces (1 à 20), aucune rangée ne peut déborder — la page est mathématiquement close.
- **Légende resserrée et hiérarchisée** : nom français en 6,8 pt gras sur une ligne (troncature élégante par ellipse si trop long), nom latin en italique 6,2 pt, pastilles E/T/N/pH sur une seule ligne en 5,2 pt. Interlignes réduits, gouttières verticales à 3,5 mm.
- **Soin typographique** : filet fin sous chaque légende pour rythmer la planche, numéro de vignette réduit (3,8 mm) et pastille « Terrain » en 4,6 pt, pour que les repères ne mangent plus la photo.
- **Pied de page compacté** sur deux lignes au lieu de trois (légende des axes + signature/source sur la même ligne), ce qui libère 4 mm supplémentaires.
- Au-delà de 20 espèces, le comportement actuel est conservé : une seconde planche numérotée « Planche 2 / N ».

## Détails techniques

- `src/index.css`, bloc `=== ATLAS DU CORTÈGE ===` (l. 2407-2513) :
  - `.flora-atlas-grid` : ajout de `grid-template-rows: repeat(5, 1fr)`, `gap: 3.5mm 4mm`, `align-content: stretch`.
  - `.flora-atlas-cell` : `display: flex; flex-direction: column; min-height: 0;`.
  - `.flora-atlas-photo` : `aspect-ratio: 4 / 3; flex: 1; min-height: 0;` (plus de carré forcé).
  - `.flora-atlas-name` : 6,8 pt, `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`.
  - `.flora-atlas-latin` : 6,2 pt ; `.flora-atlas-pastille` : 5,2 pt, `flex-wrap: nowrap`.
  - `.flora-atlas-num` : 3,8 mm / 6,8 pt ; `.flora-atlas-field` : 4,6 pt.
  - `.flora-atlas-foot` : passage en deux lignes (`flex-direction: row; flex-wrap: wrap; justify-content: space-between`), marge haute 3 mm.
- `src/components/propriete/identify/print/FloraAtlasPrintPlates.tsx` : `ATLAS_PER_PAGE` reste à 20 ; ajustement du pied de page pour la mise en deux lignes.
- Aucun changement de données ni de logique de résolution des photos.
