# Plan — Adhésion à l'association

## 1. Évolution BDD (table `community_profiles`)

Ajout de champs liés à l'adhésion (sans casser l'existant — `types_marches_interets` et `autre_type_marche` sont déjà présents) :

- `is_adherent` (boolean, défaut `false`)
- `college_adhesion` (enum `adhesion_college`: `fondateurs` | `actifs` | `partenaires_mecenes`, nullable)
- `adhesion_date` (timestamptz, nullable)
- `adhesion_source` (text — ex. `formulaire_public`, `qr_code`, `manuel_admin`)
- `rgpd_newsletter_consent` (boolean, défaut `false`)
- `rgpd_newsletter_consent_at` (timestamptz, nullable)
- `adhesion_commentaires` (text, nullable)

Création d'une **table d'audit** `adhesion_requests` (toutes les soumissions du formulaire public, même celles d'un email déjà existant) :

- email, prenom, nom, telephone, ville, types_marches[], autre_type_marche, commentaires, college_demande, rgpd_consent, source, user_agent, ip_hash, matched_profile_id, status (`pending`/`linked`/`created`/`rejected`), created_at.

Politiques RLS : insert public (anon) autorisé sur `adhesion_requests`, lecture admin uniquement. `community_profiles` continue d'être protégée par RLS existante.

## 2. Logique d'adhésion (Edge Function `submit-adhesion`)

Fonction publique (verify_jwt=false) qui :

1. Valide les champs avec Zod (email, longueurs, RGPD obligatoire).
2. Enregistre toujours une ligne dans `adhesion_requests`.
3. Normalise l'email (lowercase + trim) et cherche un `community_profile` existant (via auth.users.email côté service role).
4. **Si trouvé** → met à jour le profil : `is_adherent=true`, `college_adhesion='actifs'`, `adhesion_date=now()`, complète les champs manquants (téléphone, ville, types_marches_interets en union), `rgpd_newsletter_consent=true`. Status request = `linked`.
5. **Si non trouvé** → crée une demande `pending` (pas de création de compte auth automatique, pour éviter le spam). Un onglet admin permettra de valider et créer le compte (réutilise `admin-create-marcheur`). Status request = `pending`.
6. Envoie un email de confirmation via `send-transactional-email` (nouveau template `adhesion-confirmation.tsx`) + notif admin.

Le **Collège des Fondateurs** et **Partenaires/Mécènes** ne sont **jamais** auto-attribués via le formulaire public — seuls les admins peuvent les positionner (sécurité gouvernance). Le formulaire public mentionne les 3 collèges à titre informatif, et l'utilisateur exprime un *souhait* (`college_demande`), mais l'attribution finale reste admin sauf pour `actifs`.

## 3. Formulaire public

Nouvelle route `/adhesion` (page dédiée, SEO optimisée, partageable) + composant `<AdhesionDialog />` (drawer modal réutilisable).

Champs : Prénom, Nom, Email, Téléphone, Ville, Types de marche (checkboxes multi : agroécologique / écotouristique / géopoétique / autre + champ texte), Souhait de collège (radio avec descriptions pédagogiques des 3 collèges), Commentaires, **case RGPD obligatoire** (newsletter + traitement données).

Confirmation : écran de succès avec animation Fréquence + invitation à partager le QR code + lien WhatsApp/email pour parrainer.

## 4. Bouton global "Rejoindre"

Ajout d'un **CTA persistant** dans `PublicTopBar` (header partagé) → ouvre `<AdhesionDialog />`. Présent automatiquement sur toutes les pages publiques listées :

- `/`, `/marches-du-vivant`, `/marches-du-vivant/entreprises`, `/marches-du-vivant/agriculture`, `/marches-du-vivant/explorer`, `/marches-du-vivant/association`.

Pour les pages qui n'utilisent pas `PublicTopBar`, ajout d'un **FAB flottant** discret (bouton "✨ Rejoindre la Fréquence") en bas à droite mobile + desktop, masqué dans l'espace marcheur connecté.

Bandeau d'appel narratif en bas de la home (`/`) et de `/marches-du-vivant/association` : section "Devenir Marcheur de la Fréquence" avec les 3 collèges illustrés (cartes glassmorphism dans la palette Forêt Émeraude/Papier Crème).

## 5. QR Code

- Page admin dédiée `/access-admin-gb2025` → onglet **"Kit Adhésion"** : génère un QR code (lib `qrcode`) pointant vers `https://la-frequence-du-vivant.com/adhesion?src=qr&campaign=<slug>` avec paramètres trackés (UTM-like) pour mesurer la provenance (flyer, mug, tee-shirt, salon X…).
- Téléchargement PNG haute résolution + SVG vectoriel + PDF prêt à imprimer (A6 flyer recto/verso avec QR + baseline + 3 collèges).
- Bonus créatif : QR code stylisé (logo Fréquence au centre, couleurs Forêt Émeraude) via `qr-code-styling`.

## 6. Bonus créatifs (prescription & viralité)

- **Parrainage** : chaque adhérent reçoit un lien `?ref=<slug>` (réutilise le système d'affiliation `community_affiliate_links` déjà en place — voir mem). Les filleuls liés à un parrain comptent vers un badge "Sentinelle".
- **Carte d'adhérent numérique** générée après adhésion (PDF + Apple Wallet `.pkpass` plus tard) avec n° adhérent, collège, QR de profil.
- **Onglet admin "Adhésions"** dans `MarcheAdmin` : kanban `pending → linked/created → relancé`, export CSV des adhérents par collège, KPIs (taux conversion QR, sources).
- **Email automatique** de bienvenue narratif (« Vous venez de rejoindre la Fréquence du Vivant… ») + lien pour compléter le profil Kigo.
- **Open Graph** dédié sur `/adhesion` (image générée premium) pour partage social soigné.

## Questions ouvertes

1. **Validation des Fondateurs / Mécènes** : je confirmes que ces 2 collèges sont **uniquement attribués manuellement par un admin** (le formulaire public ne fait qu'enregistrer un *souhait*).
2. **Adhésion = cotisation ?** Rester sur une adhésion gratuite/déclarative dans un premier temps avec cotisation gérée hors-ligne (ou plus tard)
3. **Création de compte marcheur** : pour un nouvel adhérent inconnu, on crée immédiatement un compte auth
4. **Slug de campagne QR** : je veux pouvoir créer des QR multiples (1 par support : flyer-salon-agri-2026, mug-noel, etc.) avec stats par campagne et j'ai besoin dès aujourd'hui du QR CODE "Flyer Devenez marcheur du vivant"