# Popup « portrait » au clic sur la photo d'un entretien

Sur toutes les pages d'entretien, la photo en haut de l'article devient cliquable et ouvre une fenêtre plein écran très soignée : la photo en grand, le prénom + nom, la fonction, et trois citations fortes extraites de l'article.

## Ce que voit le visiteur

- La photo ronde du haut de page gagne un anneau lumineux au survol et une infobulle « Voir le portrait ». Elle est utilisable au clavier.
- Au clic : un voile plein écran sombre et flouté s'ouvre, avec une courte chorégraphie (~600 ms) :
  1. la photo grandit jusqu'à un format « hero » (grand portrait arrondi, halo dégradé derrière) ;
  2. le nom apparaît en grand, suivi de la fonction en petites capitales espacées ;
  3. les trois citations arrivent en cascade, chacune dans un bloc citation avec un grand guillemet et un filet d'accent.
- Fermeture : croix en haut à droite, touche Échap, ou clic sur le fond. Animation de sortie symétrique.
- Si la personne a réduit les animations dans son système, tout apparaît en simple fondu.
- L'adresse de la page ne change pas ; le référencement reste identique.

## Les trois citations

Chaque entretien reçoit trois citations reprises **mot pour mot** de son texte, jamais reformulées ni inventées :

- Laurence Karki : le basculement du marcheur qui s'arrête et observe ; l'alliance marche + poésie + biodiversité ; l'invitation finale à rejoindre l'aventure.
- Gaspard Boréal, Laurent Tripied (ses deux entretiens) : trois citations chacun, choisies dans leur texte existant.
- Le champ devient obligatoire pour tout nouvel entretien publié, donc le popup fonctionne partout par construction.

## Détails techniques

- `src/content/entretiens/index.ts` : le type `Entretien` gagne `verbatims: string[]` (3 items), accepté par `build()`. Renseigné pour les entretiens publiés.
- `src/components/entretiens/EntretienPortraitOverlay.tsx` (nouveau) : overlay en portail, `role="dialog"`, fermeture Échap / fond / croix, blocage du scroll, focus géré, animations en keyframes CSS (aucune dépendance ajoutée), tokens sémantiques uniquement (pas de couleur en dur), variante `prefers-reduced-motion`.
- `src/pages/EntretienDetail.tsx` : la photo du header devient un `<button>` qui ouvre l'overlay ; rendu du composant avec `person` + `verbatims`. Rien d'autre ne change sur la page.

## Vérification

- Typecheck.
- Test navigateur sur les entretiens publiés (mobile 390 px et bureau) : ouverture, animation, fermeture, lisibilité des citations.
