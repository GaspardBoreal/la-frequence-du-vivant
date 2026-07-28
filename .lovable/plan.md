## Constat (vérifié à l'instant)

- Les 5 secrets SMTP existent bien : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.
- La fonction `send-smtp-email` n'a **aucun log récent** et les logs d'authentification sont vides → aucun envoi tenté récemment (pas encore une preuve de panne, mais rien ne confirme que ça marche).
- Il y a **deux circuits d'email indépendants** pour un nouvel inscrit :
  1. **L'email de confirmation Supabase** (envoyé par Supabase Auth lui-même, `emailRedirectTo` → `/marches-du-vivant/connexion`). Il dépend du SMTP configuré dans le dashboard Supabase, pas des secrets ci-dessus.
  2. **L'email de bienvenue maison** (`useCommunityAuth.signUp` → fonction `send-smtp-email` → serveur SMTP via les secrets).

Une panne sur l'un n'empêche pas l'autre : il faut tester les deux, séparément.

## Plan de vérification (≈ 5 minutes, sans rien casser)

1. **Test du circuit maison** — appel direct de `send-smtp-email` vers une adresse que vous contrôlez. Résultat immédiat : soit l'email arrive (circuit OK), soit on obtient l'erreur SMTP exacte (identifiants refusés, port bloqué, quota, domaine non autorisé).
2. **Test du circuit Supabase Auth** — déclenchement d'une réinitialisation de mot de passe sur une adresse test (même moteur d'envoi que l'email de confirmation d'inscription), puis lecture des logs d'authentification pour voir si Supabase signale une erreur d'envoi.
3. **Lecture des logs** des deux tests pour nommer la cause précise.

## Correction (selon le résultat)

- **SMTP refusé / expiré** : mise à jour du secret concerné (`SMTP_PASSWORD` le plus souvent) — 1 minute.
- **SMTP Supabase Auth non configuré ou expiré** : vous le corrigez dans le dashboard Supabase (Authentication → Emails → SMTP Settings), je vous indique exactement quel champ.
- **Rien de cassé** : je vous le dis clairement, et on regarde plutôt si les inscriptions arrivent bien en base (le problème serait alors côté inscription, pas email).

## Renforcement (optionnel, si le temps le permet)

Ajout d'une trace d'erreur explicite côté inscription : aujourd'hui, si `send-smtp-email` échoue, l'échec est silencieux et personne ne le sait. Une remontée d'erreur visible en console + un log permettrait de détecter la panne immédiatement la prochaine fois.

### Détails techniques

`supabase/functions/send-smtp-email/index.ts` exige un jeton utilisateur authentifié (anti-relais spam) — le test utilisera la session de prévisualisation. `src/hooks/useCommunityAuth.ts` ligne 177 invoque la fonction après le `signUp` ligne 121, sans vérifier l'erreur retournée.
