Plan : Email auth Fréquence Jardin dans le crochet auth-email-hook de LFDV

Objectif

Faire reconnaître au back LFDV les inscriptions issues de l'app Fréquence Jardin (via `raw_user_meta_data.app = 'frequence-jardin'`) et envoyer des emails d'authentification personnalisés à la marque Fréquence Jardin, sans toucher aux emails de l'app principale Marches du Vivant.

Prérequis (bloquant)

Un domaine d'expéditeur personnalisé est nécessaire pour que le crochet auth-email-hook soit appelé et que les emails partent avec la marque Fréquence Jardin. Actuellement aucun domaine n'est configuré dans cet espace de travail. Le premier pas est donc d'en ajouter un.

- Ouvrir le dialogue d'ajout de domaine email.
- Valider le domaine souhaité (le DNS se propulsera automatiquement ; pas besoin d'attendre la propagation pour scaffolder).

Une fois le domaine enregistré, on peut exécuter le plan ci-dessous.

Étapes d'exécution

1. Scaffolder le crochet auth-email-hook

- Appeler `scaffold_auth_email_templates` pour créer :
  - `supabase/functions/auth-email-hook/index.ts` (routeur webhook + queue d'envoi)
  - `supabase/functions/_shared/email-templates/{signup, magic-link, recovery, invite, email-change, reauthentication}.tsx`
  - La configuration `auth-email-hook` dans `supabase/config.toml`
- Ne pas écraser de fichiers existants (il n'y en a pas aujourd'hui).

2. Lire et comprendre les gabarits générés

- Ouvrir les 6 templates `.tsx` et le routeur `index.ts` pour identifier :
  - La map `emails` qui associe chaque action à un template
  - Les variables reçues (`siteName`, `siteUrl`, `recipient`, `confirmationUrl`, `token`, `email`/`newEmail`)
  - Les styles inline par défaut (bouton noir, texte gris, etc.)
- Cette lecture est obligatoire avant de les réécrire, même après le scaffold.

3. Identifier la marque dans le routeur

Dans `supabase/functions/auth-email-hook/index.ts` :

```typescript
const brand =
  payload.user?.user_metadata?.app === 'frequence-jardin' ? 'fj' : 'lfdv';
```

- Valeur par défaut : `'lfdv'` (comportement actuel inchangé pour les inscriptions classiques).
- Passer `brand` à la map de rendu des emails.

4. Construire une map de rendu par marque et action

Structure attendue :

```text
emails: {
  signup: {
    lfdv: SignupLfdv,
    fj: SignupFj,
  },
  invite: {
    lfdv: InviteLfdv,
    fj: InviteFj,
  },
  magiclink: { ... },
  recovery: { ... },
  email_change: { ... },
  reauthentication: { ... },
}
```

- Chaque action doit avoir impérativement une entrée `lfdv` et une entrée `fj`. Une action absente de la map = email non envoyé, y compris la réinitialisation de mot de passe.
- Le template `lfdv` reste strictement le gabarit scaffoldé (pas de changement de texte ni de couleur).

5. Créer les templates Fréquence Jardin

Charte graphique à appliquer :

- Couleur principale : vert profond `#0D6B58` (identique à `--primary` du mode clair de l'app).
- Accent or : `#c9a84c` (token `--ds-gold`).
- Fond body email : `#ffffff` (blanc pur), comme demandé.
- Police : pile avec `Inter` puis Arial/sans-serif.
- Logo : utiliser le logo Fréquence Jardin existant (`src/assets/brand/frequence-jardin/logos/logo-germination.png`) en le rendant accessible depuis l'email via son URL absolue publique (bucket `email-assets` ou URL CDN Lovable).

Texte exact du signup Fréquence Jardin :

- Objet : `Bienvenue dans Fréquence Jardin 🌱`
- Titre : `Bienvenue dans Fréquence Jardin`
- Corps : `Votre inscription est presque complète. Une confirmation, et vos premiers conseils jardins nourriciers s'ouvrent à vous.`
- Bouton : `Confirmer mon inscription`

Pour les 5 autres actions (invite, magiclink, recovery, email_change, reauthentication) :

- Remplacer `Marches du Vivant` par `Fréquence Jardin`.
- Remplacer le vocabulaire `marches` / `marche` par `jardin` / `jardins` selon le contexte.
- Garder la structure et les variables de chaque gabarit existant.
- Adapter les couleurs et le logo à la charte Fréquence Jardin.

6. Rester compatible avec les variables du webhook

- Les templates utilisent les variables fournies par Supabase : `siteName`, `siteUrl`, `recipient`, `confirmationUrl`, `token`, `email`, `newEmail`.
- Pour les templates `fj`, on peut surcharger `siteName` par `Fréquence Jardin` côté routeur si besoin, mais on continue d'utiliser `confirmationUrl` et `token` tels quels (ne jamais les modifier ni les logger).
- Aucune donnée utilisateur n'est injectée en texte brut sans encodage : React Email gère l'échappement.

7. Garantir la sécurité du routeur

- Conserver la vérification de signature du webhook Lovable (`@lovable.dev/webhooks-js`).
- Conserver l'appel à l'Email API via `@lovable.dev/email-js` / `callback_url`.
- Ne pas accepter de paramètres supplémentaires provenant du client pour choisir la marque : le `brand` est lu uniquement depuis `user_metadata`, côté serveur.
- Aucun secret à ajouter : les tokens Lovable (LOVABLE_API_KEY, etc.) sont provisionnés automatiquement.

8. Déployer le crochet

- Appeler `supabase--deploy_edge_functions` avec `function_names: ["auth-email-hook"]`.
- Vérifier que le déploiement passe sans erreur.

9. Vérifier et prévisualiser

- Ouvrir Cloud → Emails pour confirmer que l'état du domaine passe au vert (DNS vérifié).
- Prévisualiser les templates modifiés : signup, recovery, invite, magiclink (types supportés par l'UI de preview).
- Effectuer un test réel d'inscription depuis Fréquence Jardin pour vérifier l'objet, le corps, le bouton et le logo.

10. Règles de robustesse à maintenir

- Les gabarits `lfdv` restent inchangés : aucune régression pour les marcheurs existants.
- Si `payload.user.user_metadata.app` est absent ou différent de `frequence-jardin`, on tombe toujours sur `lfdv`.
- Chaque action a une entrée dans la map : pas de risque de suppression silencieuse d'un email.
- Les imports React dans `_shared/email-templates` conservent `npm:react@18.3.1` et `npm:@types/react@18.3.1` pour compatibilité edge.

Livrables

- `supabase/functions/auth-email-hook/index.ts` mis à jour avec le routing `brand`.
- 6 templates Fréquence Jardin dans `supabase/functions/_shared/email-templates/` (versions `fj`).
- 6 templates LFDV inchangés (versions `lfdv`).
- Déploiement de `auth-email-hook` sur le projet Supabase.

Pas de migration SQL, pas de changement de schéma, pas de secret ajouté.
