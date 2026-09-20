# Tracé géométrique des emplacements

## Proposition

Au clic sur **« Nouvel emplacement »**, afficher une petite palette de formes au-dessus de la carte :

- **Libre** : conserver le tracé actuel au doigt ou à la souris.
- **Polygone** : poser les sommets un à un ; les côtés sont parfaitement droits.
- **Rectangle** : poser un premier côté puis définir la largeur, afin de pouvoir l’orienter sur une clôture ou une façade.
- **Orthogonal** : poser librement les sommets, avec chaque nouveau côté contraint à angle droit par rapport au précédent.
- **Hexagone régulier** : poser le centre puis régler la taille et l’orientation.

La forme reste visible en aperçu avant validation. Une barre compacte propose **Annuler le dernier point**, **Recommencer**, **Valider** et **Annuler**. Les longueurs et l’angle actif sont affichés discrètement pendant le geste.

## Comportement attendu

1. Le choix de forme est proposé pour un nouvel emplacement et lors de **Redessiner**.
2. Les modes géométriques fonctionnent au clic sur ordinateur et au toucher sur mobile, sans dépendre du double-clic.
3. Le rectangle peut être orienté, l’hexagone peut être tourné, et l’orthogonal garantit des angles de 90°.
4. La surface est recalculée à partir du contour final, comme aujourd’hui.
5. Le mode **Libre** reste disponible pour les limites naturelles et les contours irréguliers.
6. Les emplacements existants et leur format de stockage restent compatibles ; aucune migration de données n’est nécessaire.

## Intégration à l’atelier

- Étendre la couche de dessin actuelle avec un mode de tracé explicite et une géométrie d’aperçu par forme.
- Ajouter le sélecteur de formes au déclenchement de **Nouvel emplacement**, sans encombrer la barre principale quand aucun dessin n’est actif.
- Remplacer le guidage uniquement textuel par des actions visibles et accessibles au clavier/toucher.
- Réutiliser exactement le même sélecteur pour **Redessiner**, en remplaçant le contour existant seulement après validation.
- Conserver les outils actuels **Transformer**, déplacer, redimensionner, annuler et lisser.

## Vérification

- Créer successivement un rectangle orienté, un hexagone, un polygone droit et un contour orthogonal.
- Vérifier les gestes sur ordinateur et mobile, notamment annulation d’un sommet et validation sans double-clic.
- Redessiner un emplacement existant avec une autre forme et confirmer qu’aucun doublon n’est créé.
- Vérifier la netteté des côtés, les angles droits, la surface sauvegardée et la réouverture de chaque emplacement.
