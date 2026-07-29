## Où se trouve « Ajouter » aujourd'hui

L'interrupteur **Ajouter une parcelle à la propriété** est bien présent, mais il est replié dans le menu flottant en **bas à gauche de la carte** (icône « curseurs », celle qui porte la pastille chiffrée sur votre capture) : il faut ouvrir ce menu, puis basculer la ligne « Ajouter » de OFF à ON, et enfin cliquer une parcelle sur la carte.

Comme vous ne voyez pas le bandeau ambre « Seul le propriétaire… », vous avez bien les droits de curation : c'est uniquement un problème de découvrabilité.

## Ce que je propose

1. **Un vrai bouton visible** « ✛ Ajouter une parcelle » dans la barre d'outils au-dessus de la carte, à côté du champ de recherche : état ON/OFF explicite (fond ambre quand actif, libellé « Cliquez une parcelle… »). Il pilote le même état que l'interrupteur du menu, les deux restent synchronisés.

2. **L'état vide devient actionnable** : dans le panneau « Parcelles retenues », le texte « Activez "Ajouter" et cliquez une parcelle sur la carte » devient un bouton cliquable qui active directement le mode ajout — plus besoin de chercher où est l'interrupteur.

3. **Repère sur le menu flottant** : petite étiquette au survol (« Options carte & ajout de parcelles ») et mise en avant de la ligne « Ajouter » en tête de menu, pour que le lien entre le FAB et l'action soit évident.

4. **Guidage renforcé une fois le mode actif** : le bandeau « Cliquez sur une parcelle pour l'ajouter » gagne un bouton « Quitter le mode ajout », et le curseur de la carte passe en réticule pour signaler que le clic est armé.

5. Le bouton visible s'affiche aussi en **plein écran** de la carte, où le besoin est le plus fort.

## Détails techniques

- Fichier principal : `src/components/propriete/portrait/PortraitCadastre.tsx` — l'état `addMode` existe déjà ; il suffit de l'exposer dans la barre d'outils (ligne ~478) et dans l'état vide de `ParcelsList` (ligne ~442).
- `src/components/propriete/portrait/CadastreOptionsMenu.tsx` — libellé/tooltip du FAB et mise en avant de la ligne « Ajouter » (déjà pilotée par `canCurate` / `onToggleAddMode`).
- Aucun changement de base de données ni de droits : la RPC `can_curate_propriete_parcelles` et le flux d'enregistrement restent inchangés.
