

## Activer le ChatBot universel "PiloTerra" dans /admin de La Fréquence du Vivant

### Vue d'ensemble du chatbot IAgri'Scope

Architecture découverte (10 fichiers + 1 edge function) :

```text
src/components/chatbot/
  ChatBot.tsx            ← UI orchestration (mode réduit/plein écran, voix, upload, export)
  ChatMessage.tsx        ← Markdown + entités cliquables
  ChatSuggestions.tsx    ← Suggestions contextuelles par "page"
  ChatExportDrawer.tsx   ← Export mobile
  ChatPrintView.tsx      ← Vue print PDF
  useChatExport.ts       ← Logique export/print
  DefiInspectorPanel.tsx ← Split-view inspecteur (spécifique IAgri)
  QuizCard.tsx           ← Quiz embarqués (spécifique IAgri)
  quizParser.ts
  chatConfig.ts          ← ⭐ TOUS les paramètres business isolés ici

src/hooks/
  useChatStream.ts       ← SSE streaming + upload doc context
  useDocumentExtractor.ts← PDF/DOCX/TXT → texte
  useSpeechRecognition.ts← STT navigateur + interruption "stop"
  useSpeechSynthesis.ts  ← TTS navigateur + ElevenLabs

supabase/functions/
  chat-defis/            ← system prompt + Lovable AI Gateway streaming
  elevenlabs-tts/        ← TTS premium
```

**Points forts du design** : `chatConfig.ts` centralise déjà tout ce qui change d'un projet à l'autre (nom, emojis, suggestions, regex entités, branding print, edge function path). Le composant lui-même est agnostique.

### Stratégie de réutilisation cross-projet

Trois options possibles. Recommandation : **Option B (copie maîtrisée + manifest)**, car Lovable n'offre pas de package npm partagé entre projets.

| Option | Principe | Verdict |
|---|---|---|
| A — Package npm privé | Publier `@piloterra/chatbot` | Surdimensionné, friction CI |
| **B — Copie + manifest + script de sync** | Un projet "source de vérité" (PiloTerra Chatbot Core) + outil cross-project pour propager | ✅ Pragmatique, exploite `cross_project--copy_project_asset` |
| C — Sous-arbre Git | Branche partagée | Lovable ne gère pas |

**Modèle B** :
1. **Source de vérité** = un projet dédié (à créer) ou IAgri'Scope (déjà mature). Recommandation : promouvoir le code IAgri'Scope comme **v1**.
2. Chaque projet héberge sa **copie locale** dans `src/components/chatbot/` + `src/hooks/useChat*` + une edge function dédiée.
3. **Seul `chatConfig.ts` diffère** par projet (couleurs via tokens CSS du thème projet, nom, suggestions, system prompt côté edge function).
4. **Synchronisation** : quand on améliore le chatbot dans n'importe quel projet, on demande "propage cette amélioration aux autres projets PiloTerra" → utilise les outils cross-project pour copier les fichiers core (tout sauf `chatConfig.ts` et l'edge function).

### Étape 1 — Activer dans /admin de La Fréquence du Vivant (ce ticket)

#### Fichiers à créer (copie depuis IAgri'Scope)

**Composants (copie 1:1, agnostiques)** :
- `src/components/chatbot/ChatBot.tsx`
- `src/components/chatbot/ChatMessage.tsx`
- `src/components/chatbot/ChatSuggestions.tsx`
- `src/components/chatbot/ChatExportDrawer.tsx`
- `src/components/chatbot/ChatPrintView.tsx`
- `src/components/chatbot/useChatExport.ts`

**Composants à NE PAS copier** (spécifiques défis IAgri) :
- ❌ `DefiInspectorPanel.tsx`, `QuizCard.tsx`, `quizParser.ts` → retirés du `ChatBot.tsx` lors de la copie (split-view désactivé pour v1).

**Hooks (copie 1:1)** :
- `src/hooks/useChatStream.ts`
- `src/hooks/useDocumentExtractor.ts`
- `src/hooks/useSpeechRecognition.ts`
- `src/hooks/useSpeechSynthesis.ts`

**Configuration spécifique La Fréquence du Vivant** :
- `src/components/chatbot/chatConfig.ts` — adapté :
  - `assistantName: "Compagnon Admin du Vivant"`
  - `assistantEmoji: '🌿'`
  - Couleurs déjà héritées via `bg-primary` (Forêt Émeraude / Papier Crème selon thème actif → s'adapte tout seul)
  - `contextLabels` mappés sur les pages admin (`marche-events`, `community`, `marches`, `exportations`, etc.)
  - `suggestions` orientées admin : "combien d'événements ce mois ?", "quels marcheurs sont Sentinelles ?", "quelle marche a le plus de zones blanches ?"
  - `entityPattern` : ex. `/\bE(\d+)\b/g` pour référencer un événement, ou désactivé en v1
  - `edgeFunctionPath: 'admin-chat'`

**Edge function backend** :
- `supabase/functions/admin-chat/index.ts` — clone de `chat-defis` avec :
  - System prompt orienté admin Marches du Vivant
  - **Connexion DB** : utilise `SUPABASE_SERVICE_ROLE_KEY` pour interroger `marche_events`, `marches`, `community_profiles`, `exploration_marches`, etc.
  - Pattern : avant l'appel LLM, exécuter quelques RPC d'agrégation (KPIs, comptages) et injecter le résultat dans le system prompt comme contexte frais
  - Streaming SSE via Lovable AI Gateway (`google/gemini-3-flash-preview`)
  - **Sécurité** : valider JWT admin (réutiliser le pattern `edge-function-admin-security-logic` déjà documenté)

**Optionnel v1.1** : `supabase/functions/elevenlabs-tts/index.ts` (si on veut la voix premium ; sinon TTS navigateur suffit, gratuit).

#### Fichiers à modifier

| Fichier | Action |
|---|---|
| `src/pages/AdminLayout.tsx` (ou équivalent enveloppant `/admin/*`) | Monter `<ChatBot currentContext={...} />` une seule fois, lire le contexte depuis l'URL (`useLocation`) |
| `src/components/admin/marche-events/EventsChatbotFab.tsx` | **Supprimer** (le FAB devient global, plus besoin du placeholder) |

#### Contextualisation par page admin

Le `ChatBot` reçoit un prop `currentContext` (string) déduit de l'URL. Ex :
- `/admin/marche-events` → contexte `events` → suggestions "combien d'événements à venir ?", "type le plus représenté ?"
- `/admin/community` → contexte `community` → "qui sont mes Ambassadeurs actifs ?"
- `/admin/marches` → contexte `marches` → "marches sans coordonnées ?"
- défaut → contexte `dashboard`

L'edge function reçoit ce contexte et adapte sa requête DB (n'agrège que les tables pertinentes pour économiser des tokens).

#### Sécurité (critique)

- L'edge function `admin-chat` **valide le JWT** et vérifie le rôle `admin` via `has_role()` avant tout. Aucune donnée sensible ne fuit.
- Pas de SQL libre venant du LLM. L'edge function expose **un set fixe de RPC SQL agrégées** (ex. `get_admin_chatbot_context(_scope text)`) renvoyant des stats déjà anonymisées/agrégées. Le LLM ne reçoit que ces résultats.
- Documents uploadés : extraction côté **client** (déjà le cas dans `useDocumentExtractor`), donc rien ne quitte le navigateur sauf le texte que l'utilisateur envoie.

### Étape 2 — Process de propagation cross-projet (à valider après v1)

Une fois la v1 stable dans La Fréquence du Vivant, créer un document de référence `mem://chatbot/piloterra-core-version` listant les fichiers "core" et la version. Toute amélioration d'un fichier core dans n'importe quel projet → l'utilisateur peut demander "synchronise le chatbot vers Scope/Academy/etc." et l'agent utilisera `cross_project--read_project_file` + `code--write` pour propager.

### Customisation par projet (déjà résolue)

Les couleurs viennent **automatiquement** des tokens CSS du projet (`bg-primary`, `text-primary-foreground`, etc.). Aucune duplication CSS. Sur La Fréquence du Vivant, le chatbot adoptera Forêt Émeraude en thème sombre et Papier Crème en thème clair sans une ligne de code spécifique.

### Points à confirmer avant implémentation

1. **Périmètre v1** : on copie tout (voix navigateur + upload PDF/DOCX + export print) ou on commence minimaliste (texte + export uniquement, voix/upload en v1.1) ?
2. **TTS premium ElevenLabs** : on déploie aussi `elevenlabs-tts` (nécessite secret `ELEVENLABS_API_KEY`) ou on se contente du TTS navigateur gratuit pour la v1 ?
3. **Données accessibles au chatbot** : limiter v1 à des **agrégats publics** (compteurs, top marches, types d'événements) — pas de PII marcheurs ? Ou autoriser dès le départ la consultation détaillée (noms, emails) puisque c'est l'admin ?
4. **Périmètre de montage** : le FAB n'apparaît **que sur `/admin/*`** (recommandé v1) ou sur tout le site avec contexte différent côté public ?

Réponds à ces 4 points et je présente le plan d'implémentation détaillé pour exécution.

