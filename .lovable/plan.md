## Diagnostic (vérifié)

Le clic sur « Scénographe » **fonctionne** : les logs console de la session montrent bien `ScenographeMount → ScenographeFullscreen → RichMap → PlantingLayer` montés dans l'arbre React. Le problème est purement visuel :

- Le Scénographe s'affiche en `z-[3000]` (`fullscreenSurfaces`, `src/lib/uiOverlayLevel.ts`).
- Quand une surface plein écran est ouverte, le chatbot passe volontairement à `CHAT_Z.aboveFullscreen = 3200` (`ChatBot.tsx:84-85`) pour rester accessible.
- Or ici le chat est en mode **agrandi** (`isExpanded`, capture d'écran) : il occupe tout l'écran à z-3200 et recouvre intégralement le Scénographe qui vient de s'ouvrir. D'où l'impression que « rien ne se passe ».

## Correction

1. **`src/components/chatbot/ChatBot.tsx`** — s'abonner à `scenographeStore` : à la transition `open: false → true`, réduire le chat (`setIsExpanded(false)`) et le replier (`setIsOpen(false)`), de sorte que le Scénographe devienne visible et que la pastille « 🌿 IA de Jardin » reste au-dessus (z-3200) pour rouvrir le chat à volonté.
2. **`src/components/chatbot/ChatTableBlock.tsx`** — au clic : petit `toast` de confirmation (« Palette envoyée au Scénographe ») et garde-fou si `parseSpeciesTable` ne renvoie aucune espèce (message explicite au lieu d'un écran muet).
3. **`src/components/propriete/scenographe/PlantingLayer.tsx`** — corriger l'avertissement React récurrent « Invalid prop `data-lov-id` supplied to `React.Fragment` » : remplacer le `<>...</>` de la boucle `.map` par un `<React.Fragment key=…>` explicite.

## Détails techniques

- Réutilisation du store externe existant `scenographeStore.subscribe` (pas de contexte à traverser), effet monté une seule fois dans `ChatBot`, avec un `useRef` pour ne réagir qu'au front montant de `open`.
- Aucun changement de logique métier : ni le scénario, ni les plantations, ni le parsing du tableau ne sont modifiés.
