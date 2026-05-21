# Publication publique des événements — lecture seule

Transformer chaque marche autorisée en vitrine publique partageable : URL canonique, médias, biodiversité, témoignages, marcheurs (pseudonymisés), métriques + CTA viraux.

---

## 1. Modèle de données

Ajouts sur `public.marche_events` :

- `is_public boolean NOT NULL DEFAULT false` — toggle admin
- `public_slug text UNIQUE` — slug SEO (généré via `unaccent` à la première activation, ex : `marche-bergerac-2026-05-21`)
- `published_at timestamptz` — horodatage de la première mise en ligne
- `published_by uuid` — admin qui a publié

Nouvelle table `public.event_public_views` (analytics) :

- `event_id`, `viewed_at timestamptz default now()`
- `session_id text` (cookie anonyme, hash) → unicité visiteur
- `referrer text`, `utm_source/medium/campaign text`
- `country text` (depuis header), `user_agent_family text`
- Index `(event_id, viewed_at)`

RPC sécurisées `SECURITY DEFINER` (jamais d'accès table directe pour le public) :

- `get_public_event(_slug text)` → infos événement + organisateurs
- `get_public_event_marcheurs(_slug)` → prénom + initiale + avatar + rôle (jamais email/téléphone/nom complet)
- `get_public_event_biodiversity(_slug)` → snapshots + observations marcheurs fusionnés
- `get_public_event_media(_slug)` → convivialité, témoignages publiés, audio, textes
- `get_public_event_counters(_slug)` → vues, visiteurs uniques (J/7j/total)
- `log_public_event_view(_slug, _session, _referrer, _utm...)` → insertion analytics

RLS : `is_public = true` requis pour toutes les RPC publiques. Aucune policy SELECT directe ouverte sur `marche_events`.

---

## 2. Routes & URLs

```text
/marches/:slug                  → page publique canonique (SEO)
/m/:eventId                     → redirect 301 vers /marches/:slug (compat QR codes)
```

Layout dédié `PublicEventLayout` (mobile-first, thème Papier Crème, glassmorphism léger). Onglets internes :

1. **Récit** — hero (titre, date, lieu, organisateurs), photo de couverture, description
2. **Marcheurs** — grille avatars pseudonymisés + compteur rôles
3. **Vivant** — carte des observations + grille espèces (réutilise `RichMap` + `SpeciesName`)
4. **Convivialité** — mur photo + témoignages + audio
5. **Empreinte** — fréquence collective + indicateurs clés

Pas d'authentification requise. Tous les composants existants sont réutilisés en mode `readOnly`.

---

## 3. Contrôle admin

Dans `MarcheEventDetail` (header) :

- Switch **« Publier publiquement »** (Papier Crème, halo doré quand ON)
- Quand ON : panneau dépliant avec URL canonique, bouton Copier, QR code téléchargeable, mini-aperçu OG
- Bouton **« Voir la page publique »** (ouvre dans nouvel onglet)

Dans `EventsListTab` :

- Nouveau filtre **Visibilité publique** : `Tous` (défaut) / `Publics` / `Privés`
- Badge `🌍 Public` à côté du titre quand `is_public = true`
- Colonne compteur de vues (sparkline 7j)

---

## 4. SEO & partage social

- `react-helmet-async` par route `/marches/:slug` : title, description, canonical, og:image, JSON-LD `Event` (date, location, organizer)
- Image Open Graph dynamique : edge function `og-event-image` (1200×630) avec titre + lieu + date + visuel de couverture
- Bouton **Partager** flottant : WhatsApp, Facebook, X, LinkedIn, Email, Copier le lien (avec UTM auto `utm_source=share&utm_medium={canal}`)
- Ajout au `sitemap.xml` généré (script `predev/prebuild`) de tous les événements `is_public = true`

---

## 5. Analytics & boucle virale

**Tracking** (côté client, sur mount de la page publique) :

- Cookie anonyme `mdv_session` (UUID, 30j)
- 1 appel `log_public_event_view` au mount avec referrer + UTM parsés
- Heartbeat toutes les 30s pour mesurer le temps passé (optionnel, phase 2)

**Affichage public** (preuve sociale) :

- En haut de page : `🌱 1 247 personnes ont découvert cette marche`
- Compteur live-ish (rafraîchi toutes les 60s)

**Dashboard admin** — nouvel onglet **« Rayonnement »** dans `MarcheEventDetail` :

- KPIs : vues totales, visiteurs uniques, temps moyen, top referrers, répartition canaux de partage
- Graphique 30 jours (réutilise `activity-chart-time-series-logic` en Paris-local-time)
- Top 5 marches publiques (vue cross-events)

**Bouton viral marcheur** (dans `mon-espace`) :

- Quand la marche du marcheur devient publique : notification + bouton **« Partager ma marche »** dans `MarchesTab`
- Compteur personnel : `🌟 Ma marche a inspiré X visiteurs`
- Bonus Fréquence : +5 par partage tracké (UTM avec son slug marcheur)

---

## 6. CTAs de conversion

Footer de chaque page publique (sticky en mobile) :

- **« Rejoindre la prochaine marche »** → `/marches-du-vivant` (liste filtrée à venir)
- **« Organiser ma marche »** → `/marches-du-vivant/organiser`
- Lien discret **« Propulsé par La Fréquence du Vivant »**

---

## 7. Sécurité & RGPD

- Toggle admin uniquement (vérif `has_role(auth.uid(), 'admin')`)
- Marcheurs pseudonymisés systématiquement côté RPC (jamais d'email/téléphone exposé)
- Aucun média marqué privé n'est exposé (filtre `visibility = 'public'` sur convivialité/témoignages)
- Bannière discrète en pied de page : « Données partagées avec l'accord des participants »
- Phase 2 (non bloquant) : consentement explicite par marcheur via opt-out depuis son espace

---

## 8. Découpage de livraison

**Lot 1 — Fondations (publication + URL)**

- Migration : colonnes `is_public/public_slug/published_at/published_by`, génération slug, RPC `get_public_event*`
- Page `/marches/:slug` (récit + marcheurs + vivant + convivialité)
- Toggle admin + filtre liste + badge

**Lot 2 — Viralité**

- Boutons partage + UTM
- Open Graph dynamique (edge function image) + JSON-LD `Event`
- Sitemap auto

**Lot 3 — Analytics**

- Table `event_public_views` + RPC log
- Onglet « Rayonnement » admin + compteur public preuve sociale
- Bouton partage marcheur + bonus Fréquence

**Lot 4 (optionnel)**

- Heartbeat temps passé, opt-out marcheur, QR code téléchargeable enrichi

---

## 9. Fichiers principaux à créer / modifier

Création :

- `supabase/migrations/<ts>_public_events.sql`
- `supabase/functions/og-event-image/index.ts`
- `src/pages/PublicEventPage.tsx` + sous-composants `src/components/public-event/*`
- `src/hooks/usePublicEvent.ts`, `usePublicEventTracking.ts`
- `src/components/admin/marche-events/PublishPublicPanel.tsx`
- `src/components/admin/marche-events/RayonnementTab.tsx`

Modification :

- `src/App.tsx` (routes `/marches/:slug` + redirect `/m/:id`)
- `src/components/admin/marche-events/EventsListTab.tsx` (filtre + badge)
- `src/pages/MarcheEventDetail.tsx` (panneau publication + onglet Rayonnement)
- `src/components/community/tabs/MarchesTab.tsx` (bouton partage marcheur)
- `scripts/generate-sitemap.ts` (entrées dynamiques)
- `mem://index.md` + nouvelle mémoire `features/public-event-publication-logic`

---

## Questions de cadrage restantes

1. **Slug** : auto-généré à l'activation
2. **Image de couverture** : Champ dédié à uploader par l'admin
3. **Période d'expiration** : la page reste publique indéfiniment
4. **Bonus Fréquence partage** : +5 par share unique (par session/canal)