# Plan — Boutons Export & Nouvelle conversation visibles dans le header du ChatBot

## Contexte

Les deux fonctionnalités existent déjà dans `src/components/chatbot/ChatBot.tsx` (lignes 392–405) mais sont enfouies dans le dropdown `⋮ MoreVertical`. Un seul composant `ChatBot` est utilisé partout (Admin via `AdminChatBotMount`, Communauté via `CommunityChatBotMount`), donc le changement profite aux deux contextes en une seule modification.

## Changements

**Fichier unique modifié : `src/components/chatbot/ChatBot.tsx`** (header zone actions, lignes ~367–435)

1. **Sortir « Exporter » du dropdown** vers un bouton icône `Download` direct, placé juste avant `⋮`.
   - `disabled` si `messages.length === 0 || isLoading`
   - `onClick`: `isMobile ? setDrawerOpen(true) : exportPrint()` (comportement actuel inchangé → impression PDF navigateur sur desktop, drawer Copier/Partager sur mobile)
   - `aria-label` + `title` : « Exporter la conversation »

2. **Sortir « Nouvelle conversation » du dropdown** vers un bouton icône `RotateCcw` direct, placé juste avant le bouton Export.
   - `disabled` si `messages.length === 0`
   - `onClick`: `handleReset()` (reset immédiat, pas de confirmation)
   - `aria-label` + `title` : « Nouvelle conversation »

3. **Simplifier le dropdown `⋮`** : il ne contient plus que « Lecture vocale auto » (action secondaire de préférence). Si `ttsSupported === false`, on peut entièrement supprimer le dropdown pour alléger le header.

## Ordre final des boutons header (de gauche à droite)

`[RotateCcw] [Download] [⋮ vocal si supporté] [Maximize2/Minimize2 desktop] [X]`

## Détails techniques

- Conserver le style existant : `variant="ghost" size="icon" h-9 w-9 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10`
- Sur mobile, garder l'écart `gap-0.5` et la classe `shrink-0` du conteneur d'actions — ces 2 nouvelles icônes ajoutent ~72px mais le header est déjà conçu avec `flex-1 min-w-0` côté titre qui tronque proprement.
- Aucun changement sur `useChatExport`, `ChatExportDrawer`, `chatConfig`, mounts Admin/Community, ni sur l'edge function.
- Aucun changement de comportement métier : les actions appellent les mêmes handlers (`exportPrint`, `setDrawerOpen`, `handleReset`).

## Vérifications post-implémentation

- Header reste lisible sur mobile 375px (badge `Admin` + 4–5 icônes + titre tronqué)
- Boutons grisés tant que `messages.length === 0`
- Export desktop ouvre toujours la fenêtre d'impression
- Export mobile ouvre toujours `ChatExportDrawer`
- Reset vide bien la conversation et arrête voix/écoute
