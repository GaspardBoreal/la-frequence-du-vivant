# Diagnostic — Colyne Bernard / BORDEAUX Patio ISEG

## Ce que dit la BDD

- Profil `3d0d27ff…` / user `3e3a7897…`, rôle = `marcheur_en_devenir`, `marches_count = 0`
- Compte iNat lié : `colyne2` ✅
- **2 inscriptions** (`marche_participations`) :
  - DEVIAT « Marcher sur un sol qui respire »
  - BORDEAUX / Patio végétalisé ISEG (expl. `75e1…d8`)
- Sur les **deux**, `validated_at IS NULL` et `validation_method IS NULL`
- Aucune entrée dans `marcheur_backfill_log` pour cet utilisateur

## Cause racine — un seul verrou, deux symptômes

Le champ `validated_at` est le **gate unique** de tout le pipeline marcheur :

1. **Rôle bloqué à « En devenir »**
  Le trigger de promotion (`role-promotion-only-trigger`) ne passe à `marcheur` que lorsque `validated_at IS NOT NULL`. Tant que la présence n'est pas validée, le rôle reste `marcheur_en_devenir`, même si l'inscription existe.
2. **Aucune observation iNat remontée**
  Le cron `backfill-marcheur-inat-batch` filtre explicitement :
   Colyne a bien le compte iNat lié, mais comme `validated_at = NULL`, **elle n'entre jamais dans la boucle de backfill** → ses 10 observations iNat ne sont jamais rattachées à la marche, ni copiées dans `marcheur_observations`, ni visibles dans Patio ISEG.

Le trigger `participation-validation-trigger` (`mem://technical/community/participation-validation-trigger`) qui devrait déclencher la synchro au moment de la validation ne se déclenche jamais non plus, pour la même raison.

**Conclusion :** ce n'est pas un bug de code, c'est un **état BDD incohérent** — l'inscription a été créée (probablement via auto-invite ou inscription libre) sans jamais passer par l'étape « validation de présence » qui appose `validated_at`. La logique métier actuelle considère donc Colyne comme jamais venue, alors qu'elle a un compte iNat actif et 10 obs.

## Correctif proposé — 3 niveaux

### 1. Correctif data immédiat (Colyne + Patio ISEG)

Migration ponctuelle :

- `UPDATE marche_participations SET validated_at = now(), validation_method = 'manual_backfill' WHERE id IN (…ses 2 lignes…)`
- Déclenche automatiquement :
  - promotion `marcheur_en_devenir` → `marcheur` via trigger
  - synchro iNat via trigger `backfill-marcheur-inaturalist` sur les 2 explorations
- Vérification : ses 10 obs doivent apparaître dans `marcheur_observations` et dans le « Pouls du vivant ».

### 2. Correctif structurel — détecter la dérive

Nouveau dashboard admin (onglet **Communauté → Inscriptions non validées**) listant :

- Marcheurs inscrits depuis > 48 h avec `validated_at IS NULL`
- Indicateur « ⚠ compte iNat lié + obs disponibles non remontées »
- Bouton « Valider rétroactivement » (un clic → UPDATE + trigger backfill)

Évite que d'autres Colyne restent invisibles.

### 3. Hardening pipeline — élargir le filet de sécurité du backfill

Modifier `backfill-marcheur-inat-batch` pour inclure **aussi** les participations non validées **si** :

- compte iNat lié ET
- au moins 1 obs iNat dans la fenêtre/rayon de la marche

Stratégie : 2e passe dans le cron (basse priorité) qui tente le backfill « opportuniste ». Si on trouve des obs dans le périmètre, on auto-valide la participation (`validation_method = 'inat_auto'`) et on déclenche la promotion. Une obs iNat géolocalisée dans le rayon d'une marche à laquelle on est inscrit = preuve de présence suffisante.

## Fichiers touchés

- **Migration** : `UPDATE marche_participations` (les 2 lignes de Colyne) + éventuel script de rattrapage global pour tous les marcheurs avec compte iNat lié et participation > 48 h sans validation
- **Edge** `supabase/functions/backfill-marcheur-inat-batch/index.ts` : 2e passe opportuniste
- **Admin** `src/components/admin/CommunauteDashboard.tsx` (+ nouvelle sous-page `UnvalidatedRegistrationsTab.tsx`)
- **Mémoire** : nouveau `mem://technical/community/validated-at-as-pipeline-gate` documentant le verrou unique

## Question avant build

Souhaites-tu :

- **A** — uniquement le correctif #1 (fix Colyne maintenant) ?
- **B** — #1 + #2 (fix + dashboard de détection) ?
- **C** — les 3 (fix + dashboard + auto-validation opportuniste via iNat) ?

Recommandé : **C**, c'est le seul qui empêche le problème de se reproduire silencieusement.  
  
GO POUR LE C

&nbsp;