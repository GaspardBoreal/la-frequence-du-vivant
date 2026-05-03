## Diagnostic

Vous êtes bien Sentinelle (vérifié en base). Le `CommunityChatBotMount` ne s'affiche pas car la route `/marches-du-vivant/mon-espace/...` n'est pas dans sa whitelist `COMMUNITY_ROUTE_PATTERNS`. Seules les pages publiques (galerie, marche, traversées, marcheur public) y figurent.

## Plan

### 1. Étendre la whitelist des routes — `src/components/chatbot/CommunityChatBotMount.tsx`

Ajouter les patterns pour Mon Espace :
- `/marches-du-vivant/mon-espace`
- `/marches-du-vivant/mon-espace/*`
- `/marches-du-vivant/mon-espace/exploration/:id`
- `/marches-du-vivant/mon-espace/exploration/:id/*`

### 2. Détection de contexte enrichie

Mettre à jour `detectContext()` pour reconnaître Mon Espace :
- `/mon-espace/exploration/:id` → contexte `exploration` avec id direct (UUID dans l'URL, pas besoin de slug-resolver)
- Autres `/mon-espace/*` (accueil, marches, carnet, outils) → contexte `community` centré marcheur courant

### 3. Résolution d'entité

Ajouter un `matchPath` pour `/marches-du-vivant/mon-espace/exploration/:id` :
- L'`:id` est déjà un UUID → injection directe en `urlEntity = { type: 'exploration', id }`
- Fallback : si pas d'id résolu (autres pages mon-espace), passer `urlEntity = null` et laisser l'edge function `community-chat` répondre en mode marcheur (contexte `community`)

### 4. Vérification edge function

`community-chat` accepte déjà le contexte `exploration` + `urlEntity` (ajouté lors de la création initiale). Aucune modification serveur nécessaire — la RPC `get_admin_entity_context` autorise déjà les Sentinelles via `has_community_chat_access`.

## Détail technique

```ts
const COMMUNITY_ROUTE_PATTERNS = [
  // ... existants ...
  '/marches-du-vivant/mon-espace',
  '/marches-du-vivant/mon-espace/*',
];

// Nouveau match
const monEspaceExplorationMatch = matchPath(
  { path: '/marches-du-vivant/mon-espace/exploration/:id/*', end: false },
  location.pathname
);
const monEspaceExplorationId = (monEspaceExplorationMatch?.params as any)?.id;

// detectContext
if (pathname.includes('/mon-espace/exploration/')) return 'exploration';
if (pathname.includes('/mon-espace')) return 'community';
```

## Résultat attendu

Connecté en Sentinelle/Ambassadeur/Admin sur `/marches-du-vivant/mon-espace/exploration/70fcd8d1-...`, le bouton flottant "Compagnon du Vivant" apparaît avec contexte exploration chargé (events, biodiversité, médias). Idem sur toutes les sous-pages /mon-espace (contexte community en fallback).
