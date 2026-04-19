

## Diagnostic

Sur `/admin/marche-events/df85910e-...`, le chatbot a répondu **"je ne dispose pas de données sur cet événement"** parce que :

1. Le **scope envoyé** est `events` (générique) → la RPC `get_admin_chatbot_context('events')` retourne juste les **5 prochains événements + stats globales**, pas la fiche détaillée de l'UUID consulté.
2. Le chatbot ignore complètement le **`:id`** présent dans l'URL.
3. Il ignore aussi **ce que l'admin voit à l'écran** : organisateur, date, lieu, capacité, inscrits, exploration liée, biodiversité, médias, marcheurs présents…

C'est le chaînon manquant pour passer de "assistant générique" à **"copilote contextuel wahou"**.

## Vision : 3 niveaux de contexte cumulés

```text
┌──────────────────────────────────────────────────┐
│  N1 — SCOPE (rubrique) : events / community / …  │  ← déjà fait
│  N2 — ENTITÉ FOCALE (l'UUID dans l'URL)          │  ← à ajouter
│  N3 — ÉTAT D'ÉCRAN (onglet actif, filtres…)      │  ← à ajouter
└──────────────────────────────────────────────────┘
```

Quand l'admin pose une question, le chatbot reçoit les 3 niveaux et répond comme s'il regardait l'écran avec lui.

## Plan d'implémentation

### 1. Frontend — Détection enrichie d'URL et d'état

**`AdminChatBotMount.tsx`** : extraire `entityType` + `entityId` depuis `pathname` (regex sur `/admin/marche-events/:id`, `/admin/community/marcheur/:slug`, `/admin/exportations/:id`…) et les passer à `<ChatBot>`.

**Nouveau hook `useChatPageContext`** : un store Zustand léger (ou simple Context) que **chaque page admin** alimente avec son état visible :
- onglet actif (`Vue d'ensemble`, `Marcheurs`, `Médias`, `Empreinte`…)
- filtres en cours (période, type d'événement…)
- libellé humain ("Marche du Vivant à DEVIAT, 14 mars 2026")

Les pages admin existantes posent un `useChatPageContextProvider({...})` au montage — **changement minimal, ~3 lignes par page**.

### 2. Frontend → Backend — Payload enrichi

`useChatStream.ts` envoie désormais :
```json
{
  "messages": [...],
  "scope": "events",
  "entity": { "type": "marche_event", "id": "df85910e-..." },
  "pageState": { "activeTab": "Vue d'ensemble", "label": "..." }
}
```

### 3. Backend — RPC contextuelle de fiche complète

Nouvelle fonction SQL `get_admin_entity_context(_type text, _id uuid)` qui retourne un **JSON dense** selon le type :

- **`marche_event`** : event + organisateur + lieu (GPS, commune) + exploration liée + nombre d'inscrits validés/en attente + 10 derniers marcheurs inscrits (nom, rôle, email) + agrégat biodiversité (nb espèces, top 5) + nb photos/sons/textes + lien public.
- **`marcheur`** (community/:slug) : profil complet + historique participations + rôle/progression + contributions médias + filleuls.
- **`exploration`** : exploration + marches liées + biodiversité agrégée + statut publication.

Sécurité : `SECURITY DEFINER`, vérif `check_is_admin_user(auth.uid())` en première ligne, `REVOKE FROM PUBLIC`, `GRANT TO authenticated`.

### 4. Backend — `admin-chat` v2

L'edge function appelle :
- `get_admin_chatbot_context(scope)` (existe) → vue large
- **`get_admin_entity_context(entity.type, entity.id)`** (nouveau) si `entity` présent → fiche détaillée

Le system prompt devient :
```text
## CONTEXTE FRAIS
### Vue rubrique ({{scope}})  →  {{contextScope}}
### Fiche en cours de consultation
- Type : marche_event
- Libellé visible : "Marche du Vivant à DEVIAT"
- Onglet ouvert : "Vue d'ensemble"
- Données : {{contextEntity}}
```

Et une règle ajoutée : *"Quand l'admin dit 'cet événement', 'ce marcheur', 'cette exploration' → réfère-toi TOUJOURS à la Fiche en cours de consultation."*

### 5. Suggestions contextuelles dynamiques

`ChatSuggestions.tsx` : si `entity.type === 'marche_event'`, remplacer les 4 suggestions génériques par des suggestions **focalisées sur la fiche** :
- "Synthèse de cet événement"
- "Qui sont les marcheurs inscrits ?"
- "Quelle est l'empreinte biodiversité ?"
- "Génère un compte-rendu prêt à envoyer"

### 6. Bonus qualité "wahou"

- **Badge contextuel** dans le header du chatbot : au lieu de juste "Événements", afficher *"Événements › Marche du Vivant à DEVIAT"* pour que l'admin voie que le bot regarde la bonne fiche.
- **Mémoire de session** : conserver le `entity.id` même si l'utilisateur navigue brièvement, et reset au changement explicite.
- **Pré-chargement silencieux** : à l'ouverture du chatbot sur une fiche, lancer en tâche de fond la récupération du contexte entité pour que la 1ʳᵉ réponse soit instantanée.

## Détails techniques

- **Migration SQL** : 1 nouvelle fonction `get_admin_entity_context` + GRANT/REVOKE.
- **Fichiers touchés** : `AdminChatBotMount.tsx`, `ChatBot.tsx` (header + suggestions), `useChatStream.ts`, `chatConfig.ts` (suggestions par type d'entité), nouveau `useChatPageContext.ts`, `admin-chat/index.ts`.
- **Pages admin instrumentées en v1** : `MarcheEventDetail` (priorité — celle de la capture), `CommunityDashboard`, `ExplorationDetail` admin. Les autres pages continuent à fonctionner avec scope seul.
- **Compatibilité** : si `entity` est absent, le bot fonctionne comme aujourd'hui — zéro régression.

## Résultat attendu

Sur la même page, à la même question *"Fais-moi une synthèse de cet événement"*, le bot répondra :

> **Marche du Vivant à DEVIAT — 14 mars 2026** organisée par *Les Sentiers Vivants*. 12 marcheurs validés (3 ambassadeurs, 9 marcheurs), 4 en attente. Lieu : forêt de Deviat (45.42°N, 0.18°E). Exploration liée : *Fréquence de la rivière Dordogne — Mouvement II*. Empreinte biodiversité collectée : 87 espèces dont 4 patrimoniales (loutre, martin-pêcheur…). 24 photos, 6 sons, 2 textes éco-poétiques publiés. **Recommandation** : 4 inscriptions en attente à valider, et le compte-rendu n'est pas encore exporté.

Voilà le niveau "wahou".

