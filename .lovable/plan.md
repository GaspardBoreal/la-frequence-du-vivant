# Studio Newsletter — module d'emailing dans le back-office

Un nouvel outil d'administration pour composer, cibler, tester, envoyer et mesurer les newsletters et campagnes marketing des univers Marches du Vivant, Fréquence Jardin, Fréquence Vignoble — ou tous.

Accès : Administration → Outils → « Studio Newsletter » (`/admin/outils/newsletter`).

## Ce que vous pourrez faire

**1. Créer une campagne (brouillon)**
- Nom interne, univers, objet, pré-en-tête, expéditeur.
- Composition par blocs à assembler : titre, paragraphe, image (par adresse web), bouton d'action, séparateur, citation, carte « marche / article », pied de page.
- Chaque bloc se déplace, se duplique, se supprime. Aperçu fidèle ordinateur / téléphone en direct.
- Habillage automatique aux couleurs de l'univers choisi (Marches, Jardin, Vignoble, Tous).
- Lien de désinscription inséré automatiquement dans chaque envoi, impossible à retirer.

**2. Choisir les destinataires**
- Univers calculé automatiquement selon l'activité réelle : jardin rattaché → Jardin, participation à une marche → Marches, événement vignoble → Vignoble.
- Étiquettes posées à la main pour corriger ou enrichir ce classement.
- Sélection libre personne par personne, avec recherche, filtres (rôle, ville, adhérent, dernière activité) et tout cocher / tout décocher.
- Envoi à tous les inscrits, avec lien de désinscription respecté : une personne désinscrite est exclue définitivement de tous les envois suivants.
- Compteur en direct : « 64 destinataires, dont 3 désinscrits exclus ».

**3. Tester avant d'envoyer**
- Envoi de test à 10 adresses maximum, choisies dans la liste des marcheurs ou saisies à la main.
- L'objet du test est préfixé « [TEST] », le message n'est pas comptabilisé dans les statistiques.

**4. Envoyer pour de bon**
- Écran de confirmation récapitulant univers, nombre de destinataires, objet, expéditeur.
- Envoi par paquets, avec progression visible et reprise possible si un envoi s'interrompt.
- Adresse d'envoi : le sous-domaine déjà vérifié `mail.la-frequence-du-vivant.com`, avec réponse redirigée vers votre adresse habituelle.

**5. Mesurer**
- Réception automatique des évènements d'envoi : remis, ouvert, cliqué, désabonné, erreur d'adresse, signalement.
- Tableau de bord par campagne : envoyés, remis, taux d'ouverture, taux de clic, désinscriptions, erreurs, courbe des 72 premières heures, classement des liens les plus cliqués, liste des personnes ayant ouvert / cliqué.
- Vue d'ensemble comparant les campagnes entre elles, et relance en un geste des destinataires n'ayant pas ouvert.

## Détails techniques

**Base de données (une migration)**
- `newsletter_campaigns` : nom, univers, objet, preheader, from_name, from_email, reply_to, `blocks` jsonb, statut (brouillon / test / envoi_en_cours / envoyee / arretee), audience jsonb (mode, univers, ids sélectionnés), compteurs, dates, created_by.
- `newsletter_recipients` : campagne, profile_id, email, statut par personne (queued/sent/delivered/opened/clicked/bounced/complained/unsubscribed), `resend_message_id`, horodatages, contrainte unique (campagne, email).
- `newsletter_events` : campagne, recipient, type, url cliquée, payload brut, reçu_le — source des KPI.
- `newsletter_unsubscribes` : email, motif, date, token — table d'exclusion globale.
- `newsletter_audience_tags` : profile_id, univers (étiquette manuelle).
- Toutes en `public` avec GRANT explicites (`authenticated` lecture pour admins via policies `check_is_admin_user`, `service_role` complet), RLS activée, aucun accès `anon`.
- RPC `get_newsletter_audience(_univers, _profile_ids)` SECURITY DEFINER, réservée aux admins : résout les emails via `auth.users` (comme `admin_get_profile_emails`), applique univers automatique + étiquettes, exclut les désinscrits.
- RPC `get_newsletter_campaign_kpis(_campaign_id)` : agrégats et série horaire.

**Fonctions edge**
- `newsletter-send` (JWT admin vérifié en code) : valide la campagne avec Zod, résout l'audience via la RPC, réécrit les liens en liens de suivi, injecte le lien de désinscription, envoie par lots de 100 via Resend (`batch/emails`), en-têtes `List-Unsubscribe` et `List-Unsubscribe-Post`, enregistre `resend_message_id` par destinataire, met à jour le statut. Mode `test: true` → adresses fournies uniquement.
- `newsletter-webhook` (public, sans JWT, signature Svix Resend vérifiée avec le secret `RESEND_WEBHOOK_SECRET`) : ingère `email.sent/delivered/opened/clicked/bounced/complained`, écrit dans `newsletter_events` et met à jour `newsletter_recipients`.
- `newsletter-track` (public) : redirection des liens de suivi (`/r/<token>`) → enregistre le clic puis redirige ; `/u/<token>` → page de désinscription et insertion dans `newsletter_unsubscribes`.
- Rendu HTML partagé dans `_shared/newsletter-render.ts` (tableaux compatibles clients mail, version texte automatique).

**Front**
- `src/pages/AdminNewsletter.tsx` (liste des campagnes + KPI globaux), `AdminNewsletterEditor.tsx` (composition / ciblage / test / envoi en 4 étapes), `AdminNewsletterStats.tsx`.
- `src/components/admin/newsletter/` : `BlockCanvas`, `BlockInspector`, `EmailPreview`, `AudiencePicker`, `TestSendDialog`, `SendConfirmDialog`, `CampaignKpis`.
- `src/lib/newsletter/blocks.ts` (types de blocs + rendu aperçu partagé avec l'edge), `universTheme.ts`.
- Hooks `src/hooks/admin/useNewsletterCampaigns.ts`, `useNewsletterAudience.ts`, `useNewsletterKpis.ts`.
- Routes ajoutées dans `src/App.tsx`, carte « Studio Newsletter » ajoutée dans `AdminOutilsHub.tsx`.
- Mobile first, vocabulaire « Assistant » si une aide automatique est proposée, aucun jargon dans l'interface.

**À prévoir de votre côté**
- Un secret `RESEND_WEBHOOK_SECRET` à créer dans Resend puis à enregistrer ici (je vous le demanderai une fois le point de réception déployé).
- Activer dans Resend le suivi des ouvertures et des clics pour le domaine d'envoi.

## Ordre de réalisation
1. Migration base + RPC.
2. Rendu des blocs + éditeur et aperçu.
3. Ciblage (univers automatique, étiquettes, sélection libre).
4. Envoi de test, puis envoi réel par lots.
5. Réception des évènements, désinscription, liens de suivi.
6. Tableau de bord KPI et relance des non-ouvreurs.
