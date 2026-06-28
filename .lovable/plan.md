## Problème observé

Sur POITIERS Maison Sous Blossac, filtré L2+L3 (7 espèces), le Memory affiche 8 cartes identiques sans aucune consigne. L'utilisateur ne sait ni **ce qu'il doit faire**, ni **pourquoi** les cartes restent fermées.

Deux causes :
1. **Aucune règle expliquée** avant de jouer — ni titre, ni objectif, ni exemple visuel.
2. **Démarrage à froid** : les cartes sont rendues même si les photos ne sont pas encore résolues côté cache, donc cliquer ne révèle qu'un nom ou une image cassée, sans appariement possible.

## Solution : un mini onboarding ludique + un démarrage garanti

### 1. Écran d'accueil « Règle du jeu » (overlay manuscrit, avant la grille)

Plein cadre crème, polices Caveat/Patrick Hand déjà chargées. Trois éléments :

- **Titre** : « Le Memory du Vivant ✿ »
- **Pitch en une phrase** : « Retrouve la **photo** et le **nom** de chaque espèce de la marche. »
- **Mini démo animée** (2 cartes côte à côte qui se retournent en boucle) montrant : photo ↔ nom → ✓ paire trouvée.
- **3 picto-règles** alignées en bas, façon carnet :
  1. 🃏 Clique sur une carte pour la retourner
  2. 👀 Trouve la paire photo + nom
  3. 🌿 Gagne en moins de coups possibles
- Bouton géant **« C'est parti ! »** (vert sauge, ombre portée manuscrite).
- Petit lien discret « Ne plus afficher » → mémorisé en `localStorage` (`mdv.memory.onboarding.v1.seen`) pour les sessions suivantes.

### 2. Bandeau de consigne permanent au-dessus de la grille

Une fois le jeu lancé, garder une ligne fine type post-it :
> ✨ Trouve la **photo** et le **nom** qui vont ensemble — il y a {N} paires à reconstituer.

Et un bouton discret 🛟 « Revoir la règle » qui rouvre l'overlay.

### 3. Démarrage garanti (fix du « 0/6 paires figé »)

- **Bloquer le rendu de la grille** tant que `availableCount < pairsCount` OU que les images ne sont pas pré-chargées (`new Image()` avec timeout 3 s, déjà prévu dans le plan précédent mais non câblé).
- Pendant ce temps, afficher une **scène de chargement narrative** :  
  *« Les espèces de la marche enfilent leur costume… 🌱 »* + spinner Caveat + progression `X/N photos prêtes`.
- Une fois prêt, animation de retournement en cascade des dos de cartes (~600 ms) pour amorcer le geste.

### 4. Feedback de jeu plus parlant

- À la 1ʳᵉ carte retournée : tooltip Caveat « Maintenant, trouve sa paire ! »
- Match : confettis discrets + nom de l'espèce affiché 1,5 s en grand (« 🎉 Coccinelle à 7 points ! »).
- Non-match : léger shake + bulle « Pas cette fois, retiens leur place… ».
- Fin de partie : écran de victoire avec rappel des 6 espèces apprises (photo + nom + petit fait amusant si déjà en base, sinon juste le nom).

### 5. État dégradé honnête

Si après préchauffage `availableCount < 3` (cas filtres ultra-restrictifs) :
- Écran « Pas assez de photos pour ce jeu ici 🌾 »
- 2 CTA : « Essayer le jeu **Qui suis-je ?** » et « Élargir les niveaux trophiques ».

## Fichiers touchés

- `src/components/biodiversity/discover/modes/games/MemoryGame.tsx` — overlay onboarding, bandeau consigne, gate de démarrage, animations de feedback, écran de victoire.
- `src/components/biodiversity/discover/modes/games/MemoryOnboarding.tsx` *(nouveau)* — composant overlay règle + démo animée + persistance localStorage.
- `src/components/biodiversity/discover/modes/games/MemoryFeedback.tsx` *(nouveau, optionnel)* — toasts manuscrits match / fin de partie.
- `src/components/biodiversity/discover/useDiscoverData.ts` — exposer `isPhotosWarming` et `resolvedCount` / `totalCount` pour piloter la scène de chargement.

Aucune migration, aucune dépendance nouvelle (framer-motion déjà présent).

## Validation

1. POITIERS, L2+L3 (7 espèces) : overlay règle → « C'est parti » → scène de chargement → 6 paires jouables avec vraies photos.
2. Marche filtrée à 2 espèces : écran dégradé avec CTAs alternatifs, jamais de grille figée.
3. 2ᵉ visite : overlay sauté grâce au localStorage, bouton « Revoir la règle » fonctionnel.
