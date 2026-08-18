# QR codes d'inscription à un événement

Le module Admin → Adhésions sait aujourd'hui générer des QR codes vers la page d'adhésion associative. On lui ajoute une seconde famille de QR codes : « inscrire un nouveau marcheur à un événement précis », avec pour premier cas « Château Boutinet : le vignoble vivant » (26 septembre 2026).

## Ce que voit l'utilisateur

### Dans l'admin (nouvel onglet « QR événement »)

Une fiche par événement, créée en choisissant une marche dans la liste :

- Événement rattaché, libellé de l'opération (ex. « Affiche cave Boutinet »).
- Interrupteur **Actif / Inactif** — coupe le rattachement immédiatement.
- **Expiration** : par défaut le lendemain de la marche, modifiable.
- **Email de bienvenue** : objet + message en éditeur riche (gras, souligné, couleurs, liens), avec des variables insérables (`{prenom}`, `{titre_evenement}`, `{date}`, `{lieu}`, `{lien_evenement}`). Bouton « M'envoyer un test ».
- **Compteur de pré-inscrits** bien visible : « 12 pré-inscrits » (et « 12 / 40 » quand la marche a une jauge), avec la liste nominative dessous et un export CSV.
- Aperçu du QR, téléchargement PNG haute définition et SVG, copie du lien.

Le QR pointe rigoureusement vers :
`https://la-frequence-du-vivant.com/marches-du-vivant/connexion?tab=inscription&event=<code>`

### Pour le marcheur qui scanne

1. La page de connexion s'ouvre **sur l'onglet Inscription**, avec un bandeau : « Vous vous inscrivez à Château Boutinet : le vignoble vivant — samedi 26 septembre, Villegouge ».
2. Il crée son compte comme d'habitude.
3. Il est **pré-inscrit** à l'événement : la participation est enregistrée sans validation de présence (la présence sera validée le jour J par l'organisateur). L'événement apparaît aussitôt dans « Mon espace → Marches » à venir, avec accès aux informations de l'événement dans l'application.
4. Il reçoit **immédiatement** l'email paramétré, puis **une seconde fois** au premier accès après confirmation de son adresse (rappel), sans jamais recevoir deux fois le même rappel.
5. Un compte déjà existant qui scanne le QR se connecte via l'onglet Connexion : il est rattaché au même événement et reçoit le même email.

Cas d'arrêt propres et lisibles : lien désactivé, lien expiré, ou déjà pré-inscrit → bandeau explicatif, l'inscription au site reste possible.

## Détails techniques

- **Base** — nouvelle table `public.event_signup_links` : `event_id`, `code` (aléatoire, indexé unique), `label`, `is_active`, `expires_at`, `email_subject`, `email_html`, compteurs `created_by/at`. GRANTs : `select` anon/authenticated (lecture publique du strict nécessaire via RPC), écriture réservée aux admins ; RLS admin-only sur la table, lecture par RPC `SECURITY DEFINER`.
  - `peek_event_signup_link(_code)` → validité + titre/date/lieu de la marche (aucune donnée sensible).
  - `consume_event_signup_link(_code)` → crée la ligne `marche_participations` (`validated_at` NULL, `validation_method = 'qr_signup'`) pour `auth.uid()`, idempotent, refuse si inactif/expiré ; renvoie `event_id`.
- **Front** — `MarchesDuVivantConnexion.tsx` : lecture du paramètre `event`, forçage de l'onglet Inscription, bandeau événement, appel du RPC après `signUp` (et après `signIn` pour un compte existant), redirection vers l'espace exploration.
- **Email** — edge function `event-signup-welcome` (service role) : rend le HTML paramétré avec les variables, envoie via l'infrastructure SMTP existante, et journalise l'envoi (immédiat / rappel) pour ne pas doubler. Le HTML admin est nettoyé côté serveur avec la sanitisation déjà en place.
- **Admin** — `src/pages/AdhesionAdmin.tsx` : nouvel onglet ; composants `EventQrCard`, `EventEmailEditor` (réutilise l'éditeur riche existant du projet), `EventSignupsList`. Génération QR par la même librairie `qrcode` et la même charte de couleurs.
- Le compteur lit `marche_participations` de l'événement (pré-inscrits = `validated_at IS NULL`), jauge issue de `max_participants`.

## Hors périmètre

Relances automatiques programmées, paiement/billetterie, QR de validation de présence le jour J (déjà existant).
