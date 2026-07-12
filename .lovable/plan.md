## Objectif

Sur les fiches Jardin immersives (`/jardin/:slug`), retirer le bouton flottant "Rejoindre la Fréquence" et remplacer la copie du CTA final par un message court et inspirant invitant à s'inscrire pour découvrir le jardin et participer à la mesure de la biodiversité.

## Changements

### 1. Masquer le FAB "Rejoindre la Fréquence"

Fichier : `src/components/adhesion/AdhesionFab.tsx`

Ajouter `/jardin/` à la liste `hideOn` (déjà utilisée pour Carte des Marches, admin, etc.). Le bouton flottant disparaîtra automatiquement sur toutes les fiches jardin.

### 2. Adapter la copie du CTA final (Section 3, "Matrice saisonnière")

Fichier : `src/pages/ImmersiveGardenFiche.tsx` (lignes ~381-398)

Actuellement la section se termine par un bouton "Soutenir ce jardin" pointant vers `/m/:slug` ou la carte.

Nouvelle proposition :

- **Titre inchangé** : "Le jardin change de peau" reste
- **Ajout d'un bloc CTA sous le sélecteur de saisons** avec :
  - Une phrase courte et inspirante, par exemple :
    > *"Inscrivez-vous pour entrer dans ce jardin et devenir sentinelle du vivant qui l'habite."*
  - Bouton primaire "Rejoindre ce jardin" → `/marches-du-vivant/connexion?redirect=/jardin/<slug>`
  - Lien secondaire discret conservé : "Voir la fiche événement classique"

Le bouton "Soutenir ce jardin" existant est remplacé par ce nouveau CTA d'inscription (plus aligné avec l'intention pédagogique).

### Détails techniques

- La liste `hideOn` dans `AdhesionFab.tsx` fait un `startsWith`, donc `/jardin/` couvre toutes les fiches.
- Le nouveau CTA réutilise `OrganicButton` variant `emerald` déjà présent, plus un `<p>` en `font-serif italic` couleur `#f4ecd4/80` pour la copie.
- Aucun changement de route, aucun changement de données.

## Copie proposée (à valider)

- Phrase : *"Inscrivez-vous pour entrer dans ce jardin et devenir sentinelle du vivant qui l'habite."*
- Bouton : *"Rejoindre ce jardin"*

Dis-moi si tu veux ajuster la formulation avant que j'implémente.