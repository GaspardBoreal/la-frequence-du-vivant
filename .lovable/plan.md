# Correction complète de l’Atelier du jardin

## Diagnostic confirmé

- L’entrée « Atelier du jardin » change d’abord l’onglet vers `palette`, puis déclenche un événement global `propriete:open-atelier` après un délai arbitraire de 60 ms (`ProprieteEspace.tsx`).
- Le seul listener actuellement actif vit dans `TabPalette`, composant monté à l’intérieur du `TabsContent` Palette. L’ouverture dépend donc d’une course entre le montage de l’onglet et l’arrivée de l’événement ; une fois le composant démonté ou son état perdu, l’événement peut ne plus être reçu.
- Un ancien système complet d’ouverture existe encore dans `ZonesMapBlock` : second état local, second listener global et second montage de `PaletteStudio`. Ce composant n’est plus rendu, mais son import et tout le code historique subsistent et rendent la chaîne difficile à maintenir.
- Le navigateur remonte aussi une exception Leaflet pendant la fin d’une transition de zoom (`_leaflet_pos`). L’Atelier lance actuellement un `FitBounds` animé dès son montage ; il faut sécuriser ce cycle montage/démontage avant de considérer le problème résolu.

## Correction structurelle

1. **Une seule source de vérité dans la page propriété**
   - Remonter l’état `atelierOpen` dans `PropTabs`, au même niveau que l’onglet actif.
   - Remplacer le `setTimeout` et le `CustomEvent` par une action React directe et atomique : sélectionner l’onglet Palette puis demander l’ouverture de l’Atelier.
   - Passer l’état contrôlé et son callback de fermeture à `TabPalette`, afin que la première ouverture, la fermeture et toutes les réouvertures suivent exactement le même chemin.

2. **Un seul montage de l’Atelier**
   - Retirer de `TabPalette` le listener global et son état local concurrent.
   - Conserver un unique `PaletteStudio`, contrôlé par le parent.
   - Stabiliser les callbacks d’ouverture/fermeture pour éviter que les effets clavier et scroll soient réabonnés à chaque rendu.

3. **Nettoyage du code historique**
   - Supprimer l’import inutilisé de `ZonesMapBlock`.
   - Supprimer `ZonesMapBlock.tsx`, désormais sans appel dans le projet et contenant l’ancien double montage de l’Atelier.
   - Vérifier qu’il ne reste aucun `propriete:open-atelier`, aucun `studioOpen` concurrent et aucun second montage de `PaletteStudio`.

4. **Sécurisation Leaflet**
   - Désactiver l’animation du cadrage initial de la carte de l’Atelier : le plan doit se positionner immédiatement sans laisser une transition active pendant un éventuel démontage.
   - Durcir le nettoyage de `SafeMapContainer` en arrêtant explicitement les animations Leaflet avant la suppression de la carte et en rendant la destruction idempotente.
   - Garder les données et outils de l’Atelier intacts : ouvrages, calques, parcelles, Observations, sol et filtres de session ne changent pas.

## Validation obligatoire

- Tester dans le navigateur : ouvrir → fermer par le bouton → rouvrir, au moins trois cycles.
- Tester aussi : fermeture par Échap, réouverture après changement d’onglet, ouverture rapide depuis le menu, interaction avec zoom/cadastre puis fermeture.
- Vérifier que le scroll de page est restauré après chaque fermeture et rebloqué à chaque ouverture.
- Contrôler qu’il n’existe qu’un seul overlay Atelier dans le DOM et qu’aucune erreur `_leaflet_pos`, aucun double montage Leaflet et aucun avertissement lié à ce flux n’apparaissent en console.
- Faire une vérification desktop et mobile sans modifier l’interface ni les règles métier.

## Périmètre technique

Fichiers principaux : `ProprieteEspace.tsx`, `TabPalette.tsx`, `PaletteStudio.tsx`, `RichMap.tsx` / `FitBounds.tsx`, `SafeMapContainer.tsx`, et suppression du composant historique `ZonesMapBlock.tsx`. Aucune migration, aucune donnée modifiée, aucune URL publique touchée.