## Le problème

Les hooks `usePropertyObservation`, `usePropertySoil` et `usePropertyFlora` partagent tous le même bug de cycle de vie lorsqu'on change de propriété.

### Ce qu'ils font aujourd'hui

Chaque hook maintient un état local (`local`) hydraté depuis la BDD, avec un autosave debounced (1,5 s) qui écrit sur `proprieteId`. La ré-hydratation est gardée par un `useRef(false)` :

```ts
const initRef = useRef(false);
useEffect(() => {
  if (query.data && !initRef.current) {
    setLocal(query.data);
    initRef.current = true;
  } else if (query.data && initRef.current) {
    // resync completed_at uniquement, jamais answers/samples/etc.
  }
}, [query.data]);
```

### Pourquoi les données « fuient » d'une propriété à l'autre

Quand on navigue de Propriété A vers Propriété B :

1. `proprieteId` change → React Query relance la requête sur B.
2. **`initRef.current` reste `true`** (le hook n'est pas démonté, seul le prop change).
3. La branche « resync completed_at only » se déclenche : `local` garde donc les réponses/échantillons/flora de A.
4. Le `useEffect` d'autosave voit `local` inchangé mais `persist` est recréé (nouveau `proprieteId`), et surtout **le prochain changement de champ écrit l'état hérité de A dans B** — corruption silencieuse.
5. À l'affichage, l'utilisateur voit soit les données de A collées sur B, soit un mélange après un premier édit.

Pourquoi **Portrait** et **Cadastre** ne sont pas touchés : ils n'ont pas ce pattern « local mirror + autosave ». Ils lisent/écrivent directement via mutations ciblées par `proprieteId`, donc pas de state à réinitialiser.

## Correction

Une correction centralisée, appliquée à l'identique aux 3 hooks.

### 1. Réinitialiser à chaque changement de `proprieteId`

Remplacer le garde `initRef` par une clé d'ID :

```ts
const loadedIdRef = useRef<string | null>(null);

useEffect(() => {
  // Nouvelle propriété : on vide l'état local immédiatement
  if (proprieteId !== loadedIdRef.current) {
    setLocal(EMPTY);
    setSavedAt(null);
    loadedIdRef.current = null;
  }
}, [proprieteId]);

useEffect(() => {
  if (!proprieteId || !query.data) return;
  if (loadedIdRef.current === proprieteId) return; // déjà hydraté
  setLocal(query.data);
  setSavedAt(query.data.updated_at ?? null);
  loadedIdRef.current = proprieteId;
}, [proprieteId, query.data]);
```

### 2. Verrouiller l'autosave sur la propriété hydratée

L'autosave ne doit jamais écrire tant que l'hydratation de la propriété courante n'est pas confirmée, et doit capturer l'`id` cible :

```ts
useEffect(() => {
  if (!proprieteId) return;
  if (loadedIdRef.current !== proprieteId) return; // pas encore hydraté pour CE propriétaire
  const targetId = proprieteId;
  const t = setTimeout(() => {
    persist(local, false, targetId).catch(() => {});
  }, 1500);
  return () => clearTimeout(t);
}, [local, proprieteId]);
```

Et `persist` prend `targetId` en paramètre pour ne jamais écrire vers un id devenu obsolète entre-temps :

```ts
const persist = useCallback(async (state, completed, targetId) => {
  if (!targetId || targetId !== proprieteId) return; // guard anti-race
  await supabase.rpc('upsert_propriete_*', { p_propriete_id: targetId, ... });
  ...
}, [proprieteId]);
```

### 3. Annuler tout debounce en vol au changement d'ID

Dans le cleanup du `useEffect` du changement de `proprieteId`, effacer le `debounceRef` en cours pour qu'un save de A ne parte pas juste après un switch vers B.

## Fichiers touchés

- `src/hooks/propriete/usePropertyObservation.ts` — appliquer le pattern.
- `src/hooks/propriete/usePropertySoil.ts` — appliquer le pattern.
- `src/hooks/propriete/usePropertyFlora.ts` — appliquer le pattern (même bug, même correctif).

Aucun changement de schéma, ni de RPC, ni de composant. Portrait, Cadastre, Identify (partie IA/matching) ne sont pas modifiés.

## Vérification

1. Ouvrir Propriété A → remplir 2-3 blocs J'observe / J'analyse → attendre l'autosave (« Enregistré »).
2. Naviguer vers Propriété B → **les blocs doivent apparaître vides** (ou avec les données propres à B), pas ceux de A.
3. Modifier un champ sur B → recharger B : la valeur persiste. Recharger A : les valeurs originelles de A sont intactes (pas écrasées).
4. Aller-retour rapide A→B→A pendant qu'un autosave est en vol : aucune ligne de A n'est écrite sur B (grâce au guard `targetId !== proprieteId`).