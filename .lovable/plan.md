# Chatbot IA contextuel — Ambassadeur/Sentinelle/Admin sur pages publiques

## Objectif
Mettre à disposition le chatbot existant (déjà actif sur `/admin/*`) sur **toutes les pages publiques liées aux marches et explorations**, mais uniquement pour les profils **Ambassadeur, Sentinelle ou Administrateur**, avec une isolation stricte de sécurité.

## Architecture proposée

```text
┌───────────────────────────────────────────────────────────┐
│  Pages publiques (/galerie-fleuve, /marches, /traversees) │
│                                                            │
│   <CommunityChatBotMount />   ← nouveau composant         │
│      │                                                     │
│      ├─ useCommunityAuth()  → role ∈ {ambassadeur,        │
│      │                                  sentinelle}        │
│      ├─ useAuth().isAdmin   → admin                        │
│      └─ détecte route + entité (slug exploration / id     │
│         marche) → setContext(...)                          │
│                                                            │
│   <ChatBot edgeFunctionPath="community-chat" />           │
│           (réutilisé tel quel, paramétrable)               │
└───────────────────────────────────────────────────────────┘
                       │ JWT
                       ▼
┌───────────────────────────────────────────────────────────┐
│  edge function community-chat  (NOUVELLE, isolée)         │
│   1. getUser() → 401 si invalide                           │
│   2. RPC has_community_chat_access(user_id) → 403 sinon   │
│   3. RPC get_admin_chatbot_context (réutilisée)           │
│   4. RPC get_admin_entity_context (réutilisée)            │
│   5. Stream Lovable AI Gateway                             │
└───────────────────────────────────────────────────────────┘
```

## Étapes

### 1. Backend — autorisation serveur
- **Migration SQL** : créer `public.has_community_chat_access(_user_id uuid) returns boolean` `SECURITY DEFINER`, qui retourne `true` si l'utilisateur est admin (`has_role('admin')`) **ou** si `community_profiles.role IN ('ambassadeur','sentinelle')`.
- Grant EXECUTE à `authenticated`.
- Aucune modification de `admin-chat` ni des RPC `get_admin_*` (réutilisées telles quelles, déjà SECURITY DEFINER avec leurs propres vérifs internes ; on ajoutera un paramètre/bypass uniquement si elles refusent les non-admins — à valider après lecture).

### 2. Edge function `community-chat` (nouvelle, isolée)
- Copie quasi-identique de `admin-chat/index.ts` :
  - même CORS, même streaming Lovable AI, même prompt système.
  - **Différence clé** : remplacer `check_is_admin_user` par `has_community_chat_access`.
  - Whitelist de `scope` adaptée : `['exploration', 'marches', 'community']`.
  - Validation Zod-like des champs (`messages`, `entity.type ∈ {marche_event, exploration}`, ids ≤200 chars).
- `verify_jwt = false` (validation en code via `getUser()`).

### 3. Frontend — hook & composant de montage
- **`useCanUseContextualChat()`** (nouveau hook, `src/hooks/useCanUseContextualChat.ts`) :
  - combine `useAuth().isAdmin` + `useCommunityAuth().profile?.role`.
  - retourne `{ canUse: boolean, role: 'admin'|'ambassadeur'|'sentinelle'|null }`.
- **`CommunityChatBotMount.tsx`** (nouveau, sur le modèle de `AdminChatBotMount`) :
  - actif sur les routes : `/galerie-fleuve/*`, `/marches/*`, `/traversees/*`, `/exploration/*`, `/marche/*` (préciser à partir de `App.tsx` lors de l'implémentation).
  - **non monté** si `!canUse`.
  - détection d'entité depuis l'URL :
    - `/galerie-fleuve/exploration/:slug` → résout slug → id via une petite query → `{ type: 'exploration', id }`.
    - `/marches/:id` ou `/marche/:id` → `{ type: 'marche_event', id }`.
  - met à jour `chatPageContext` quand l'utilisateur ouvre une étape/fiche (les composants existants peuvent appeler `useChatPageContextProvider`).
- Monté dans `App.tsx` à côté de `AdminChatBotMount`.

### 4. Configuration chat (réutilisable, pas de duplication massive)
- Étendre `chatConfig.ts` :
  - ajouter contexte `'exploration'` aux `ChatContext`.
  - `edgeFunctionPath` devient un paramètre prop du `<ChatBot>` (au lieu d'être global), pour que admin et community pointent sur des fonctions différentes.
  - suggestions dédiées (FR, sobres) par contexte communautaire.
- `useChatStream` accepte une prop `edgeFunctionPath` (au lieu de lire `chatConfig.edgeFunctionPath` en module-scope).

### 5. UX/UI
- Bouton flottant identique (cohérence visuelle), mais **libellé/emoji** légers ajustés selon le rôle (ex. badge "Ambassadeur" / "Sentinelle" / "Admin" dans le header du panneau).
- Welcome message contextuel : "Bonjour Ambassadeur, je peux t'aider à analyser cette exploration / cette marche…".
- Aucun changement sur `/admin/*` (mount séparé).

### 6. Sécurité — défense en profondeur
- **Client** : `useCanUseContextualChat` masque le bouton.
- **Serveur** : `community-chat` revérifie le JWT + appelle `has_community_chat_access`. Toute tentative d'appel direct sans rôle valide → 403.
- **RLS** : les RPC `get_admin_*` restent `SECURITY DEFINER` ; vérifier qu'elles ne fuitent pas de PII supplémentaire pour les non-admins (audit lors de l'implémentation, restreindre les champs renvoyés si nécessaire en créant `get_community_entity_context` allégée si on découvre des PII sensibles côté admin).

## Questions ouvertes à trancher pendant l'implémentation
- Les RPC `get_admin_*` exposent-elles des emails/téléphones ? Si oui → créer une variante `get_community_entity_context` filtrée. À auditer dès la première étape.
- Pour les Ambassadeurs/Sentinelles : faut-il limiter les marches/explorations visibles à celles où ils sont participants ? (Par défaut, on garde la même portée que l'admin — à confirmer après mise en service.)

## Fichiers impactés
- **Nouveaux** :
  - `supabase/functions/community-chat/index.ts`
  - `supabase/migrations/<ts>_has_community_chat_access.sql`
  - `src/hooks/useCanUseContextualChat.ts`
  - `src/components/chatbot/CommunityChatBotMount.tsx`
- **Modifiés** :
  - `src/components/chatbot/chatConfig.ts` (ajout contexte `exploration`, suggestions)
  - `src/hooks/useChatStream.ts` (param `edgeFunctionPath`)
  - `src/components/chatbot/ChatBot.tsx` (prop `edgeFunctionPath`)
  - `src/App.tsx` (mount du nouveau composant)
