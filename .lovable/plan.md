# Lier intelligemment un marcheur à son compte iNaturalist (et eBird/GBIF)

**Constat sur Gaspard Boréal** : son profil existe (`Gaspard Boréal`, marcheur), il a **81 observations / 65 espèces** sous le nom "Gaspard Boréal" / source iNaturalist dans nos `biodiversity_snapshots` — mais **aucune entrée** dans `community_profile_science_accounts`. Tout est là pour un rapprochement quasi automatique.

## Idée maîtresse : suggérer, ne jamais imposer

On détecte les correspondances **observer-name ↔ marcheur**, on les présente comme des **suggestions** que l'admin lie en 1 clic. Aucune écriture automatique : on protège l'intégrité (homonymes possibles).

```text
[ Carte Gaspard Boréal ]
 ┌──────────────────────────────────────────┐
 │ Gaspard Boréal · Marcheur · Sarlat       │
 │                                          │
 │  ✦  Suggestion : iNaturalist             │
 │     « Gaspard Boréal » · 81 obs · 65 esp │
 │     dernière : 8 mai 2026                │
 │            [ Lier ce compte ]  [ ✕ ]     │
 │                                          │
 │ 0 compte science participative           │
 └──────────────────────────────────────────┘
```

## 1. Détection côté base — RPC SQL agrégée

Nouvelle fonction `public.suggest_science_accounts(_admin_only)` SECURITY DEFINER, admin-only, qui retourne :

```text
profile_id | candidate_name | network | observer_count | species_count
last_observation_date | sample_url | sample_external_id (user_login iNat si déjà connu)
match_confidence  ('exact' | 'normalized' | 'fuzzy')
```

Logique :
- Source : `biodiversity_snapshots.species_data[].attributions[]`
- Match : `unaccent(lower(prenom||' '||nom)) = unaccent(lower(observerName))` (ré-utilise notre logique NFD existante).
- Filtre : exclut les paires déjà présentes dans `community_profile_science_accounts (profile_id, network, username)`.
- Détecte les **homonymes** : si plusieurs `community_profiles` matchent le même `observerName`, `match_confidence='fuzzy'` et la UI prévient.

## 2. Résolution canonique iNaturalist (one-shot, mémorisée)

Au moment où l'admin clique "Lier", on appelle l'edge function existante **`resolve-inaturalist-user`** avec le `sample_url` pour récupérer le **`user_login`** stable (≠ display name). On stocke :
- `username` = `user_login` iNat
- `display_name` = nom affiché
- `external_id` = `user_id` numérique iNat
- `profile_url` = `https://www.inaturalist.org/people/<user_login>`
- `verified = true` (rapprochement opéré par admin avec preuve URL)

Pour eBird/GBIF (pas d'API user lookup gratuite équivalente) : on stocke `username = observerName` tel quel + `profile_url` template ; l'admin peut éditer ensuite.

## 3. Surface UI — 3 points de friction nulle

### a. Bandeau de tête dans `Profils` (`ProfilsMosaique`)
```text
┌─────────────────────────────────────────────────────────────┐
│ ✦ 12 suggestions de comptes sciences participatives         │
│   détectées (iN: 9 · eB: 2 · GBIF: 1)        [ Tout voir ▸ ]│
└─────────────────────────────────────────────────────────────┘
```
Cliquable → ouvre une **drawer "Suggestions intelligentes"** listant chaque ligne avec :
- avatar marcheur, nom, ville
- badge réseau, nom détecté, "81 obs · 65 esp · MAJ 8 mai"
- mini-vignette de la dernière observation (lien iNat)
- boutons `[ Lier ]` `[ Ignorer ]` `[ Ouvrir profil ]`
- raccourci `[ Tout lier (les évidences) ]` qui ne traite que les `confidence='exact'` sans homonyme.

### b. Pastille "suggestion" sur `ProfilCard`
Si suggestion existante non liée et non ignorée :
- micro-pastille dorée pulsante à côté des badges réseaux
- tooltip : "iNaturalist détecté : 81 obs"
- clic → ouvre directement la sheet sur la section Suggestions

### c. Section dédiée dans `MarcheurEditSheet`
Au-dessus de l'éditeur de comptes existant : **"Suggestions intelligentes"** qui liste les suggestions du marcheur avec bouton "Lier en 1 clic". Une fois lié → le compte apparaît dans la liste éditable habituelle.

## 4. Mémoire des suggestions ignorées

Petite table `community_science_account_suggestions_ignored (profile_id, network, observer_name, ignored_at, ignored_by)` pour ne pas re-proposer indéfiniment la même suggestion rejetée. Possibilité de "réinitialiser les ignorées" depuis la drawer.

## 5. Flux pour Gaspard (résultat attendu)

1. Admin ouvre `/admin/community → Profils` → bandeau "✦ 1 suggestion iNat".
2. Drawer s'ouvre, ligne **Gaspard Boréal · iNaturalist · 81 obs · 65 esp** déjà cochée.
3. Clic "Lier" → appel edge `resolve-inaturalist-user` → écriture `community_profile_science_accounts` avec `username=gaspard_boreal` (ou son user_login réel), `verified=true`.
4. Carte de Gaspard arbore désormais le badge **iN** vert avec ✓, lien direct vers son profil iNat public.

## Détails techniques

- **Migration** : RPC `suggest_science_accounts()` (security definer, vérifie `is_admin_user()`), table `community_science_account_suggestions_ignored` + RLS admin-only.
- **Edge function** : aucune nouvelle ; on réutilise `resolve-inaturalist-user`. Petit ajout : accepter aussi `observation_url` en batch (array) pour résoudre N suggestions à la fois et limiter les round-trips.
- **Hook** : `useScienceAccountSuggestions()` (admin) qui appelle la RPC, dérive un compteur global pour le bandeau, et expose `linkSuggestion(suggestion)` qui : (1) résout le user_login iNat si applicable, (2) appelle `useUpsertScienceAccount` avec `verified=true`, (3) invalide les caches.
- **Composants nouveaux** : `SuggestionsBanner.tsx`, `SuggestionsDrawer.tsx`, mini section `SuggestionsList.tsx` réutilisée dans la sheet.
- **Composants modifiés** : `ProfilsMosaique.tsx` (bandeau en tête), `ProfilCard.tsx` (pastille dorée), `MarcheurEditSheet.tsx` (section au-dessus de l'éditeur).
- **Sécurité** : la RPC ne renvoie que des données déjà publiques (noms publics iNat/eBird/GBIF) ; aucune PII supplémentaire exposée. Toutes les écritures restent gouvernées par les RLS existantes (admin OU propriétaire).
- **Performance** : RPC mise en cache TanStack 5 min ; appel `resolve-inaturalist-user` uniquement à la liaison (pas au listing) ; "Tout lier" séquentiel pour respecter le rate-limit iNat (1 req/s).

## Évolution naturelle (hors scope V1, pour info)

- Étendre la même mécanique côté **espace marcheur** ("Et si c'était votre compte iNat ?") avec `verified=false` pour qu'il valide lui-même.
- Au moment de la création d'un nouveau marcheur (`NewMarcheurDialog`) : champ optionnel "Compte iNat ?" avec auto-complétion via `https://api.inaturalist.org/v1/users/autocomplete?q=`.

## Question pour sécuriser

Quel niveau d'automatisme préfères-tu pour la V1 ?
- **A. Suggestion uniquement** (admin valide 1 par 1) — *recommandé pour la confiance.*
- **B. Auto-lier les évidences** (`confidence=exact` + 0 homonyme) sans clic, et suggérer le reste.
- **C. A + bouton "Tout lier les évidences"** dans la drawer (compromis : auto-massif mais conscient).
