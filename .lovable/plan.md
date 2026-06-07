# Fusion FAB Recherche + Chatbot (mobile uniquement)

## Constat

Sur mobile (`/marches-du-vivant/mon-espace` et autres routes communautaires), deux pastilles flottantes s'empilent en bas à droite :

- **Loupe émeraude** — `GlobalSearchFab` (rendu dans `MarchesDuVivantMonEspace.tsx` avec `className="md:hidden"`, et aussi dans `ExplorationMarcheurPage.tsx`).
- **Bulle de chat** — `ChatBot` (monté globalement via `CommunityChatBotMount`), uniquement visible pour **Admin / Ambassadeur / Sentinelle** (vérifié par `useCanUseContextualChat` + défense en profondeur côté edge `community-chat`).

Sur desktop, la recherche est déjà intégrée au header (`HeaderSearchTrigger`) → seul le chatbot flotte. **Aucune modification desktop.**

## Objectif

Sur mobile seulement, un **unique bouton flottant** « Action » qui :

- **Si l'utilisateur n'a PAS accès au chatbot** (visiteur, marcheur, éclaireur) → le bouton est strictement la loupe, comportement actuel inchangé (ouvre la recherche directement). Aucun indice de chatbot caché n'apparaît.
- **Si l'utilisateur a accès au chatbot** (admin/ambassadeur/sentinelle) → le bouton est une pastille « duo » (icône composite Search + Sparkles) ; au tap, un mini-menu radial/arc élégant se déploie avec **deux actions** : « Rechercher » et « Compagnon du Vivant ».

## Design proposé

Pastille unique, mêmes coordonnées que l'actuelle loupe (`fixed bottom-20 right-4 z-[150]`, 48px). Gradient émeraude → teal cohérent avec le système. Au repos, icône `Sparkles` superposée discrètement à la `Search` (badge à 3h, 10px, glow doux) pour signaler la double fonction sans bruit visuel.

Au tap (utilisateur autorisé) :

- La pastille se transforme en `X` (rotation 90°, spring).
- Un **arc de 2 boutons** se déploie vers le haut-gauche en stagger (90 ms entre items), chaque item est une pastille 44px glassmorphism (`bg-background/85 backdrop-blur-xl border-primary/20`) avec :
  - icône colorée (Search = primary, MessageCircle = accent émeraude clair),
  - libellé en pill latérale qui slide depuis la droite (`Rechercher` / `Compagnon`),
  - micro-halo pulsé sur le Compagnon pour rappeler le caractère « vivant ».
- Tap hors zone ou sur `X` → repli inverse.
- Tap sur un item → action puis fermeture immédiate du menu.

Animations Framer Motion (déjà utilisé partout) : `AnimatePresence` + `spring` léger (`stiffness 320, damping 24`), pas de dépendance externe. Respect des tokens HSL (aucune couleur en dur, on réutilise `from-emerald-500 to-teal-600` déjà présent dans `GlobalSearchFab`).

## Changements de code

### Nouveau : `src/components/mobile/MobileActionFab.tsx`

Composant orchestrateur, utilisé uniquement en mobile (`md:hidden`). Props : `eventId?`, `marcheId?`, `scope?`. Logique :

1. `useCanUseContextualChat()` → `canUse`, `isLoading`.
2. Si `isLoading` → ne rien rendre (évite flash).
3. Si `!canUse` → rend simplement `<GlobalSearchFab />` (réutilisé tel quel) → zéro régression pour les non-privilégiés.
4. Sinon → rend la pastille fusionnée + son menu radial, et un `<GlobalSearchOverlay open={...} />` interne pour la recherche. Pour le chatbot, on déclenche son ouverture via un `CustomEvent('frequence:open-chatbot')` que `ChatBot` écoutera (voir ci-dessous) — cela évite de remonter l'état global ou de dupliquer `ChatBot`.

### Modif : `src/components/chatbot/ChatBot.tsx`

- Ajouter un `useEffect` qui écoute `window`-level `frequence:open-chatbot` et appelle l'`setIsOpen(true)` existant.
- Ajouter une prop optionnelle (ou un flag interne) `hideFab?: boolean` ; si vrai, on ne rend pas le `DraggableFab` mais on garde le panneau et le listener. Sur mobile uniquement, `CommunityChatBotMount` passera `hideFab` quand on est sur les routes où la `MobileActionFab` prend le relais (toutes les routes communautaires + `/marches-du-vivant/mon-espace`).

Détection mobile dans `CommunityChatBotMount` via `useIsMobile()` → `hideFab={isMobile}`.

### Modif : `src/pages/MarchesDuVivantMonEspace.tsx`

- Remplacer `<GlobalSearchFab scope="global" className="md:hidden" />` par `<MobileActionFab scope="global" />` (qui gère lui-même son `md:hidden`).

### Modif : `src/components/community/ExplorationMarcheurPage.tsx`

- Remplacer le `<GlobalSearchFab ... />` mobile par `<MobileActionFab ... />` avec les mêmes props (`eventId`, `marcheId`, `scope`).

### Inchangé

- `HeaderSearchTrigger` (desktop) ✅
- `GlobalSearchOverlay` (réutilisé) ✅
- `useCanUseContextualChat` + edge `community-chat` (défense en profondeur côté serveur) ✅
- Toutes les autres routes (admin, Dordonia, etc.) — `DordoniaFloatingButton`, `EventsChatbotFab` non concernés.

## Validation des droits (rigueur demandée)

| Cas | Côté client | Côté serveur |
|---|---|---|
| Visiteur non connecté | `canUse = false` → loupe seule, pas de trace de chatbot dans le DOM | `community-chat` rejette via `has_community_chat_access` |
| Marcheur / Éclaireur | idem | idem |
| Ambassadeur / Sentinelle / Admin | menu fusionné affiché | autorisé |

Le `MobileActionFab` ne **jamais** rendre l'item « Compagnon » si `canUse=false` : pas d'item grisé, pas de toast « non autorisé » — c'est une absence pure. Cela évite toute fuite d'information sur la hiérarchie des rôles.

## Hors-scope

- Desktop (header inchangé, chatbot FAB inchangé).
- Pages publiques sans chatbot (galerie publique non connectée) → comportement = loupe seule, identique à aujourd'hui.
- Repositionnement / drag du nouveau FAB (on garde la position fixe actuelle de la loupe pour ne pas casser les habitudes).
