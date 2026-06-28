## Diagnostic

Le carré noir vient du filtre `filter: brightness(0) contrast(1.2)` appliqué sur `GameCardImage` :
- Sur une photo JPG « pleine » (pas d'alpha), `brightness(0)` peint **tout** le rectangle en noir → il n'y a pas de silhouette lisible, juste un bloc sombre.
- Si l'image n'a pas pu se résoudre, `GameCardImage` rend une icône Lucide sur fond pastel ; le même filtre éteint tout → carré noir.
- Aucun fallback visuel quand l'image est en cours de chargement ou indisponible.

Résultat : le joueur ne voit rien à deviner.

## Proposition — « Qui suis-je ? » version wahouh

Plutôt qu'une fausse silhouette, je propose un **vrai jeu de révélation progressive** avec 3 modes de mystère sélectionnés automatiquement selon ce qui est disponible pour l'espèce. L'esprit reste manuscrit/papier kraft cohérent avec le Mode Enfant.

### 1. Trois modes de mystère (rotation aléatoire par manche)

- **Mosaïque floutée** (par défaut) : la photo est affichée avec `filter: blur(28px) saturate(1.4)` + léger zoom. On voit les **couleurs et formes générales** sans reconnaître l'espèce. Beau, doux, lisible.
- **Œil de serrure** : un cercle de 35 % du cadre découpe la photo (clip-path), reste du cadre voilé en kraft. On devine via un détail.
- **Silhouette véritable** : seulement si la photo a un fond clair détectable (heuristique simple sur premier pixel) ; sinon on retombe sur le mode mosaïque.

### 2. Bouton « 💡 Donne-moi un indice »

- Premier clic : réduit le flou de 28 → 14 px (ou agrandit l'œil de serrure).
- Deuxième clic : révèle la 1ʳᵉ lettre du nom + le règne (« 🐦 Oiseau commençant par P… »).
- Chaque indice utilisé = +0,5 point malus visible (badge « -0,5 ⭐ »).

### 3. Révélation cinématique

- Bonne réponse : l'image se dé-floute sur 600 ms + halo lumineux doré + **confettis Lucide** (étoiles + feuilles tombantes via framer-motion), bannière manuscrite « Bravo ! C'était bien le **Pigeon ramier** 🕊️ ».
- Mauvaise réponse : secousse légère, le cadre se teinte en rose pâle, on dé-floute aussi pour que le joueur **mémorise** l'espèce avec sa vraie photo, puis carte juste mise en évidence en vert.

### 4. États dégradés robustes

- Si `GameCardImage` n'arrive **pas** à charger la photo (onError → icône Lucide), on bascule **automatiquement** sur un **mode « Devinette aveugle »** : un cadre kraft avec 3 indices manuscrits empilés (règne emoji + taxon + initiale), pour ne jamais montrer un carré noir.
- Si moins de 4 espèces avec photo : message manuscrit « Pas assez d'espèces… choisis un autre jeu ».

### 5. UX & lisibilité

- Bandeau consigne permanent au-dessus : « Devine l'espèce mystère parmi les 4 propositions ».
- Onboarding optionnel (1ʳᵉ partie, `localStorage`) reprenant le pattern du Memory : démo animée flou → net, 3 règles (Observe, Devine, Découvre).
- Compteur score remplacé par **badges Lucide** (`CheckCircle2` / `XCircle`) — les emojis ✅/❌ ne rendent pas sur ta machine actuelle (cf. capture).
- Mini animation Ken-Burns lent sur l'image mystère pour donner du vivant.

## Détails techniques

Fichiers touchés :
- `src/components/biodiversity/discover/modes/games/WhoAmIGame.tsx` : refonte (modes mystère, indices, révélation, états dégradés).
- `src/components/biodiversity/discover/modes/games/WhoAmIOnboarding.tsx` *(nouveau)* : overlay règle, persistance `localStorage` (`mdv.whoami.onboarding.v1.seen`).
- `src/components/biodiversity/discover/modes/games/MysteryFrame.tsx` *(nouveau)* : composant cadre mystère qui prend `species`, `photoBy`, `mode` (`'blur' | 'keyhole' | 'silhouette' | 'blind'`), `revealLevel` (0/1/2/3) et gère l'auto-fallback `onError` vers mode aveugle.
- `src/components/biodiversity/discover/modes/games/GameCardImage.tsx` : exposer `onResolved(success: boolean)` pour permettre l'auto-fallback.
- Aucune mutation de données, pas de nouvelle requête réseau, pas d'edge function.

Tout reste dans la couche présentation, dans la même direction artistique (Caveat / Patrick Hand, palette papier kraft, ombres décalées).
