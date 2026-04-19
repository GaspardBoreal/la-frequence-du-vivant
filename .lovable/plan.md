

## Diagnostic réel (ce qui s'est passé)

J'ai testé l'infrastructure côté serveur et trouvé **3 bugs critiques** qui expliquent la réponse pauvre du chatbot :

### Bug n°1 — `auth.uid()` est `NULL` quand on appelle via service role
Logs edge function admin-chat (`11:11:20Z`) :
```
ERROR [admin-chat] RPC get_admin_chatbot_context error: Forbidden: admin role required
```
La fonction edge utilise `adminClient` (clé service_role) pour appeler les RPC. Mais service_role **n'a pas de session utilisateur** → `auth.uid()` retourne NULL → `check_is_admin_user(NULL)` = false → la RPC lève `Forbidden`.

**Conséquence** : `contextData` ET `entityContext` sont vides (ou `{error:"forbidden"}`) → le LLM n'a aucune donnée → il invente "erreur 403".

### Bug n°2 — `get_admin_entity_context` référence des colonnes inexistantes
La RPC créée hier utilise :
- `me.titre` → la vraie colonne est `title`
- `me.date_debut` → c'est `date_marche`
- `me.statut`, `me.organisateur_id` → n'existent pas
- `e.name` pour explorations OK, mais `marche_event_inscriptions` n'existe pas dans le schéma actuel
- `marche_organisateurs`, `community_affiliate_links` → à vérifier

→ Même si l'auth était OK, la RPC planterait sur la moitié des sous-requêtes.

### Bug n°3 — Récupération de l'entité depuis l'URL
À vérifier : que `entity = {type:'marche_event', id:'df85910e-...'}` est bien envoyé. Code OK dans `AdminChatBotMount.tsx`, mais comme la RPC plante, on ne le voit pas.

## Plan de correction

### Étape 1 — Corriger l'authentification dans l'edge function (cause n°1)

Faire passer la **session utilisateur** aux RPC, pas le service_role :

```ts
// AVANT (cassé)
const { data } = await adminClient.rpc("get_admin_chatbot_context", {...});

// APRÈS
const { data } = await userClient.rpc("get_admin_chatbot_context", {...});
```

`userClient` porte le JWT de l'admin → `auth.uid()` est correct → la RPC `SECURITY DEFINER` passe le check admin et exécute en privilèges élevés. C'est exactement le pattern conçu à l'origine.

Le service_role n'est plus nécessaire ici. Garder `adminClient` uniquement si on veut bypasser RLS pour des lectures non-RPC (pas le cas ici).

### Étape 2 — Réécrire `get_admin_entity_context` avec le vrai schéma

Inspecter les vraies colonnes (déjà fait) et reconstruire la fonction `marche_event` autour de :
- `marche_events` : `id, title, description, date_marche, lieu, latitude, longitude, max_participants, exploration_id, event_type`
- `explorations` (via `exploration_id`) : `name, slug, exploration_type, published`
- `exploration_marches` : compte de marches/parties liées
- `marches` (jointes via exploration_marches) : photos/audios via `marche_photos`/`marche_audio`
- `biodiversity_snapshots` : agrégat espèces
- **Inscriptions** : vérifier le vrai nom de table (probablement `marche_inscriptions` ou via `community_profiles` + relation). À découvrir avant écriture.

Pour `marcheur` et `exploration` : même travail, recoller au schéma réel.

### Étape 3 — Enrichir la réponse "wahou"

Une fois les données qui arrivent réellement, le contexte injecté contiendra :
- Titre, date, lieu, GPS
- Exploration liée + nb de marches/parties
- Compteurs photos/sons/textes par marche du parcours
- Empreinte biodiversité agrégée (espèces, observations)
- Liste des marcheurs (depuis `community_profiles` rattachés)

Le system prompt actuel est déjà bon — il dira ce qu'il voit, sans inventer.

### Étape 4 — Vérification finale

- Tester la RPC en SQL direct avec un `SET LOCAL ROLE` simulant l'admin
- Vérifier les logs edge function après corrections — plus d'erreur "Forbidden"
- Tester en live sur la page `/admin/marche-events/df85910e-...` avec la question "Synthèse de cet événement"

## Détails techniques

- **Fichiers touchés** :
  - `supabase/functions/admin-chat/index.ts` : remplacer `adminClient.rpc` par `userClient.rpc` aux 2 endroits (scope + entity).
  - **Nouvelle migration SQL** : `DROP` + `CREATE OR REPLACE` `get_admin_entity_context` avec le bon schéma.
- **Découverte préalable nécessaire** (durant l'exécution) : lister les tables réelles d'inscriptions/organisateurs via `information_schema` avant d'écrire le SQL définitif.
- **Compatibilité** : zéro impact côté frontend, les changements sont 100% backend.
- **Sécurité** : inchangée — le check `auth.uid()` admin est préservé, simplement il fonctionnera enfin.

## Résultat attendu

Sur la même page, à *"Fais-moi une synthèse de cet événement"*, le bot répondra avec **les vraies données** : titre exact, date, lieu GPS, exploration liée, nombre de marches/parties, médias collectés, biodiversité agrégée — au lieu d'inventer une "erreur 403".

