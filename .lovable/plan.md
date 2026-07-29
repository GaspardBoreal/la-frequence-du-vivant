## Diagnostic (vérifié dans le code)

« Mare » n'est pas un objet mais un **emplacement** (zone). Or :

- Le panneau `ObjectInspector` que j'ai repositionné ne s'ouvre que pour les **objets** (`ObjectsLayer`, sélection par clic) — jamais pour un emplacement.
- Les polygones d'emplacement (`PaletteStudio.tsx`, ~ligne 528) n'ont qu'un handler : `click: () => onSelectZone(active ? null : z.id)`. Un **double-clic déclenche deux clics** : sélection puis désélection immédiate → rien ne se passe visuellement, et Leaflet zoome par-dessus.
- L'édition d'un emplacement (nom, couleur, opacité, note, transformer, redessiner, supprimer) n'existe aujourd'hui que dans le panneau latéral gauche « Calques → Emplacements ». Il n'y a **aucun éditeur sur la carte** pour une zone.

C'est pour ça que rien n'apparaît au double-clic sur la Mare.

## Ce que je vais faire

### 1. Un éditeur d'emplacement sur la carte
Nouveau composant `ZoneInspector` (même langage visuel que `ObjectInspector` : liseré de couleur, en-tête collant, corps scrollable, tokens `--ds-*`) avec :
- en-tête : pastille de couleur, nom de l'emplacement, surface (`fmtArea`) et nombre d'objets rattachés ;
- champs : Nom, Couleur, Opacité (slider), Visible, Intention / note de chantier ;
- actions : **Transformer** (lance `zoneTransform.start`), **Redessiner**, **Supprimer**, Fermer (Échap ferme aussi).

### 2. Ouverture au double-clic (et au clic simple)
Sur les polygones de zone :
- `click` → sélectionne l'emplacement et ouvre l'éditeur (plus de bascule qui annule la sélection) ;
- `dblclick` → ouvre l'éditeur et **bloque le zoom Leaflet** (`L.DomEvent.stopPropagation` + `preventDefault`), pour que le double-clic ne fasse plus fuir la carte ;
- clic sur le fond de carte ou bouton Fermer → referme.

### 3. Position demandée : à droite, centrée verticalement
`ZoneInspector` et `ObjectInspector` partagent le même emplacement d'ancrage :
- desktop : colonne droite, **centrée verticalement** (`top-1/2 -translate-y-1/2`, `right-4`), hauteur bornée avec corps scrollable — donc jamais sous le bandeau Géo/Sat/Relief ni sur le curseur temporel ;
- mobile : feuille basse pleine largeur, comme déjà fait.

Les constantes de `src/components/maps/mapChrome.ts` sont complétées avec un ancrage `MAP_CHROME_SIDE_CENTER` pour que les deux inspecteurs restent alignés.

### 4. Cohérence avec le mode Transformer
Quand le mode Transformer est actif sur la zone, l'éditeur reste ouvert mais passe en mode compact (surface avant/après visible), pour ne pas doubler l'info avec la barre Transformer du haut.

## Fichiers concernés
- `src/components/propriete/palette/studio/ZoneInspector.tsx` (nouveau)
- `src/components/propriete/palette/studio/PaletteStudio.tsx` — handlers `click`/`dblclick` des polygones, montage de l'éditeur
- `src/components/propriete/palette/studio/ObjectInspector.tsx` — alignement sur le nouvel ancrage centré
- `src/components/maps/mapChrome.ts` — ancrage latéral centré partagé
