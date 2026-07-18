## Diagnostic
Le bouton reste sur « Composition en cours… » puis se termine sans afficher de proposition. Deux causes possibles (masquées par le `try/finally` silencieux dans `handleGenerate`) :

1. **Erreur runtime dans `renderWallpaper`** — probablement `canvas.toDataURL()` qui jette une `SecurityError` si une photo iNat s'est chargée sans en-tête CORS et a « pollué » le canvas. Le `drawGrain` interne est protégé, mais `toDataURL` non → le `for` s'arrête à la 1re proposition, `results` reste vide, aucune preview n'apparaît.
2. **`pickPhotos` renvoie 0 photo** pour la combinaison choisie (règne × catégorie × marche) → le `continue` saute les 4 itérations et on termine avec 0 proposition, sans message.

Aucune des deux ne remonte à l'UI : le `catch` est absent et l'utilisateur ne voit rien.

## Correctifs

### 1. `src/components/wallpaper-studio/WallpaperStudio.tsx`
- Ajouter `try/catch` par itération dans `handleGenerate`, logger l'erreur (`console.error`) et continuer avec la variante suivante.
- Ajouter un état `error: string | null` et un toast (via `sonner`) affiché si :
  - 0 photo trouvée pour la combinaison → « Aucune photo disponible pour ce règne/cette marche — essaie une autre combinaison ».
  - Toutes les propositions ont échoué → message d'erreur explicite.
- Toujours passer `crossOrigin` déjà géré côté renderer, mais fallback : si `canvas.toDataURL` jette, régénérer sans grain (le grain utilise `getImageData` qui pollue) — voir #2.

### 2. `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`
- Envelopper le rendu final dans un try/catch qui, si `toDataURL` ou `getImageData` échoue à cause de CORS, refait un rendu **sans `drawGrain`** (car c'est cet appel qui rend le canvas "tainted" côté détection).
- Plus proprement : détecter en amont si une image est CORS-tainted (test rapide via `getImageData` sur 1px après chargement) et sauter le grain si oui.
- Ajouter un `console.warn` explicite en cas de canvas pollué pour tracer.

### 3. Renforcer `renderWallpaper`
- Enrouler chaque bloc (backdrop, variant, signature, QR, CTA) dans un try/catch local avec `console.warn('[wallpaper] step X failed', e)` pour que même si le CTA nouveau plante, on retourne quand même le canvas complet.

## Résultat attendu
- Si les photos existent : les 4 propositions s'affichent (au pire sans grain sur les canvases pollués).
- Si aucune photo n'est trouvée : un message clair remplace le silence.
- La console remonte enfin l'erreur exacte pour tout diagnostic futur.

## Fichiers modifiés
- `src/components/wallpaper-studio/WallpaperStudio.tsx`
- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts`
