# Fonction d'envoi d'email SMTP réutilisable

## Objectif
Créer une edge function Supabase générique `send-smtp-email` utilisable depuis n'importe quelle partie de l'app (front via `supabase.functions.invoke`, ou autres edge functions via fetch interne) pour envoyer des emails via un serveur SMTP classique (OVH, Gmail, Infomaniak, etc.).

## Secrets requis
À ajouter via le tool `add_secret` avant déploiement :
- `SMTP_HOST` (ex. `ssl0.ovh.net`)
- `SMTP_PORT` (ex. `465` pour SSL, `587` pour STARTTLS)
- `SMTP_USER` (login SMTP complet)
- `SMTP_PASSWORD` (mot de passe SMTP)
- `SMTP_FROM` (optionnel, expéditeur par défaut, ex. `"La Fréquence du Vivant <no-reply@…>"`)

## Edge function : `supabase/functions/send-smtp-email/index.ts`

**Librairie** : `denomailer` (`https://deno.land/x/denomailer`) — support SSL/STARTTLS, attachments, HTML+text, fiable en Deno.

**Configuration** : ajout dans `supabase/config.toml` avec `verify_jwt = true` (par défaut auth utilisateur requis pour empêcher abus / spam relay). Possibilité d'override avec un secret API key partagée si appel inter-functions sans JWT utilisateur.

**Validation** (Zod) :
```text
{
  to: string | string[]        // requis, email(s) valides
  subject: string              // requis, 1..200
  html?: string                // optionnel
  text?: string                // optionnel (au moins l'un des deux)
  from?: string                // override SMTP_FROM
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: [{ filename, content (base64), contentType }]
}
```

**Logique** :
1. CORS preflight
2. Validate JWT (admin OR auth user — configurable, démarrer avec auth user requis)
3. Parse + valider le body
4. Construire `SMTPClient` avec TLS auto-détecté selon port (465 → implicit TLS, autres → STARTTLS)
5. `client.send({ from, to, subject, html, content (text), cc, bcc, replyTo, attachments })`
6. `client.close()`
7. Retourner `{ success: true, messageId }` ou `{ error }` avec status approprié
8. Logs `console.log` minimalistes (jamais le password)

## Utilisation côté front
```text
const { data, error } = await supabase.functions.invoke('send-smtp-email', {
  body: { to, subject, html }
});
```

## Utilisation depuis une autre edge function
Soit via `supabase.functions.invoke` avec service role, soit `fetch` direct vers l'URL de la function avec header Authorization.

## Hors scope
- Templates email (laisser au caller le HTML/texte)
- File d'attente / retry (envoi synchrone simple ; à ajouter ultérieurement si besoin)
- Tracking ouvertures / unsubscribe
- Migration des envois existants (`admin-create-marcheur`, `event-invitation-create` continuent d'utiliser `auth.admin.inviteUserByEmail`)

## Étapes d'exécution (après approbation)
1. `add_secret` pour les 5 secrets SMTP
2. Créer `supabase/functions/send-smtp-email/index.ts`
3. Mettre à jour `supabase/config.toml` (entrée function)
4. Déploiement automatique
5. Test rapide via `curl_edge_functions` avec un email de test
