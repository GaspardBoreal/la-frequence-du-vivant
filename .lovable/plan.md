

## Diagnostic : pourquoi Gaspard Boréal n'a aucun log

### Cause racine identifiée

Le hook `useActivityTracker` appelle `supabase.auth.getSession()` **à l'intérieur du setTimeout** (2 secondes après le montage). Or la documentation Supabase et le pattern connu indiquent que `getSession()` peut retourner `null` si la session n'a pas encore été restaurée depuis le localStorage — surtout juste après un `signIn()` suivi d'un `navigate()`.

Concrètement :
1. Gaspard se connecte sur `/marches-du-vivant/connexion`
2. `signIn()` → `navigate('/marches-du-vivant/mon-espace')`
3. Le composant `MarchesDuVivantMonEspace` se monte, `useCommunityAuth` commence à restaurer la session
4. Le `useEffect` pour `session_start` se déclenche quand `user` et `profile` sont prêts
5. `trackActivity()` est appelé → setTimeout de 2s → **à ce moment, `getSession()` est appelé à nouveau** indépendamment
6. Si le token JWT n'est pas encore pleinement écrit dans le storage (race condition), `session` est `null` → **le log est silencieusement ignoré** (ligne 26: `if (!session?.user?.id) return;`)

Pour Zéphyrine (iPhone, connexion plus lente), le timing a fonctionné. Pour Gaspard (desktop, navigation rapide), non.

### Solution : ne plus appeler `getSession()` dans le tracker

Au lieu de re-interroger la session dans le callback du timer, **passer le `userId` directement** depuis le composant appelant, qui possède déjà l'utilisateur authentifié.

### Modifications

**1. `src/hooks/useActivityTracker.ts`**

Modifier `trackActivity` pour accepter un `userId` en premier argument au lieu de le récupérer via `getSession()` :

```typescript
trackActivity(userId: string, eventType: string, eventTarget: string, options?)
```

Supprimer l'appel à `supabase.auth.getSession()`. Le `userId` vient du composant parent qui a déjà vérifié l'auth.

**2. Tous les appelants** (5 fichiers)

Adapter les appels pour passer `user.id` :

| Fichier | Modification |
|---------|-------------|
| `MarchesDuVivantMonEspace.tsx` | `trackActivity(user.id, 'session_start', ...)` |
| `MarcheDetailModal.tsx` | `trackActivity(userId, 'marche_view', ...)` |
| `ExplorationMarcheurPage.tsx` | `trackActivity(userId, 'page_view', ...)` |
| `ApprendreTab.tsx` | `trackActivity(userId, 'tab_switch', ...)` |
| `OutilsTab.tsx` | `trackActivity(userId, 'tool_use', ...)` |

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useActivityTracker.ts` (supprimer getSession, ajouter param userId) |
| Modifier | `src/pages/MarchesDuVivantMonEspace.tsx` (passer user.id) |
| Modifier | `src/components/community/MarcheDetailModal.tsx` (passer userId) |
| Modifier | `src/components/community/ExplorationMarcheurPage.tsx` (passer userId) |
| Modifier | `src/components/community/insights/ApprendreTab.tsx` (passer userId) |
| Modifier | `src/components/community/tabs/OutilsTab.tsx` (passer userId) |

### Résultat

Plus de dépendance à `getSession()` dans le tracker. Le `userId` est garanti disponible car les composants ne rendent le contenu tracké que si l'utilisateur est authentifié. Toute race condition de session est éliminée.

