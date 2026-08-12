# La Roadmap vivante — journal hebdomadaire public

Un espace public `/roadmap` qui raconte, semaine après semaine, ce qui a réellement été produit et publié, décliné pour trois publics : marcheurs, propriétaires de sites, partenaires. Et un atelier admin pour composer l'édition de la semaine et en tirer les posts sociaux.

## 1. Le public : `/roadmap`

**Accueil — la frise du vivant**
Une timeline horizontale (verticale sur mobile) où chaque semaine est une « saison » : numéro de semaine, dates, titre éditorial, trois pastilles indiquant combien de nouveautés concernent chaque public, et une image de couverture. Au-dessus, un bandeau de chiffres vivants (semaines publiées, nouveautés cumulées, espèces observées, propriétés suivies, capteurs actifs) alimenté par les données réelles du projet.

Clic sur une semaine = ouverture de l'édition : le récit de la semaine, puis les nouveautés une à une, chacune avec son titre, sa promesse en une phrase, ses captures d'écran et, quand c'est utile, un petit schéma explicatif.

**Trois sous-menus**

```text
Accueil   ·   Marcheurs   ·   Propriétaires de sites   ·   Partenaires
```

- **Marcheurs** — ton sensible, verbes d'action : collecter, reconnaître, apprendre. Nouveautés filtrées sur cette cible, plus un « avant / après » (ce qu'on savait faire il y a un mois, ce qu'on sait faire aujourd'hui).
- **Propriétaires** — ton opérationnel : mieux connaître, gérer, prévoir. Mise en avant des chaînes complètes (observer → analyser → identifier → projeter), captures de l'Atelier du jardin, des capteurs, des palettes.
- **Partenaires** — ton démonstratif : cadence de livraison (nombre de nouveautés par semaine sur 12 semaines), répartition par domaine, jalons franchis, et les preuves en images.

Chaque page cible garde la même frise, filtrée. Footer Marches du Vivant partout.

**Effets « wahouh » retenus** (sobres, pas décoratifs) : frise qui s'anime à l'entrée, captures présentées dans un cadre type fenêtre avec ombre douce, ouverture plein écran d'une capture, compteurs qui montent, et un lien de partage direct vers une semaine ou une nouveauté.

## 2. L'admin : l'atelier de l'édition hebdomadaire

Accessible depuis le tableau de bord admin, une page `/admin/roadmap` en trois temps.

**Temps 1 — Rassembler.** Un bouton « Composer la semaine du … » ouvre un espace qui pré-remplit la matière disponible : ce que vous collez (prompts, notes, changelog), et un relevé automatique de l'activité de la période (nouvelles marches, propriétés, consultations, capteurs, exports, espèces). Vous complétez librement.

**Temps 2 — Rédiger.** L'IA propose, à partir de cette matière, une liste de nouveautés : titre, phrase de promesse, public(s) concerné(s), domaine, et trois formulations du même acquis (une par cible). Tout est éditable, réordonnable, supprimable. Vous ajoutez les captures d'écran (dépôt d'images, plusieurs par nouveauté, réutilisables d'une semaine à l'autre via une médiathèque roadmap).

**Temps 3 — Publier et diffuser.** L'édition entière bascule en public d'un seul geste (rien n'est visible avant). Puis, pour chaque cible et chaque réseau, l'IA génère : le texte LinkedIn, Instagram, Pinterest, un visuel de post construit à partir d'une capture choisie et de la charte du projet, et un calendrier de diffusion sur la semaine (quel post, quel jour, quel réseau). Copie en un clic, export du pack de la semaine.

Un bandeau d'état indique toujours : édition en brouillon / publiée, nombre de nouveautés, couverture des trois cibles (alerte si une cible est vide).

## 3. Réponse à votre demande de génération automatique des captures

Je ne peux pas fabriquer une capture d'écran fidèle « à partir du code » sans ouvrir l'écran concerné. Ce que l'atelier fera, en revanche : pour chaque nouveauté, vous indiquez l'écran de l'application concerné (une adresse interne), et l'admin capture cet écran réel depuis votre navigateur, l'habille dans un cadre soigné, et l'attache à la nouveauté. Vous validez ou remplacez par un dépôt manuel. C'est réel, pas simulé.

## 4. Détails techniques

**Base** — quatre tables :
- `roadmap_weeks` (`iso_year`, `iso_week`, `starts_on`, `ends_on`, `title`, `narrative`, `cover_media`, `status` brouillon/publié, `published_at`), unique sur (année, semaine).
- `roadmap_entries` (`week_id`, `title`, `promise`, `body`, `domain`, `audiences text[]` parmi marcheur/proprietaire/partenaire, `pitch_marcheur`, `pitch_proprietaire`, `pitch_partenaire`, `position`).
- `roadmap_media` (médiathèque : `storage_path`, `caption`, `kind` capture/schema/visuel, `source_route`) + table de liaison `roadmap_entry_media` (`entry_id`, `media_id`, `position`).
- `roadmap_social_posts` (`week_id`, `audience`, `network`, `body`, `hashtags`, `visual_media_id`, `scheduled_for`, `status`).
GRANT + RLS : `anon`/`authenticated` en `SELECT` uniquement sur les lignes dont la semaine est `published` (via fonction `security definer` `roadmap_week_is_public`) ; écriture réservée aux admins (`check_is_admin_user`) ; `service_role` complet. Bucket public `roadmap-media`, écriture admin.

**Edge functions** :
- `roadmap-compose` — reçoit texte collé + relevé d'activité, appelle Lovable AI (`google/gemini-3.6-flash`, sortie structurée via `Output.object`, schéma plat sans bornes) et renvoie une liste d'entrées proposées. Auth admin obligatoire, streaming pour éviter les coupures.
- `roadmap-social` — génère les textes par (cible × réseau) + calendrier ; visuel de post via génération d'image à partir de la capture retenue.
- `roadmap-activity-digest` — agrégats de la période (marches, propriétés, consultations, capteurs, mesures, espèces, exports) en lecture seule.

**Front** :
- `src/pages/RoadmapPublic.tsx` (+ `RoadmapWeekPage.tsx`, `RoadmapAudiencePage.tsx`) montés sur `/roadmap`, `/roadmap/semaine/:annee-:semaine`, `/roadmap/marcheurs|proprietaires|partenaires`, en `lazyWithRetry` dans `App.tsx`, avec `Footer` existant.
- `src/components/roadmap/` : `RoadmapTimeline`, `WeekCard`, `EntryCard`, `ScreenshotFrame`, `AudienceSwitcher`, `LiveStats`, `CadenceChart` (recharts), `EntryLightbox`.
- `src/pages/AdminRoadmap.tsx` + `src/components/roadmap/admin/` : `WeekComposer`, `EntryEditor` (dnd-kit pour l'ordre), `MediaLibraryPicker`, `ScreenCapturePanel` (capture via `html2canvas` d'une route rendue en iframe interne), `SocialStudio`, `PublishBar`.
- Hooks : `useRoadmapWeeks`, `useRoadmapWeek`, `useRoadmapAdmin`, `useRoadmapSocial` (React Query, invalidation ciblée).
- Tokens sémantiques uniquement (thèmes clair/sombre), noms d'espèces via `<SpeciesName />` si affichés, états chargement / erreur / vide sur chaque vue.
- SEO : `react-helmet-async` (titre, description, JSON-LD `Article` par semaine), entrée dans `public/sitemap.xml` et `public/llms.txt`.
- Carte « Roadmap vivante » ajoutée dans `src/pages/AdminAccess.tsx`.

**Hors périmètre** : publication automatique sur les réseaux (les posts sont générés et copiés, pas postés).
