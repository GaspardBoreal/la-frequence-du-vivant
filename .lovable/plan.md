## Diagnostic

Le replay montre que le zoom s’ouvre, que `Zoom +` monte bien jusqu’à `4.0x`, puis que le clic en haut à droite ferme la lightbox. Le problème restant n’est donc plus seulement l’ouverture du portail : la lightbox est techniquement active, mais l’expérience reste fragile en plein écran/tablette.

Causes probables identifiées dans le code :
- Le mode Découvrir demande le fullscreen sur `document.documentElement`, alors que l’overlay Découvrir est portalé dans `document.body`. Cela crée une hiérarchie fullscreen/portal peu fiable selon navigateur/tablette.
- `ZoomLightbox` utilise le composant `Dialog` global Radix. Or Radix ajoute focus trap, overlay, dismiss handling et scroll lock global, ce qui est trop lourd pour un zoom imbriqué dans un jeu déjà plein écran.
- Les boutons `+ / - / Revenir` stoppent une partie des événements, mais pas tous les événements pointeur/clic/capture utiles en contexte transform/pan/drag.
- Le bouton loupe dans Tri vivant est dans une carte draggable `@dnd-kit`, donc le capteur peut encore entrer en concurrence avec le clic loupe sur tactile.

## Mise en œuvre proposée

1. **Stabiliser le fullscreen Découvrir**
   - Demander le fullscreen sur le vrai conteneur `DiscoverFullscreen` (`rootRef.current`) plutôt que sur `document.documentElement`.
   - Ne pas fermer toute l’expérience Découvrir quand le fullscreen navigateur est quitté si une sous-lightbox zoom est ouverte.
   - Garder le fallback overlay si `requestFullscreen` échoue.

2. **Remplacer le zoom par une lightbox dédiée, sans Radix Dialog**
   - Transformer `ZoomLightbox` en overlay React portal léger, rendu dans `document.fullscreenElement` quand il existe, sinon `document.body`.
   - Conserver `react-zoom-pan-pinch`, mais supprimer les comportements Radix qui peuvent fermer/masquer l’overlay.
   - Ajouter un fond plein écran `z-[3000]`, `position: fixed`, `touch-action: none`, `overscroll-behavior: contain`.
   - Ne fermer que via la croix, `Revenir au jeu`, ou Escape ; jamais sur clic involontaire dans le fond pendant zoom/pan.

3. **Sécuriser les interactions zoom tablette/souris**
   - Créer un helper local `stopZoomEvent` appliqué à la toolbar et au bouton loupe : `pointerdown`, `pointerup`, `click`, `touchstart`, `touchend`, `mousedown`, avec `preventDefault` seulement là où nécessaire.
   - Sur les actions `Zoomer`, `Dézoomer`, `Réinitialiser`, stopper explicitement l’événement avant d’appeler `zoomIn/zoomOut/resetTransform`.
   - Ajouter `aria-label` stables et zones tactiles plus larges.

4. **Isoler Tri vivant de @dnd-kit pendant le zoom**
   - Sur le bouton loupe, empêcher totalement le déclenchement des listeners draggable.
   - Dans `DraggableCard`, ignorer le tap carte si l’événement provient d’un élément `data-no-dnd`.
   - Fermer/neutraliser l’état drag actif quand la lightbox s’ouvre.

5. **Validation du parcours complet**
   - Simuler le chemin : Exploration → Biodiversité/Apprendre → Découvrir → Enfant → Memory / Qui suis-je / Tri vivant → loupe → Zoom + → Zoom - → Revenir.
   - Vérifier dans le DOM : overlay visible, valeur de zoom qui change, fullscreen conservé si disponible, pas d’erreur console, retour au jeu propre.
   - Tester avec viewport tablette/tactile Playwright, même si l’auth complète n’est pas injectable sur ce projet externe.