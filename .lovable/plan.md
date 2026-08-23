# Activation des 3 flux de création de compte (LFDV simple → QR code → FJ)

## État des lieux (vérifié)

- Le hook `auth-email-hook` (Resend) gère déjà les 6 actions dont `signup`, avec détection de marque via `user_metadata.app === 'frequence-jardin'` (branding FJ) sinon LFDV. Le backend est prêt pour les 3 flux.
- `MarchesDuVivantConnexion.tsx` : inscription complète (consentement, types de marches, affiliation) avec `emailRedirectTo` déjà paramétré — retour vers `/marches-du-vivant/connexion`, ou vers `…?event=CODE` pour le QR, ou vers `?next=…`. Au retour du lien, la page détecte la session et consomme automatiquement le code événement (`consume_event_signup_link` + email de bienvenue).
- `AuthHashHandler` ne gère que `type=recovery` et les liens expirés. Un lien de **confirmation d'inscription** (`type=signup`) tombant sur la racine n'est pas redirigé : l'utilisateur serait connecté sur la page d'accueil sans rattachement événement.

## Étape 1 — Création de compte simple via LFDV

1. **Whitelist Supabase (action utilisateur, 2 min)** — Authentication → URL Configuration → Redirect URLs, ajouter (le motif `**` couvre `?event=`, `?next=` et `reset-password` en une seule fois) :
   - `https://la-frequence-du-vivant.com/marches-du-vivant/**`
   - `https://www.la-frequence-du-vivant.com/marches-du-vivant/**`
   - `https://la-frequence-du-vivant.lovable.app/marches-du-vivant/**`
   - `https://id-preview--5039e6d4-5f58-4505-8ed8-2cbc8df469b8.lovable.app/marches-du-vivant/**`
2. **Filet de sécurité (code, ce chantier)** — étendre `AuthHashHandler` : si `#access_token=…&type=signup` (ou `magiclink`) arrive sur une mauvaise page (ex. racine), rediriger vers `/marches-du-vivant/connexion` **en conservant le hash** ; la page existante détecte alors la session et route vers mon-espace / consomme l'événement.
3. **Test de bout en bout** — inscription test → email Resend reçu avec branding LFDV (« Bienvenue… ») → clic une seule fois → session active → arrivée dans mon-espace.

## Étape 2 — Création de compte via QR code événement

Aucun code supplémentaire normalement : le flux `?event=CODE` est déjà câblé (pré-inscription immédiate si session, sinon rattachement au retour du lien de confirmation).

1. Vérifier que la whitelist de l'étape 1 couvre bien l'URL avec `?event=CODE`.
2. **Test réel** avec un QR généré dans Admin → Adhésions : scan → inscription → confirmation email → retour auto → toast « pré-inscrit·e à la marche » → page exploration. Vérifier aussi l'email de bienvenue `event-signup-welcome`.
3. Cas limite à valider : utilisateur **déjà inscrit** qui scanne le QR (connexion simple + rattachement).

## Étape 3 — Création de compte via Fréquence Jardin

Travail côté projet FJ (repo séparé) + configuration partagée :

1. **Côté FJ** : `signUp` avec `options.data = { app: 'frequence-jardin' }` (déclenche le branding FJ du hook) et `emailRedirectTo` vers la route de confirmation FJ.
2. **Whitelist Supabase (action utilisateur)** : ajouter les URLs du domaine FJ (preview + production) sur le même principe `/…/**`.
3. **Côté FJ** : page d'atterrissage post-confirmation + équivalent du filet `AuthHashHandler` (lien expiré → renvoi).
4. **Test de bout en bout** : inscription FJ → email Resend avec branding Fréquence Jardin (logo, vert #0D6B58, objet « Bienvenue dans Fréquence Jardin ») → confirmation → session FJ. Vérifier qu'un compte LFDV existant conserve le branding LFDV (pas de régression).

## Détails techniques

- Code touché (ce repo) : `src/components/auth/AuthHashHandler.tsx` uniquement (~15 lignes : prise en charge de `type=signup` / `magiclink` avec hash conservé).
- Aucune migration SQL, aucun secret, aucune modification du hook ou des templates email.
- L'ordre proposé est le bon : chaque étape valide un maillon dont la suivante dépend (whitelist → routage de retour → branding FJ).
- Les actions dashboard Supabase (whitelist) sont faites par toi ; je fournis les valeurs exactes à coller.
</content>
