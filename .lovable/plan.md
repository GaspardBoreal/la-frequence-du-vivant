## Diagnostic

L'erreur observée dans le toast (`Edge Function returned a non-2xx status code`) provient des logs de l'edge function `admin-create-marcheur` :

```
AuthApiError: Error sending invite email
status: 500, code: "unexpected_failure"
```

Cause racine : Supabase Auth tente d'envoyer l'email d'invitation via `inviteUserByEmail`, mais **aucun SMTP custom n'est configuré** sur le projet (ou le SMTP par défaut de Supabase a échoué pour cette adresse — quotas, domaine non vérifié, etc.). L'edge function plante alors sans créer ni l'utilisateur ni le profil.

## Correctif proposé

Rendre la fonction **résiliente** : ne jamais bloquer la création d'un marcheur à cause d'un email.

### 1. Edge function `admin-create-marcheur`

- Si `send_invite=true` et que `inviteUserByEmail` échoue → **fallback automatique** sur `createUser` avec un mot de passe temporaire fort généré côté serveur.
- Retourner dans la réponse :
  - `invite_sent: boolean`
  - `temporary_password: string | null` (le mot de passe à transmettre manuellement si l'invitation a échoué)
  - `warning: string | null` (message explicatif pour l'admin)
- Améliorer les logs (`console.warn` sur fallback, `console.error` détaillé sur échec réel).
- Retourner `400` plutôt que `500` pour les erreurs métier (email déjà pris, profil rejeté), pour que le message d'erreur Supabase remonte correctement côté client.

### 2. Composant `NewMarcheurDialog.tsx`

- Lire `data.temporary_password` et `data.warning` dans le `onSuccess` :
  - Si `invite_sent === true` → toast succès "Invitation envoyée à {email}".
  - Sinon → afficher un **toast d'avertissement persistant** avec le mot de passe temporaire à copier (bouton copier), pour que l'admin puisse le transmettre.
- Améliorer la gestion d'erreur : afficher le `error` renvoyé par l'edge function (au lieu du message générique de `functions.invoke`).

### 3. (Optionnel — recommandation pour plus tard)

Si la création par invitation est l'expérience souhaitée à long terme, configurer un SMTP custom (Resend, déjà utilisé par le CRM du projet) dans Supabase → Auth → SMTP Settings. Cela sortirait du scope de ce correctif immédiat mais serait à signaler à l'utilisateur.

## Fichiers modifiés

- `supabase/functions/admin-create-marcheur/index.ts` — fallback invitation→direct, meilleurs codes HTTP, retour du mot de passe temporaire.
- `src/components/admin/community/NewMarcheurDialog.tsx` — affichage du mot de passe temporaire avec copie, message d'erreur détaillé.

Aucune migration de base nécessaire.
