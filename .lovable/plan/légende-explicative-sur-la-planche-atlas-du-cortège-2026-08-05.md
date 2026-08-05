# Légende explicative sur la planche « Atlas du cortège »

Ajouter, sous la grille de vignettes, un encart imprimé lisible qui explique les quatre pastilles E / T / N / pH, l'échelle des valeurs et la méthode employée.

## Ce que verra le lecteur

Un encart en bas de planche, sur toute la largeur, en quatre colonnes (une par axe) :

```text
┌──────────────────────────────────────────────────────────────────────┐
│ LIRE LES PASTILLES — coefficients écologiques (échelle −3 … +3)      │
│ ● E  Eau        −3 très sec ......... 0 indifférent ....... +3 humide │
│ ● T  Texture    −3 sable léger ...... 0 indifférent ....... +3 argile │
│ ● N  Nutrition  −3 sol pauvre ....... 0 indifférent ....... +3 riche  │
│ ● pH Réaction   −3 acide ............ 0 indifférent ....... +3 calc.  │
│ Pastille pâle = espèce indifférente sur cet axe. Intensité de la      │
│ couleur = force de l'indication.                                      │
│ Méthode : lecture bio-indicatrice D.S. · réf. Flore Forestière        │
│ Française (Rameau, Mansion, Dumé)                                     │
└──────────────────────────────────────────────────────────────────────┘
```

L'encart reprend la couleur de chaque axe (bleu eau, brun texture, vert nutrition, mauve pH) déjà utilisée sur les vignettes, pour que le lien soit immédiat.

## Où et quand il s'affiche

- Sur la dernière planche uniquement si plusieurs planches (évite la répétition), en pied de page ; sur la planche unique s'il n'y en a qu'une.
- La ligne récapitulative actuelle en pied de page est remplacée par cet encart (plus de doublon).

## Détails techniques

- `src/components/propriete/identify/print/FloraAtlasPrintPlates.tsx` : nouveau sous-composant `AtlasLegendBox`, rendu entre `.flora-atlas-grid` et `.flora-atlas-foot`, alimenté par la constante `AXES` existante (lettre, hue, libellés neg/pos) plus la source `ECO_SOURCE`.
- `src/index.css` : styles print `.flora-atlas-legend` (grille 4 colonnes, bordure fine, fond très clair, typo ~4,2 pt titres / 3,6 pt corps, `break-inside: avoid`).
- Contrainte de pagination : la grille 5×4 remplit déjà la page A4. Pour loger l'encart sans déborder, la hauteur de ligne des vignettes est légèrement réduite sur la page portant la légende (classe `flora-atlas-page--with-legend`), les autres planches restent inchangées.
- Vérification : impression Étape 3 avec 20+ espèces (2 planches) et avec moins de 20 (planche unique), contrôle qu'aucune page blanche n'apparaît.
