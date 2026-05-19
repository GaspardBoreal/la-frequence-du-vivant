# Pièce jointe « Liste des espèces » — frugal & efficace

## Problème observé

Quand l'utilisateur demande au Compagnon « quelles espèces indigènes manquent ? », l'IA refuse car `visibleData['screen.dom'].visibleCards` est vide : le chatbot est en overlay, les cartes d'espèces ne sont pas dans le viewport. Pourtant les 92 espèces existent côté serveur (RPC `get_admin_entity_context`) — mais sans détail nominatif, juste les compteurs.

## Idée frugale : la pièce jointe « contextuelle »

Plutôt que de pousser systématiquement la liste complète à chaque message (coûteux en tokens), on réutilise **le bouton 📎 paperclip déjà présent** dans le composer pour offrir un nouveau choix : **« Joindre une donnée du site »**.

Quand l'utilisateur clique → menu compact avec une seule option pertinente sur cette page :
- 🌿 **Liste complète des espèces (92)** — ~6 Ko compressés

Une vignette de pièce jointe s'affiche au-dessus du composer (comme un PDF), reste attachée tant que l'utilisateur ne la retire pas, et est envoyée dans `pageState.visibleData['exploration.species.full']` **uniquement sur les tours où elle est attachée**. L'IA voit alors la liste nominative et peut raisonner dessus.

## Pourquoi c'est frugal

| Aspect | Coût |
|---|---|
| Déclenchement | Explicite (clic utilisateur), jamais auto |
| Payload | Liste minimale : `{ name, scientificName, group, count }` × 92 ≈ 5-7 Ko |
| Durée | L'attachement reste tant que l'utilisateur ne le retire pas (clic « × » sur la vignette) → permet plusieurs questions sur la même liste sans recharger |
| Réutilisation | 0 nouveau composant lourd : on étend le menu paperclip et on ajoute une slice `visibleData` |
| DB | 0 requête supplémentaire : on lit `useExplorationSpeciesPool` déjà monté par la page parente |

## Pourquoi c'est efficace

- L'IA reçoit la liste **nominative** → elle peut répondre « espèces indigènes attendues mais absentes » de façon argumentée, tout en respectant la règle d'intégrité (les noms qu'elle cite comme *présents* sont dans la liste ; ceux qu'elle suggère comme *absents* sont raisonnés à partir de cette liste réelle).
- Vignette persistante = transparence (l'utilisateur voit exactement ce que l'IA voit).
- Pattern UX déjà connu (PDF joint) → 0 apprentissage.

## Plan d'implémentation

### 1. Source de données — `src/components/chatbot/CommunityChatBotMount.tsx`
- Importer `useExplorationSpeciesPool(explorationId)` (déjà existant).
- Exposer la liste via le store : `chatPageContext.setAvailableAttachments({ speciesPool: [...] })` (nouveau champ optionnel dans le store, non envoyé tant que non attaché).
- Format compact : `[{ n: displayName, s: scientificName, g: group, c: count }]`.

### 2. Store — `src/hooks/useChatPageContext.ts`
- Ajouter `availableAttachments?: { speciesPool?: CompactSpecies[] }` à `ChatPageState`.
- Helper `attachSpeciesPool()` / `detachSpeciesPool()` qui pose/retire `visibleData['exploration.species.full']`.

### 3. UI composer — `src/components/chatbot/ChatBot.tsx`
- Transformer le bouton 📎 actuel en `DropdownMenu` (au lieu d'ouvrir directement le file picker) **uniquement si `availableAttachments?.speciesPool` est non vide** ; sinon comportement actuel inchangé.
- Items :
  - « 📄 Joindre un document » → comportement actuel (`openFilePicker`)
  - « 🌿 Liste des espèces (N) » → `attachSpeciesPool()`
- Au-dessus du composer, afficher une vignette compacte quand la slice est attachée :
  ```
  🌿 Liste des espèces (92) attachée à cette conversation   [×]
  ```
- Le [×] appelle `detachSpeciesPool()`.

### 4. Edge function — `supabase/functions/community-chat/index.ts`
Aucune modification de code nécessaire : la slice arrive dans `pageState.visibleData['exploration.species.full']` et est déjà sérialisée dans le bloc « DONNÉES RÉELLEMENT AFFICHÉES À L'ÉCRAN ». On ajoute juste **une ligne dans le system prompt** pour préciser que cette slice nominative autorise des raisonnements comparatifs (« espèces typiques de Charente non présentes dans cette liste »).

### 5. Variante admin — `AdminChatBotMount.tsx`
Même branchement (admin entity = exploration ou marche). Pour une `marche_event`, alimenter depuis les snapshots de cette marche.

## Détails techniques

- **Pas de re-fetch** : `useExplorationSpeciesPool` est déjà monté par `ExplorationMarcheurPage` ; on s'y abonne via le mount.
- **Limite** : si > 200 espèces, tronquer à 200 + flag `truncated: true` (déjà géré dans les autres slices).
- **Persistance** : l'attachement vit dans le store React, donc disparaît à un reload ou un changement d'exploration — comportement souhaité.
- **Reset conversation** : `handleReset()` doit aussi appeler `detachSpeciesPool()` pour partir propre.

## Hors scope

- Pas de nouvelle table, pas de migration.
- Pas de modification du Drawer d'export ni des deux boutons header récemment ajoutés.
- Pas d'auto-attachement basé sur l'intent (gardé pour une v2 si pertinent).