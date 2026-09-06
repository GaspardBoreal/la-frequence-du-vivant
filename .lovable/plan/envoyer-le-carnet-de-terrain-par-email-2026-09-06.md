# Envoyer le Carnet de Terrain par email

Depuis la fiche d'un Tour de Jardin, l'utilisateur peut envoyer le carnet (PDF) à un maximum de 10 destinataires, choisis parmi les marcheurs liés au jardin ou aux marches du jardin, et/ou saisis à la main.

## Ce que voit l'utilisateur

Dans la fenêtre « Carnet de terrain », à côté de « Télécharger », un bouton **Envoyer par email** ouvre une fenêtre en trois temps, pensée pour le mobile :

1. **Destinataires**
   - Liste des marcheurs rattachés au jardin et des participants des marches du jardin : nom, rôle (propriétaire, prestataire, participant), case à cocher. Recherche par nom.
   - Les adresses email ne sont jamais affichées ni chargées dans le navigateur : seuls les noms apparaissent, l'adresse est résolue au moment de l'envoi côté serveur. Un marcheur sans adresse connue apparaît grisé, non sélectionnable.
   - Champ libre pour ajouter des adresses saisies directement (validation du format, ajout par Entrée ou virgule).
   - Compteur « 4 / 10 » ; au-delà de 10 la sélection est bloquée avec un message clair.
2. **Message**
   - Objet pré-rempli : « Carnet de terrain — {Jardin} — {date du tour} », modifiable.
   - Corps de message pré-rempli en quelques phrases, modifiable.
3. **Envoi**
   - Le PDF est produit dans le navigateur (comme aujourd'hui pour le téléchargement) puis transmis au serveur qui envoie les emails.
   - Confirmation « Carnet envoyé à 4 personnes », ou message d'erreur en français si l'envoi échoue.

## L'email reçu

Mise en page aux couleurs Fréquence Jardin (vert profond, papier crème, titres sobres) :

- En-tête « Fréquence Jardin » ;
- Le message écrit par l'expéditeur ;
- Un résumé : nom du jardin, date et durée du tour, saison, et la liste des gestes retenus ;
- Le PDF du carnet en pièce jointe ;
- Signature de bas de page « Fréquence Jardin — La Fréquence du Vivant » avec le lien vers le site.

Expéditeur : l'adresse d'envoi déjà configurée pour le site, avec le nom affiché « Fréquence Jardin ». Les réponses reviennent à la personne qui a envoyé le carnet.

## Historique

Sous la liste des gestes, dans la fiche du tour, une ligne dépliable « Envois du carnet » liste chaque envoi : date, personne qui a envoyé, nombre et noms/adresses des destinataires, et le statut (envoyé / échec).

## Détails techniques

**Base de données** (une migration)
- `public.propriete_carnet_envois` : `id`, `tour_id` (FK cascade vers `propriete_tours`), `propriete_id`, `sent_by` (uuid), `subject`, `body`, `recipients jsonb` (nom + email masqué partiellement pour l'affichage), `recipient_count int`, `status text` (`sent` | `partial` | `failed`), `error text`, `created_at`.
  GRANT `select` à `authenticated`, `all` à `service_role`, RLS activée, policy `select` via `public.can_access_propriete(propriete_id)` ; l'insertion se fait par la fonction serveur (service role).
- RPC `public.get_propriete_carnet_recipients(p_propriete_id uuid)` en `SECURITY DEFINER`, `search_path = public` : refuse si `NOT public.can_access_propriete(p_propriete_id)` ; renvoie `community_profile_id`, `nom`, `prenom`, `role`, `has_email boolean` — jamais l'adresse. Source : `propriete_marcheurs` + participants (`marche_participations`) des marches liées via `propriete_marche_events`, dédoublonnés. GRANT `execute` à `authenticated`.

**Fonction serveur** `supabase/functions/send-carnet-terrain/index.ts`
- Auth via `../_shared/auth-helper.ts` ; vérifie l'accès au jardin (lecture de `proprietes` en client utilisateur, 403 sinon).
- Validation Zod : `tourId`, `proprieteId`, `subject` (≤ 200), `body` (≤ 5000), `profileIds` (uuid[]), `emails` (string[] validés), total ≤ 10, `pdfBase64` (≤ 8 Mo), `pdfFilename`, plus les champs du résumé (jardin, date, durée, saison, gestes retenus).
- Résolution des adresses des `profileIds` côté service role (`community_profiles.user_id` → `auth.users.email`) ; les profils sans email sont ignorés et signalés dans la réponse.
- Rendu HTML de l'email dans un module `_shared/frequence-jardin-email.ts` (styles inline, tokens de marque) + version texte.
- Envoi via Resend : `POST https://api.resend.com/emails`, `Authorization: Bearer ${RESEND_API_KEY}` (secret déjà présent), `from: "Fréquence Jardin <${FROM_EMAIL_ADDRESS}>"`, `reply_to` = email de l'expéditeur, `bcc` pour ne pas exposer les destinataires entre eux, `attachments: [{ filename, content: pdfBase64 }]`. Statut et corps d'erreur Resend relayés tels quels en cas d'échec.
- Écriture de la ligne d'historique dans `propriete_carnet_envois` (service role) avant de répondre.

**Front**
- `CarnetTerrainPdf.tsx` : exposer une fonction `buildCarnetPdfBlob(props)` réutilisée par le téléchargement et par l'envoi (aucun changement de mise en page).
- Nouveau `src/components/propriete/tour/carnet/CarnetSendDialog.tsx` (sélection, message, envoi) et `src/hooks/propriete/useCarnetRecipients.ts` (RPC) + `useSendCarnet.ts` (mutation `functions.invoke`, messages d'erreur en français comme `messageErreurSuggestion`).
- Bouton « Envoyer par email » dans `CarnetTerrainDialog.tsx` ; historique dans `TourDetail.tsx` via `useCarnetEnvois(tourId)`.
- Tokens sémantiques uniquement, cibles tactiles ≥ 40 px, `focus-visible`, listes défilables plafonnées à `max-h-[50vh]`.

**Vérification** : `npx tsgo --noEmit -p tsconfig.app.json`, puis un envoi réel de test vers une seule adresse.
