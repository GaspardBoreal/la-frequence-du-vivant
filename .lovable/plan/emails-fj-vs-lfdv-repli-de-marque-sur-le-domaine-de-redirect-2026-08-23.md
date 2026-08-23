# Emails FJ vs LFDV : repli de marque sur le domaine de redirection

## Diagnostic (vérifié)

- Le hook `auth-email-hook` route **déjà** par marque : `user_metadata.app === 'frequence-jardin'` → gabarits FJ, sinon LFDV. Les 6 gabarits des deux marques existent (`_shared/email-templates/fj` et `lfdv`).
- Le compte de test `aurelien.dript@gmail.com` (créé le 23/08 à 08:19 UTC) **ne porte aucune métadonnée `app`** — l'email LFDV reçu s'explique donc par ce repli, pas par un défaut de routage.
- Fait aggravant : **aucun des 63 comptes** de la base ne porte `app: 'frequence-jardin'`. Tant que la métadonnée n'est pas posée (ou rafraîchie) côté FJ, tous les emails partent en branding LFDV.

La bonne réponse côté LFDV est exactement l'étape 3 proposée par le projet FJ : un **repli de marque basé sur l'URL de redirection** du payload, qui couvre les comptes anciens et le « mot de passe oublié » sans dépendre de la métadonnée.

## Étape 1 — Résolution de marque robuste dans `auth-email-hook`

Remplacer la sélection actuelle (ligne ~179) par une fonction `resolveBrand(userMetadata, redirectTo)` appliquée dans cet ordre :

1. `user_metadata.app === 'frequence-jardin'` → `fj` (comportement actuel, inchangé).
2. Sinon, si le host de `email_data.redirect_to` correspond à un domaine FJ connu → `fj`.
   - Liste par défaut : `frequence-jardin.lovable.app` (+ tout sous-domaine `*.lovable.app` contenant `frequence-jardin`, pour couvrir les previews `id-preview--…`).
   - Liste extensible sans redéploiement via la variable d'environnement `AUTH_EMAIL_FJ_DOMAINS` (domaines séparés par des virgules) — utile le jour où FJ aura son domaine personnalisé.
3. Sinon → `lfdv` (défaut, aucune régression pour les marcheurs).

Le `siteUrl` passe déjà par `getSiteUrl(redirectTo)` : les emails FJ pointeront automatiquement vers `https://frequence-jardin.lovable.app`. Les logs du hook gagnent un champ `brandSource` (`metadata` / `redirect_to` / `default`) pour la recette.

## Étape 2 — Redéploiement

Déployer `auth-email-hook` et vérifier un appel réussi dans les logs (événement `auth_email_sent` avec `brand` et `brandSource`).

## Étape 3 — Recette de bout en bout

1. **Inscription neuve depuis FJ** (nouvelle adresse) → email « Bienvenue dans Fréquence Jardin », vert `#0D6B58`, logo FJ.
2. **Mot de passe oublié depuis FJ** avec le compte de test existant (sans métadonnée) → doit désormais partir en branding FJ grâce au repli `redirect_to` (cas précis du bug remonté).
3. **Inscription + mot de passe oublié depuis LFDV** → branding LFDV inchangé (non-régression).
4. Vérifier dans les logs : `brandSource: redirect_to` pour le cas 2, `metadata` dès que FJ posera la métadonnée.

## Côté projet FJ (hors de ce repo, à leur main)

Leur étape 4 (rafraîchir `app: 'frequence-jardin'` dans les métadonnées à chaque connexion) reste utile en complément : elle fiabilise la source `metadata` au fil des connexions. Non bloquante une fois le repli en place.

## Détails techniques

- Fichier touché : `supabase/functions/auth-email-hook/index.ts` uniquement (~30 lignes : fonction `resolveBrand` + champ de log).
- Aucune migration SQL, aucun changement de schéma, aucun secret obligatoire (`AUTH_EMAIL_FJ_DOMAINS` optionnel).
- Aucun backfill de métadonnées sur les 63 comptes existants : impossible de déterminer rétroactivement leur origine, et le repli `redirect_to` couvre déjà leurs emails futurs.
