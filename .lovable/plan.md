# Correction : compte science non enregistré dans la fiche marcheur

## Diagnostic

Vérifié en base : pour Vincent Levavasseur (`community_profiles.id = 25525422-…`), la table `community_profile_science_accounts` ne contient **aucune ligne**. Le compte `vincentlevavasseur` n'a jamais été inséré.

**Cause racine** : dans `MarcheurEditSheet`, le sous-composant `ScienceAccountsEditor` possède son **propre formulaire interne** (panneau « Ajouter » avec ses champs Réseau / Identifiant / URL et un bouton « Enregistrer » local en ligne 138).

Le flux utilisateur est donc piégeur :
1. L'admin clique sur « Ajouter » → un mini-formulaire s'ouvre.
2. Il saisit `vincentlevavasseur`.
3. Il clique sur le **bouton « Enregistrer » global** de la Sheet en bas → celui-ci n'appelle que `update community_profiles`, jamais `upsert science_accounts`.
4. La Sheet se ferme, le compte est perdu sans erreur ni avertissement.

Les RLS sont correctes (`is_admin_user()` couvre l'admin), ce n'est pas un blocage de permission — la requête n'est tout simplement jamais envoyée. Pas de log d'erreur côté Postgres ni edge.

## Correctif proposé

Unifier la sauvegarde : le bouton « Enregistrer » de la fiche doit aussi flusher le compte science en cours de saisie. Trois ajustements ciblés.

### 1. `ScienceAccountsEditor.tsx` — exposer un flush impératif

- Convertir en `forwardRef` exposant `flushPending(): Promise<void>`.
- `flushPending` : si le panneau « Ajouter » est ouvert ET `username.trim()` non vide → appelle `upsert.mutateAsync(...)` puis `reset()`. Sinon no-op.
- Conserver le bouton « Enregistrer » interne (utile pour ajouter plusieurs comptes d'affilée sans fermer la Sheet).
- Ajouter un état visuel « non enregistré » (point ambre + texte « brouillon non enregistré ») quand `adding && username.trim()` pour rendre le problème visible.

### 2. `MarcheurEditSheet.tsx` — appeler le flush avant le submit

- Créer `const scienceRef = useRef<{ flushPending: () => Promise<void> }>(null)`.
- Passer `ref={scienceRef}` au `<ScienceAccountsEditor />`.
- Dans le handler du bouton « Enregistrer » global :
  ```ts
  await scienceRef.current?.flushPending();
  mutation.mutate(form);
  ```
- Idem dans `onOpenChange(false)` : si flush en attente → soit auto-save, soit `toast.warning('Compte science non enregistré')` + garder la Sheet ouverte. Choix retenu : **auto-save silencieux** pour coller au comportement attendu par l'admin.

### 3. Vérification post-correctif

- Rouvrir la fiche de Vincent, saisir `vincentlevavasseur` sur iNaturalist, cliquer le bouton global « Enregistrer ».
- Vérifier en base :
  ```sql
  select network, username, profile_url, verified
  from community_profile_science_accounts
  where profile_id = '25525422-a324-459e-8c3b-34a05dc70362';
  ```
- Confirmer que `useMarcheurAliases` retourne bien `vincentlevavasseur` (alias normalisé) → préalable indispensable à l'**Option A** (reconnaissance iNat CV → `marcheur_observations` → snapshots).

## Hors-scope (suite logique)

Une fois ce correctif validé, on enchaîne sur **Option A** : edge function `recognize-marcheur-photos` itérant sur `marcheur_medias` d'un événement, appelant `/v1/computervision/score_image` d'iNaturalist avec lat/lng/date EXIF, créant les `marcheur_observations` (+ fallback GPS pour les 6 photos sans EXIF), et drawer de curation pour les suggestions sous seuil de confiance.
