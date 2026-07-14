## Objectif

Faire remonter la fiche jardin **Déviat** (`/jardin/deviat-jardin-monde-du-11-03-26-a-aujourd-hui-2026-06-30`) quand on tape « DEVIAT » sur Google et dans les IA génératives (ChatGPT, Claude, Gemini, Perplexity, Mistral).

## Constat

La page `ImmersiveGardenFiche.tsx` a déjà `<title>`, `description`, `canonical` — mais :

- Le mot **« Déviat »** n'apparaît pas en H1 texte (tout est carrousel + animations).
- Aucun **JSON-LD** (Place / Event / BreadcrumbList) → invisible pour les moteurs et IA.
- Pas d'`og:image` / `og:url` / `twitter:card` → previews sociaux vides.
- La page n'est **pas listée dans `sitemap.xml**` ni `**public/llms.txt**` (le fichier que ChatGPT/Perplexity/Claude scannent pour découvrir un site).
- Le title est générique `"Jardin — {titre} | Marches du Vivant"` : « Déviat » est noyé au milieu, pas en tête.

## Correctifs (ciblés, rapides, à fort impact)

### 1. `src/pages/ImmersiveGardenFiche.tsx` — enrichir le `<Helmet>`

- **Title orienté ville** : ``${event.lieu ?? ''} — Jardin ${event.title} | La Fréquence du Vivant`` (met la commune en premier → match direct sur « Deviat »).
- Ajouter `og:title`, `og:description`, `og:type=article`, `og:url`, `og:image` (première photo hero absolue), `twitter:card=summary_large_image`.
- Ajouter un `**keywords**` léger : `Deviat, jardin, biodiversité, Charente, Marches du Vivant`.
- Injecter un **JSON-LD `Place` + `BreadcrumbList**` avec `name`, `address.addressLocality = event.lieu`, `geo.latitude/longitude`, `url` canonique, `image`. C'est ce que Google + Perplexity + Gemini lisent en priorité.
- Ajouter un H1 **texte réel** invisible visuellement mais présent dans le DOM (`<h1 className="sr-only">Jardin de Deviat — {event.title}</h1>`) pour donner un signal fort aux crawlers sans casser le design immersif.

### 2. `scripts/generate-sitemap.ts` (ou création si absent)

- Ajouter une entrée **par jardin publié** : fetch Supabase des events `category = 'jardin'` avec `public_slug`, générer `/jardin/{slug}` avec `changefreq: monthly`, `priority: 0.8`. Sans ça, Google ne découvre pas la page.

### 3. `public/llms.txt`

- Ajouter une section **« Jardins du Vivant »** listant les jardins publiés (au moins Déviat), format :
  ```
  - [Jardin de Deviat](/jardin/deviat-jardin-monde-du-11-03-26-a-aujourd-hui-2026-06-30): jardin-monde en Charente, biodiversité observée, immersion sensible.
  ```
  Ce fichier est le canal direct pour ChatGPT, Claude, Perplexity.

### 4. `public/robots.txt`

- Vérifier qu'il ne bloque pas `/jardin/*` (à confirmer d'un coup d'œil, sinon rien à faire).

## Résultat attendu

- Google indexe `/jardin/deviat-…` en 3–10 jours (via sitemap + JSON-LD Place avec `addressLocality: Déviat`).
- ChatGPT / Perplexity / Claude découvrent la page dès leur prochain crawl via `llms.txt`.
- Requête « Deviat jardin » ou « Deviat biodiversité » → la fiche remonte car « Deviat » est en `<title>`, H1, JSON-LD, breadcrumb et description.

## Détails techniques

- Aucun changement backend / RLS : les données jardin sont déjà publiques (RPC `get_public_marche_event`).
- Le hook `useCarteMdVEvents` sert déjà de source pour lister les jardins → réutilisable dans `generate-sitemap.ts` via un `select` direct Supabase côté script Node.
- L'image `og:image` doit être une URL absolue `https://` : utiliser `event.cover_url` ou la 1ʳᵉ photo hero, préfixer `https://la-frequence-du-vivant.com` si relative.
- Rappeler à l'utilisateur qu'après publication il devra soumettre le sitemap dans Google Search Console pour accélérer l'indexation (24-72h au lieu de 1-2 semaines).

## Périmètre exclu

- Pas de refonte du design ni du composant `Helmet` global — juste enrichissement local.
- Pas de nouvelle page — Déviat existe déjà, on la rend seulement crawlable.