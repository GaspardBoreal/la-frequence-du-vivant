## Problème

`KingdomSortGame.tsx` utilise l'API **HTML5 Drag-and-Drop natif** (`draggable`, `onDragStart`, `onDrop`, `dataTransfer`). Cette API **n'émet aucun événement tactile** sur iPad / Android : impossible de déplacer une carte au doigt → jeu bloqué sur tablette et mobile.

## Solution : double interaction (drag tactile + tap-to-place)

Je remplace le drag HTML5 par **`@dnd-kit/core`** (déjà utilisé dans le projet pour le planning CRM, donc zéro nouvelle dépendance) avec **`PointerSensor` + `TouchSensor` + `KeyboardSensor`**, et j'ajoute en parallèle un **mode tap** plus naturel sur écran tactile.

### Interactions supportées

1. **Drag fluide tactile/souris** (dnd-kit)
   - `TouchSensor` avec `activationConstraint: { delay: 120, tolerance: 8 }` → évite de bloquer le scroll vertical accidentel.
   - `PointerSensor` avec `activationConstraint: { distance: 6 }` pour la souris.
   - `DragOverlay` qui suit le doigt avec légère rotation + ombre portée (effet "carte qu'on soulève").
   - Drop zones surlignées (anneau émeraude pulsant) quand une carte survole.

2. **Tap-to-place (fallback ludique sur tablette)**
   - 1ᵉʳ tap sur une carte → elle "se soulève" (scale 1.08 + halo doré + petit "Choisis un règne !" en consigne).
   - 2ᵉ tap sur une zone Faune/Flore/Champignon → la carte y atterrit avec animation.
   - Tap ailleurs → déselection.
   - Géré via un état `selectedId` partagé avec dnd-kit (les deux modes coexistent).

3. **Feedback amélioré**
   - Vibration haptique courte (`navigator.vibrate?.(15)`) au pickup et au drop si supportée.
   - Animation `framer-motion` layout déjà en place préservée.
   - Toast manuscrit "🎉 Bien vu !" / shake rose à l'erreur (cohérent avec Memory & Qui suis-je).

### Onboarding bref

Petit overlay 1ʳᵉ partie (persistance `localStorage` clé `mdv:kingdom-sort:onboarded`) :
- Titre manuscrit "Le Tri du Vivant 🌿"
- 2 picto-règles : "Glisse OU touche puis choisis la maison" / "Faune, Flore, Champignon"
- Bouton "C'est parti !" + case "Ne plus afficher"
- Bouton 🛟 "Revoir la règle" dans l'en-tête (comme Memory)

### Accessibilité

- `KeyboardSensor` activé → navigation clavier (Tab + Espace + flèches) pour les lecteurs d'écran et clavier physique sur iPad.
- Zones de dépôt avec `role="region"` + `aria-label` ("Zone Faune, X cartes placées").

## Fichiers modifiés / créés

- **Refonte** `src/components/biodiversity/discover/modes/games/KingdomSortGame.tsx`
  - Migration HTML5 DnD → `@dnd-kit/core` (`DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`).
  - Ajout état `selectedId` pour le mode tap.
  - Bandeau consigne permanent + bouton revoir la règle.
- **Nouveau** `src/components/biodiversity/discover/modes/games/KingdomSortOnboarding.tsx`
  - Overlay règles cohérent avec `MemoryOnboarding` / `WhoAmIOnboarding`.

Aucune logique métier modifiée : règles du jeu, scoring, rejouer, sélection des espèces inchangés.

## Vérification

- Test manuel dans la preview tablette (1024×768) : drag au doigt OK, scroll page non bloqué, tap-to-place OK.
- Confirmation que `@dnd-kit/core` est déjà installé (`MissionsPlanning.tsx`) → pas d'install.
- Aucune régression desktop (souris) : `PointerSensor` couvre.
