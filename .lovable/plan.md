# FAB chatbot draggable — solution wahouhh universelle

## Problème
Sur mobile, le bouton chatbot en `fixed bottom-6 right-6` masque souvent les contrôles (boutons « Tout ouvrir », pagination, FAB upload, etc.). L'utilisateur doit pouvoir le **déplacer au doigt** vers une zone libre, sur n'importe quel écran.

## Principe UX
- **Long press 250 ms** sur la bulle → entre en *mode déplacement* (halo pulsant + léger scale 1.08, vibration haptique 10 ms si supportée).
- L'utilisateur **glisse** la bulle où il veut. Pendant le drag, l'écran affiche 4 *safe zones* discrètes aux coins (cercles verts translucides) pour suggérer un ancrage propre.
- **Relâche** → la bulle **snap au bord le plus proche** (gauche ou droite), à la hauteur choisie, en respectant les *safe-area-insets* iOS + une marge de 16 px. Animation spring (framer-motion).
- **Tap court** (sans long press) = ouvre le chat comme aujourd'hui. Aucune régression.
- **Double-tap** sur la bulle en mode normal = reset position par défaut (bottom-right).
- Position **mémorisée** dans `localStorage` par *namespace* de FAB (clé `fab-pos:<id>`), partagée entre routes pour le même chatbot — l'utilisateur ne replace qu'une fois.
- Hors drag, la bulle reste **non-intrusive** : opacité 100 %, mais après 4 s d'inactivité scroll, passe à 70 % (revient à 100 % au toucher) — option "se faire oublier".

## Architecture technique
1. **Nouveau hook** `src/hooks/useDraggableFab.ts`
   - Signature : `useDraggableFab({ id, defaultCorner = 'bottom-right', size = 56 })`
   - Retourne `{ ref, style, isDragging, dragHandlers, resetPosition }`.
   - Gère :
     - long-press detection (`pointerdown` + timer 250 ms, annulé si mouvement > 8 px avant seuil).
     - drag via Pointer Events (compatible touch + souris + stylet).
     - clamp `x/y` aux bornes `window.innerWidth/Height` − size − insets.
     - snap horizontal au bord le plus proche au relâchement.
     - persistance localStorage `{ x, y, edge }` debouncée.
     - resize listener pour reclamper si rotation/redimensionnement.
   - Ne déclenche **pas** le onClick d'ouverture si un drag a eu lieu (seuil 6 px).

2. **Nouveau composant wrapper** `src/components/ui/DraggableFab.tsx`
   - Wrappe les enfants dans `motion.div` avec `style={fabStyle}` + halo `AnimatePresence` quand `isDragging`.
   - Affiche les 4 safe-zone hints uniquement pendant drag.
   - Respecte `env(safe-area-inset-*)`.

3. **Migration des FAB existants** (changement minimal : remplacer le `className="fixed bottom-* right-* z-*"` par `<DraggableFab id="...">`) :
   - `src/components/chatbot/ChatBot.tsx` (id `chatbot-global`) — lignes 313 et 328.
   - `src/components/DordoniaFloatingButton.tsx` (id `dordonia-fab`) — ligne 30.
   - `src/components/zones-blanches/GuideDeMarche.tsx` (id `guide-marche-fab`) — bouton ouverture.
   - `src/components/admin/marche-events/EventsChatbotFab.tsx` (id `events-chatbot-fab`).
   - **Non touchés** : FAB upload, audio player, capture admin (hors scope chatbot). Si tu veux, je peux les inclure plus tard.

4. **Indices visuels première fois** : badge `↕` qui apparaît 2 s la 1ʳᵉ utilisation (flag `fab-hint-seen` localStorage) avec micro-tooltip « Maintenez pour déplacer ».

## Détails comportement clés
- **Tap vs drag** : si `pointerup` arrive avant 250 ms ET déplacement < 6 px → c'est un tap → on laisse l'onClick natif s'exécuter. Sinon `e.preventDefault()` + `stopPropagation`.
- **Open chat panel** : quand le panel s'ouvre, il reste **ancré à sa position habituelle** (bottom inset, plein écran sur mobile) — on ne déplace QUE la bulle fermée. Pas de surprise UX.
- **Accessibilité** : `aria-label` enrichi « Bouton chatbot, double-tap pour réinitialiser la position », rôle bouton, focus visible inchangé.

## Validation
- Tester sur 390×844 (iPhone 14) : drag fluide, snap correct gauche/droite, position conservée après reload.
- Vérifier que tap simple ouvre toujours le chat (pas de régression).
- Vérifier que sur desktop, le drag souris fonctionne et le hover reste OK.
- Vérifier `safe-area-inset-bottom` sur iOS PWA.

## Hors scope
- Pas de changement du contenu du chat ni du panel ouvert.
- Pas d'animation 3D ni de magnétisme entre plusieurs FAB.
- Pas de migration des FAB non-chatbot (upload, audio) — proposable dans un second temps.
