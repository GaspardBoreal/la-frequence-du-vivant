## Ce que disent les données (vérifié)

L'ouvrage « Massif Fréquence 01 » est un polygone très fin : ~9 m × 2,4 m (21 m²).
Requête sur les observations autour de son emprise :

- ~10 observations tombent **strictement dans** le polygone,
- une dizaine d'autres tombent dans le **collier de 3 m** (`EDGE_TOLERANCE_M`) que `classifyObservations` classe en `lisiere`,
- l'herbier « En place » additionne aujourd'hui `dedans + lisiere` sans distinction ni réglage → **19**.

Sur un ouvrage de 2,4 m de large, un collier de 3 m double quasiment la surface écoutée : c'est là que naît l'écart avec les ~6 sujets que vous comptez visuellement. Aucun rayon d'observation n'intervient (le code passe déjà `radius = 0`) — le coupable est la tolérance de lisière, pas un rayon.

## Proposition : le « Curseur de rigueur »

Un seul geste, lisible, dans le bandeau « En place », au-dessus de la liste.

```text
En place                                  19 → 10
Rigueur   ● Strict      Lisière +3 m      Voisinage +Xm
          dans l'emprise   GPS tolérant     autour
[ 10 dedans ] [ 9 lisière ] [ 0 voisinage ]   ⟵ chips vivantes
```

1. **Trois crans de rigueur** (segmented control), défaut = **Strict** :
   - *Strict* : uniquement `dedans` (ray casting sur la géométrie réelle).
   - *Lisière* : + collier 3 m (comportement actuel).
   - *Voisinage* : + un rayon réglable depuis le bord (slider 1→15 m), pour piocher ce qui pousse juste à côté.
2. **Chips de comptage** toujours visibles (`10 dedans · 9 lisière · 0 voisinage`) : on voit ce qu'on exclut, jamais de perte silencieuse.
3. **Badge de zone sur chaque fiche** : liseré plein = dedans, liseré pointillé + pastille « lisière 1,8 m » = collier, pastille grise = voisinage. Chaque fiche affiche sa distance réelle au bord.
4. **Survol = révélation sur le plan** : survoler une fiche fait pulser ses points sur la carte ; inversement, un halo doux dessine l'emprise + le collier actif quand on change de cran, pour matérialiser physiquement ce qu'on écoute.
5. **« Tout poser » respecte le cran actif** : on ne pose jamais en masse des sujets qu'on a exclus visuellement.
6. **Rigueur par scénario** : le cran choisi est mémorisé dans le scénario (donc restitué à la réouverture depuis la bibliothèque), avec repli sur *Strict*.
7. Combinaison intacte avec le sélecteur de portée existant (cet ouvrage / ouvrages choisis / toute la propriété) : rigueur = profondeur, portée = étendue.

## Détails techniques

- `src/lib/ouvrageScope.ts` : rendre `EDGE_TOLERANCE_M` paramétrable (`classifyObservations(geometry, items, radiusM, edgeToleranceM)`), défaut inchangé pour les autres appelants.
- `ScenographeFullscreen.tsx` : nouvel état `rigour: 'strict' | 'lisiere' | 'voisinage'` + `neighbourM`, appliqué dans `inPlaceEntries` ; chaque `HerbierEntry` porte désormais `zone` et `distanceM` (min sur ses points).
- Nouveau composant `HerbierRigourPicker.tsx` (crans + chips + slider), posé sous `HerbierScopePicker`.
- `HerbierPanel.tsx` : badge de zone + distance sur la fiche, callbacks `onHoverEntry` pour la mise en évidence carte.
- `PlantingLayer` / `OuvrageGeometryLayer` : halo du collier actif et pulsation des points survolés (purement visuel).
- Persistance : champ `rigour` dans le JSON du scénario (`useOuvrageScenarios`), sans migration SQL (colonne JSON existante).

## Hors périmètre

Pas de recalcul des données sources ni de correction GPS ici — le Contrôle GPS reste l'outil pour déplacer une observation mal placée.
