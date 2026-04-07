

## Résoudre les timeouts d'inscription (cas Victor)

### Problème

L'envoi de l'email de confirmation lors du signup prend >10s, déclenchant un timeout 504 côté Supabase Auth. L'utilisateur voit une erreur, réessaie, et chaque tentative crée puis détruit un compte fantôme.

### Solution en 2 volets

#### 1. Configurer Resend comme SMTP custom (action manuelle dans le dashboard Supabase)

Vous utilisez déjà Resend pour les emails CRM. Il faut le configurer comme fournisseur SMTP dans Supabase Auth pour accélérer l'envoi des emails de confirmation :

- **Dashboard Supabase** → Authentication → SMTP Settings
- Host: `smtp.resend.com`, Port: `465`, User: `resend`, Password: votre clé API Resend
- Sender: une adresse vérifiée dans Resend (ex: `no-reply@la-frequence-du-vivant.com`)

Cela devrait réduire le temps d'envoi de >10s à <2s.

#### 2. Améliorer la résilience côté code (useCommunityAuth.ts)

- Ajouter un `try/catch` avec retry automatique (1 retry après 2s) sur le `signUp`
- Afficher un message "Inscription en cours, veuillez patienter..." pendant le processus
- Si timeout, vérifier si l'utilisateur a quand même été créé avant de réessayer (via `checkEmailExists`)
- Empêcher les clics multiples (disable du bouton pendant le chargement)

### Fichier impacté

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useCommunityAuth.ts` — ajouter retry + garde anti-doublon |

### Action manuelle requise

Configurer Resend comme SMTP custom dans le dashboard Supabase : [Authentication → SMTP Settings](https://supabase.com/dashboard/project/xzbunrtgbfbhinkzkzhf/auth/providers)

