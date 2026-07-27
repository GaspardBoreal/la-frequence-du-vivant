## Objectif

Depuis la carte de la console GPS, pouvoir voir en grand la photo d'un point cliqué — et retrouver instantanément ce point dans la liste de gauche.

## 1. Bandeau gauche synchronisé (le « bon réflexe »)

Quand on clique un point sur la carte :
- la ligne correspondante du bandeau gauche défile automatiquement en vue (scroll doux, centrée) ;
- elle est mise en évidence (fond + liseré doré discret, pulsation courte) ;
- la vignette de cette ligne devient la référence visuelle « en grand » à portée de clic.

Rien ne change au comportement inverse (clic dans la liste → recentrage carte).

## 2. Photo agrandissable depuis la vignette carte

Dans le popup de la carte :
- la photo devient cliquable (curseur zoom + petite icône loupe en surimpression) ;
- au clic → ouverture de la visionneuse plein écran déjà présente dans la console.

Même geste ajouté sur la grande vignette du panneau d'action (point sélectionné).

## 3. Visionneuse plein écran enrichie

La lightbox actuelle affiche l'image nue. Elle gagne :
- un bandeau légende : nom français, nom scientifique, statut géofence + distance, source (marcheur / iNaturalist), mention « photo d'espèce » si ce n'est pas le cliché du point ;
- navigation clavier ← → entre les points de la liste, Échap pour fermer ;
- flèches précédent/suivant à l'écran, compteur « n / total » ;
- lien « Voir sur iNaturalist » ;
- fermeture au clic sur le fond, image jamais rognée.

Naviguer dans la lightbox sélectionne aussi le point correspondant (carte + liste suivent), pour enchaîner directement écarter / repositionner / valider.

## Détails techniques

- Fichier concerné : `src/components/propriete/gps/GpsControlConsole.tsx` (aucun changement de données ni de RPC).
- Le state `lightbox: string | null` devient `lightboxId: string | null` afin de disposer du candidat complet (légende + navigation) ; la résolution de l'URL passe par `photoFor.get(id)` déjà en place.
- Le scroll de la liste utilise une `Map` de refs sur les lignes + `scrollIntoView({ block: 'center', behavior: 'smooth' })` dans un `useEffect` sur `selectedId`.
- Gestion clavier via un `useEffect` avec `keydown` monté seulement quand la lightbox est ouverte.
