# Correction visibilité « Préparer upload iNat »

## Diagnostic

Sur la capture, Vincent Levavasseur affiche **« Aucune espèce identifiée pour le moment »**. Or dans `ContributionsSubTab` (`src/components/community/exploration/MarcheursTab.tsx`), le code retourne **tôt** sur cet état vide (lignes 482–492) **avant** d'atteindre le bandeau qui contient le bouton « Préparer upload iNat » (ligne 523).

Résultat : précisément quand le bouton est le plus utile (photos non encore identifiées à envoyer sur iNat), il est masqué.

Le hook `useIsCurator` lui-même fonctionne correctement pour Gaspard (sentinelle + participant à un évènement de l'exploration). Le seul problème est l'ordre de rendu.

## Correctif

Dans `src/components/community/exploration/MarcheursTab.tsx > ContributionsSubTab` :

1. **Supprimer le early-return « 0 espèces »** et le remplacer par un rendu unifié qui affiche **toujours** :
   - le bandeau compteur + bouton prep iNat (visible si `isCurator`)
   - puis soit l'empty-state poétique, soit le `SpeciesExplorer`
2. Le compteur s'adapte : « 0 espèce identifiée » au lieu de masquer le header.
3. Le `InatUploadPrepDrawer` reste monté pour permettre l'export indépendamment du nombre d'espèces identifiées (le drawer scanne `marcheur_medias` + `marcheur_observations` non identifiées → n'a pas besoin d'espèces existantes).
4. Conserver le squelette de loading inchangé.

## Hors scope

- Pas de modification de `useIsCurator` (la logique sentinelle/ambassadeur + participation reste correcte).
- Pas de modification de `useMarcheurUnidentifiedPhotos` ni du drawer (déjà autonomes).
- Pas de modification de mémoire (le flow reste celui documenté dans `mem://features/community/inat-upload-prep-logic`).

Une seule modification dans un seul fichier.
