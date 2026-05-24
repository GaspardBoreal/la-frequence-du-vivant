# Scénographies immersives par événement

Chaque marche peut désormais avoir sa propre page publique scénographiée, écrite en TSX, alimentée par ses données réelles (espèces, photos marcheurs, waypoints, témoignages). Le code est stocké en BDD et exécuté en sandbox iframe pour préserver la sécurité.

## 1. Base de données

Migration sur `marche_events` :

- `scenography_code text` — code TSX complet de la scénographie
- `scenography_enabled boolean default false` — toggle ON/OFF (si OFF → page /m/:slug classique)
- `scenography_title text` — titre SEO/social override
- `scenography_updated_at timestamptz` + `scenography_updated_by uuid`

RLS : lecture publique quand `is_published = true AND scenography_enabled = true`. Écriture réservée admin/organisateur de l'event.

## 2. Admin — Onglet « Scénographie »

Nouvel onglet dans `/admin/marche-events/:id` :

- **Éditeur Monaco** (TSX, autocomplétion, lint basique)
- Panneau droit : **données disponibles** (variables injectées : `species[]`, `photos[]`, `waypoints[]`, `testimonies[]`, `texts[]`, `event`) avec types + exemples
- **Snippets** : 4-5 actes prêts à coller (Hero, Éclosion, Dérive, Nuage final)
- Toggle **« Activer la scénographie sur /m/:slug »**
- Bouton **« Preview »** ouvre un drawer iframe avec rendu live
- **Versioning léger** : table `scenography_versions` (id, event_id, code, created_at, author) → liste déroulante pour restaurer

## 3. Runtime sandbox

Composant `<ScenographyRuntime code={...} data={...} />` :

- Iframe sandbox `sandbox="allow-scripts"` (pas `allow-same-origin` → isolation totale, pas d'accès au cookie session)
- À l'intérieur : bundle figé exposant un **runtime restreint** : React 18, Framer Motion, hooks de base, Tailwind (CDN), helpers (`<SpeciesName/>`, `useScrollProgress`, `useMousePos`, `Audio` ambiant optionnel)
- Code TSX transpilé via **`@babel/standalone`** (preset-react + preset-typescript), pas de eval direct
- Whitelist d'imports : aucune. Tout ce qui est dispo est pré-injecté dans le scope global de l'iframe
- Données passées via `postMessage` puis figées en `window.__SCENO_DATA__`
- Hauteur de l'iframe = 100vh, scroll capté à l'intérieur

## 4. Données injectées (RPC unique)

Nouvelle RPC `get_event_scenography_data(event_id uuid)` retourne en un seul appel :

- `event` : titre, dates, slug, lat/lon centre, type
- `species[]` : nom FR/latin, iconic_taxon, fréquence, photo iNat, observateurs
- `photos[]` : url, auteur, date, gps, légende (marcheur_medias)
- `waypoints[]` : trace GPS de la marche
- `testimonies[]` : texte, auteur, date
- `texts[]` : exploration_texts éco-poétiques liés à l'event

Sécurité : la RPC est `SECURITY DEFINER`, filtre PII, ne retourne rien si `scenography_enabled = false` (sauf admin).

## 5. Page publique `/m/:slug`

Refacto léger du composant existant :

```
if (event.scenography_enabled && event.scenography_code) {
  return <ScenographyRuntime code={event.scenography_code} data={...} />
}
return <EventPublicPageClassic event={event} />
```

SEO : si scénographie active, on rend en SSR fallback le titre + description + og:image (premiere photo marcheur) pour crawlers, sandbox iframe se charge ensuite côté client.

## 6. Initialisation event DEVIAT / Jardin Monde

Après build : je pré-remplis `scenography_code` pour l'event `f6095e8d-44a8-4156-951f-dd604b821603` avec une implémentation **CSS/SVG/Framer Motion** des 4 actes du brief (Sol → Éclosion punk → Dérive mycélienne → Nuage Jardin Monde), branchée sur ses vraies données. Le toggle reste OFF par défaut, vous l'activez après preview.

## Détails techniques

- **Pas de R3F** (votre choix CSS/SVG/Framer Motion) → bundle iframe ~120 Ko au lieu de 600 Ko, parfait mobile
- **Réseau mycélien** : SVG `<path>` animés par Framer Motion entre coordonnées calculées
- **Sonification** : Web Audio API minimaliste (oscillateurs), opt-in via bouton « Activer le son » (politique autoplay)
- **Versioning** : garde les 20 dernières versions par event
- **Coût Babel standalone** : ~250 Ko chargé uniquement sur la page scénographie, mis en cache

## Hors scope

- Pas d'éditeur visuel WYSIWYG (édition code direct)
- Pas de React Three Fiber
- Pas de bibliothèque de templates partagés entre events (chaque event est unique, c'est le point)
- Pas de hot-reload preview ultra-rapide (refresh manuel du drawer preview)

## Risques & mitigation

- **XSS** : sandbox iframe sans `allow-same-origin` → impossible d'accéder à Supabase/cookies. Code sale = casse uniquement l'iframe.
- **Code qui boucle** : `setTimeout` 30s côté parent → si iframe ne `postMessage('ready')`, affiche fallback classique
- **Crash mobile** : bouton « Mode classique » toujours accessible en haut à droite de l'iframe

Ordre d'implémentation : (1) migration BDD + RPC, (2) runtime sandbox + Babel, (3) éditeur admin, (4) intégration `/m/:slug`, (5) pré-remplissage event DEVIAT.
