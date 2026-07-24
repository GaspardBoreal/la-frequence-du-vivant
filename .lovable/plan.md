## Objectif
Aligner la carte 8 « Analyse sensorielle du site » sur le format visuel des cartes 1 à 7 (même rythme, mêmes proportions, même hiérarchie), tout en conservant ses champs texte + slider spécifiques.

## Constats
Actuellement `SensorialBlock.tsx` diverge de `ObservationCard.tsx` sur :
- **Ratio illustration** : `aspect-[16/6]` au lieu de `aspect-[16/7]`.
- **Animation du filet** sous le titre : absente (statique).
- **Grille de choix** : remplacée par une pile verticale de textareas encadrées, ce qui casse le rythme visuel des 7 cartes précédentes.
- **Padding / spacing** : légèrement différent du padding `p-5 md:p-6 pt-2` utilisé sous les choix.
- Citation italique intercalée qui n'existe pas ailleurs.

## Modifications (uniquement `src/components/propriete/observe/SensorialBlock.tsx`)

1. **Header identique** : conserver le badge « 8 », catégorie, titre italique, mais rétablir le filet animé `motion.div` avec `scaleX` comme dans `ObservationCard`.
2. **Illustration** : passer à `aspect-[16/7]` + `hover:scale-105` transition 6s, pour matcher les autres cartes.
3. **Citation** : la déplacer en petit chapeau discret (ou la retirer si trop lourde) — à valider, par défaut je la conserve en italique fine juste sous l'image, avec les mêmes marges que les autres cartes.
4. **Zone contenus** : garder la structure `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-5 md:p-6 pt-2` visuellement, mais adaptée :
   - Chaque champ sensoriel (Sons, Odeurs, Textures, Vues, Ambiance) devient une **tuile carrée** au même style que `ChoicePicto` (bord fin, radius, hover forêt) contenant l'icône en haut + label en `[10px] uppercase tracking` + un textarea compact en dessous.
   - Le **slider d'intensité** occupe une tuile pleine largeur (`col-span-full`) sous la grille, dans le même cadre arrondi.
5. **Animations** : reprendre `motion.article` avec les mêmes props (`initial/whileInView/viewport/transition`) — déjà en place, OK.

## Résultat attendu
La carte 8 se lit comme la 8ᵉ tuile d'un carnet homogène : même en-tête, même bandeau illustré 16/7, même grille tuilée que les cartes 1-7, avec la spécificité texte + slider intégrée dans ce format plutôt qu'à côté.

## Hors périmètre
Pas de changement de données, pas de refonte du hook `usePropertyObservation`, pas de modif du parent `TabObserve`.