# Email auth Fréquence Jardin — Resend (contournement DNS Lovable)

L'erreur "Record not supported" signifie que le fournisseur DNS de `la-frequence-du-vivant.com` ne permet pas à Lovable de créer automatiquement les enregistrements email nécessaires (MX, SPF, DKIM, DMARC). De plus, ce projet est branché sur un Supabase externe, donc l'infrastructure email gérée par Lovable (files, secrets, etc.) n'est pas disponible ici.

Le plan est de construire un **hook auth Supabase personnalisé** qui envoie les emails directement via **Resend**, en contournant le setup Lovable-managed.

## Pré-requis de ton côté

1. Créer un compte Resend (ou utiliser un compte existant).
2. Générer une clé API Resend.
3. Vérifier un domaine ou sous-domaine d'envoi dans Resend (par exemple `mail.la-frequence-du-vivant.com`) en ajoutant les enregistrements DNS fournis par Resend chez ton registrar.
4. Ajouter les secrets suivants au projet :
   - `RESEND_API_KEY` : ta clé API Resend
   - `AUTH_EMAIL_HOOK_SECRET` : une chaîne aléatoire que tu saisiras dans Supabase Auth → Hooks
   - `FROM_EMAIL_ADDRESS` : l'adresse d'envoi vérifiée (ex: `noreply@mail.la-frequence-du-vivant.com`)

## Implémentation

1. Créer `supabase/functions/auth-email-hook/index.ts` :
   - Valider la signature du hook Supabase Auth via `AUTH_EMAIL_HOOK_SECRET`.
   - Lire `payload.user?.user_metadata?.app` pour déterminer `brand = 'fj'` ou `'lfdv'`.
   - Router vers les templates React Email correspondants.
   - Appeler l'API Resend directement (`https://api.resend.com/emails`) pour chaque action.

2. Créer les gabarits React Email dans `supabase/functions/_shared/email-templates/` :
   - Sous-dossiers `lfdv/` et `fj/`.
   - Six actions couvertes : `signup`, `invite`, `magiclink`, `recovery`, `email_change`, `reauthentication`.
   - Marque `fj` : texte exact de la demande, couleur primaire `#0D6B58`, accent or, fond blanc `#ffffff`, logo Fréquence Jardin.
   - Marque `lfdv` : textes actuels conservés inchangés.

3. Déployer l'edge function `auth-email-hook`.

4. Configurer le hook dans Supabase Auth :
   - URL = `https://xzbunrtgbfbhinkzkzhf.supabase.co/functions/v1/auth-email-hook`
   - Secret = `AUTH_EMAIL_HOOK_SECRET`
   - Hook = `send_email`

5. Tester avec un email de confirmation sur une inscription Fréquence Jardin.

## Notes techniques

- L'envoi se fait via l'API Resend directe, pas via le gateway Lovable, car le projet est sur un Supabase externe.
- Aucune migration SQL, aucune modification de schéma.
- La seule donnée sensible ajoutée est la clé API Resend, stockée dans les secrets du projet et jamais dans le code.
