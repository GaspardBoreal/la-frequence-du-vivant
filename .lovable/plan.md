# Copier, orienter et composer les emplacements

## Objectif
Transformer la copie d’un emplacement en véritable geste de composition paysagère : dupliquer une forme, choisir son contenu, la déplacer, l’orienter ou la retourner, puis valider sans modifier l’original.

## Parcours proposé
1. Ajouter **Dupliquer** dans la fiche et le menu rapide de chaque emplacement.
2. Au clic, ouvrir un choix compact :
   - **Emplacement seul** : contour, nom, couleur, opacité, note et sélection végétale.
   - **Avec ses ouvrages** : mêmes éléments, plus les ouvrages rattachés et leur position relative.
3. Créer immédiatement une copie légèrement décalée, nommée « … (copie) », puis l’ouvrir dans un **mode Composition** sur la carte.
4. Afficher une barre mobile-first, toujours accessible au pouce :
   - déplacer et redimensionner directement sur la carte ;
   - poignée de rotation libre ;
   - boutons **90°**, **Miroir horizontal**, **Miroir vertical** dans les outils complémentaires ;
   - **Annuler le geste**, **Abandonner** ou **Valider**.
5. Sur **Abandonner**, supprimer la copie provisoire et ne rien changer à l’original. Sur **Valider**, conserver la copie et ses éventuels ouvrages.

## Expérience paysagiste
- La copie apparaît avec un contour renforcé et un léger effet fantôme pour la distinguer de l’original.
- Les symétries sont instantanées et réversibles avec l’historique d’annulation.
- La surface reste visible pendant la transformation ; une rotation ou un miroir ne la modifie pas.
- Sur téléphone, les opérations discrètes restent des boutons suffisamment grands ; seul le déplacement, l’échelle et la rotation utilisent un geste sur le plan.
- La copie reste limitée au plan actuellement ouvert, sans bibliothèque de gabarits.

## Détails techniques
- Réutiliser le mode de transformation existant et ses calculs géométriques ; ajouter les opérations pures de miroir et la rotation par pas de 90°.
- Décaler la copie initiale à l’échelle du contour afin qu’elle soit immédiatement visible, quelle que soit la taille du jardin.
- Dupliquer la sélection végétale liée à l’emplacement. Pour l’option complète, cloner les ouvrages en leur appliquant exactement la même translation, rotation ou symétrie que le contour et les rattacher au nouvel emplacement.
- Conserver les identifiants de l’original intacts ; chaque copie reçoit de nouveaux identifiants.
- En cas d’échec d’une partie de la copie, revenir à l’état initial plutôt que laisser un emplacement incomplet.

## Vérifications
- Tester les deux choix de copie, avec et sans ouvrages.
- Vérifier déplacement, rotation libre, rotation 90°, deux miroirs, annulation, abandon et validation.
- Contrôler que les ouvrages conservent leurs positions relatives et que l’original ne change jamais.
- Vérifier la lisibilité et l’absence de chevauchement des commandes sur téléphone et grand écran.
