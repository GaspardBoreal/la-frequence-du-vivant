# Fenêtre « Valider l'entretien » masquée par le menu

## Ce qui se passe

La fenêtre de validation de l'entretien (`ValidationDialog`) est un voile posé à la main avec un niveau de superposition de **50**. Or la barre d'onglets de la page jardin est « collante » au niveau **60** et son menu déroulant au niveau **80** : ils passent donc **au-dessus** de la fenêtre, qui semble glisser sous le menu.

## Correction

Dans `src/components/propriete/portrait/PortraitEntretiens.tsx` :

- Porter le voile de la fenêtre de validation de `z-50` à `z-[1200]`, soit le même niveau que toutes les fenêtres standard du site (composant `Dialog`), avec le même niveau pour le contenu.
- Vérifier qu'aucune autre fenêtre faite main dans ce fichier (révision, historique) n'utilise un niveau inférieur à 60 — les aligner le cas échéant.

## Vérification

- Ouvrir la fiche entretien d'un jardin, cliquer « Valider l'entretien » : la fenêtre recouvre entièrement la barre d'onglets et le menu, sur mobile comme sur ordinateur.
- La fermeture (croix, clic à l'extérieur) reste fonctionnelle.
