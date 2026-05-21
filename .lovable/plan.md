
# Refonte de la page publique d'événement `/m/:slug`

## Constat de départ

L'infrastructure existe déjà et fonctionne :

- Table `marche_events` avec `is_public`, `public_slug`, `published_at`
- Toggle admin (`PublishPublicPanel`) → URL `/m/:slug`
- Filtre **Tous / Publics / Privés** dans la liste admin
- RPC `get_public_event`, `get_public_event_counters`, `log_public_event_view` (analytics anonymes par session + UTM + referrer)
- Page `PublicEventPage.tsx` minimaliste (hero, métadonnées, partage 5 canaux, JSON-LD Event)

Ce qui manque pour en faire un **levier de viralité** : richesse des données exposées (biodiversité, marcheurs, médias), refonte visuelle immersive, garantie PII, SEO/sitemap, métriques publiques de social-proof.

## Direction visuelle (à confirmer après le plan)

Avant d'écrire la nouvelle page, je passerai par le rituel « 3 directions de design » (palette/typo/layout figés sur Papier Crème + Forêt Émeraude, 3 compositions distinctes du hero + sections) → vous choisissez. Cette étape se déclenche juste après l'approbation du plan.

## Architecture cible

```text
/m/:slug  (PublicEventPage refondue)
├── <Hero>                    cover, titre, date, lieu approx, badges sociaux
├── <SocialProofBar>          X marcheurs · Y espèces · Z observations · vues
├── <BiodiversitySection>     liste espèces (SpeciesName), carte (RichMap, GPS arrondi), mini-synthèse trophique
├── <MarcheursSection>        prénom + initiale + photo opt-in, témoignages publics
├── <MediasSection>           galerie photos publiques, Impact Story résumée
├── <ShareSection>            WhatsApp/X/FB/LinkedIn/email/copy + QR code + OG image
├── <CTASection>              « Rejoindre la prochaine marche » + newsletter + Kit Partage affilié
└── <Footer>                  mentions, lien retour /marches-du-vivant
```

## Étape 1 — Backend : RPC publiques enrichies (migration SQL)

Étendre les 3 RPC existantes (toutes `SECURITY DEFINER`, search_path = public, **PII filtrées au niveau SQL**) :

1. **`get_public_event(_slug)`** → ajouter `event_type`, `cover_image_url`, organisateurs (nom + rôle, sans email), **GPS arrondi à 3 décimales** (~110m).
2. **`get_public_event_biodiversity(_slug)`** → nouvelle : retourne `species[]` (scientific_name, vernacular_fr, iconic_taxon, photo, observations_count) + `observations_geo[]` (lat/lng arrondis, taxon) + `trophic_summary` (producteurs/consommateurs/décomposeurs).
3. **`get_public_event_marcheurs(_slug)`** → nouvelle : retourne uniquement les marcheurs avec `public_consent = true` (prénom + initiale, photo de profil, lien profil public existant `/marcheurs/:slug`).
4. **`get_public_event_testimonies(_slug)`** → nouvelle : témoignages `is_public = true`, signés prénom + initiale.
5. **`get_public_event_medias(_slug)`** → nouvelle : médias `is_public = true` (jamais d'EXIF GPS).
6. **`get_public_event_counters(_slug)`** → ajouter `marcheurs_count`, `species_count`, `observations_count` (pour social proof).
7. **`log_public_event_view`** déjà OK → ajouter un type `event = 'share' | 'cta_click'` pour tracer aussi les partages et clics CTA.

Nouveau champ table `profiles` : `public_event_consent BOOLEAN DEFAULT false` (opt-in pour apparaître nommément sur les pages publiques d'événements).

Nouveau champ table `marche_events` : `cover_image_url` (s'il n'existe pas déjà), pour Open Graph.

## Étape 2 — Frontend : refonte de `PublicEventPage.tsx`

- Reconstruire la page avec la direction visuelle choisie
- Réutiliser `<SpeciesName>`, `<RichMap>`, primitives `src/components/maps/` (cohérence avec Mon Espace)
- `<Helmet>` enrichi : JSON-LD `Event` complet + balise `og:image` pointant vers la cover
- Boutons partage WhatsApp/X/FB/LinkedIn/email/copy **déjà présents** → ajouter QR code (lib `qrcode.react`) téléchargeable
- CTA « Rejoindre une marche » → lien vers `/marches-du-vivant` avec UTM `?utm_source=public_event&utm_campaign={slug}`
- Tracking : appel `log_public_event_view` au mount, `log_public_event_share` au clic partage, `log_public_event_cta` au clic CTA

## Étape 3 — Admin : panneau enrichi (`PublishPublicPanel`)

- Aperçu en iframe de la page publique
- QR code téléchargeable
- Mini-dashboard métriques : vues totales / visiteurs uniques / vues 7 jours / partages par canal / sources (UTM/referrer top 5)
- Bouton « Copier le snippet WhatsApp » (texte + lien préformaté)
- Garde-fou : si `cover_image_url` absent, prompt admin avant publication

## Étape 4 — Confidentialité (PII)

- Aucune adresse email/téléphone ne quitte les RPC publiques (sélection explicite des colonnes)
- GPS arrondis à 3 décimales (~110m) côté SQL — résolution suffisante pour la carte sans révéler une parcelle privée
- Marcheurs : opt-in `public_event_consent` sinon `Marcheur anonyme` (compte mais pas affiché nommément)
- Témoignages/médias : uniquement `is_public = true`

## Étape 5 — SEO & découvrabilité

- Sitemap dynamique : nouvelle Edge Function `public-events-sitemap` qui sert `/sitemap-events.xml` listant tous les `is_public = true`
- Référencer ce sitemap dans `public/robots.txt`
- JSON-LD `Event` complet avec `attendeeCount`, `image`, `location.geo`
- `<link rel="canonical">` → `https://la-frequence-du-vivant.com/m/:slug`

## Étape 6 — Analytics admin

- Réutiliser le tracking existant (`log_public_event_view`) + nouveaux événements `share`/`cta_click`
- Vue admin agrégée dans le dashboard Communauté : top événements publics par vues/partages/conversions CTA, sources de trafic

## Fichiers impactés

**Création**
- Migration SQL : 5 nouvelles RPC + 2 nouvelles colonnes
- `supabase/functions/public-events-sitemap/index.ts`
- Composants : `PublicHero.tsx`, `PublicBiodiversitySection.tsx`, `PublicMarcheursSection.tsx`, `PublicMediasSection.tsx`, `PublicShareSection.tsx`, `PublicCTASection.tsx`, `PublicEventMetricsPanel.tsx` (admin)

**Modification**
- `src/pages/PublicEventPage.tsx` (refonte complète)
- `src/hooks/usePublicEvent.ts` (nouveaux hooks)
- `src/components/admin/marche-events/PublishPublicPanel.tsx` (aperçu + métriques + QR)
- `public/robots.txt` (sitemap-events)

**Aucune rupture** : URLs `/m/:slug` existantes restent valides (contrainte mémorisée).

## Questions restantes (non bloquantes — défauts proposés)

1. **Opt-in marcheur** : par défaut `false`, prompt poétique dans Édition Profil pour le passer à `true`. OK ?
2. **Photos publiques** : critère `is_public = true` sur `marcheur_medias` suffit, ou ajouter un second flag `featured_on_event_page` ?
3. **QR code** : ajouter `qrcode.react` (~5kb) ou générer côté serveur ?
4. **Sitemap** : limiter aux événements publics passés OU inclure aussi les futurs ?

Je peux démarrer dès approbation par l'étape de directions de design pour le hero + sections.
