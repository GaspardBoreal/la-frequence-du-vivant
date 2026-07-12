
# Carte des Marches du Vivant — page inspirationnelle

Une page publique immersive combinant **nos événements** (source de vérité) avec, en option, les **points partenaires Carte Sol Vivant** (~940 acteurs MSV), pensée pour convertir un visiteur curieux en marcheur inscrit.

**Route :** `/marches-du-vivant/carte-marches-du-vivant` (publique, SEO-ready)

---

## 1. Structure de la page

```text
┌───────────────────────────────────────────────────────────┐
│  HERO : "Explorez la carte du vivant en France"           │
│  Compteurs live : X marches · Y espèces · Z marcheurs     │
│  CTA principal : Rejoindre la communauté                  │
├───────────────────────────────────────────────────────────┤
│  BARRE : Recherche globale + Filtres + Sélecteur de vue   │
├───────────────────────────────────────────────────────────┤
│  VUE ACTIVE (Carte | Timeline | Mur du Vivant |           │
│              Constellation | Liste)                       │
├───────────────────────────────────────────────────────────┤
│  BLOC PARTAGE + CTA final "Créer mon compte marcheur"     │
└───────────────────────────────────────────────────────────┘
```

## 2. Filtres (barre unifiée, sticky)

- **Recherche globale** — réutilise `useGlobalSearch` (espèces, marches, événements, marcheurs, textes)
- **Type d'événement** — Agroécologique / Éco-poétique / Éco-tourisme (chips colorées existantes)
- **Statut** — À venir / Passées / Toutes
- **🌿 Richesse biodiversité** — slider 0 → 100+ espèces (basé sur `get_exploration_species_count`)
- **📅 Période / Saison** — Prochaines · Ce mois · Printemps · Été · Automne · Hiver
- **⚪ Zone blanche vs documentée** — toggle 3 états (Toutes / Pionnières / Documentées) exploitant les snapshots existants
- **🎧 Immersion sensorielle** — filtre "audio disponible" et/ou "photos marcheurs"
- **🤝 Partenaires Sol Vivant** — toggle **OFF par défaut**, avec un panneau explicatif au premier clic : *"Carte Sol Vivant recense 940+ acteurs français du Maraîchage Sol Vivant (MSV). Activez pour visualiser ensemble marches et partenaires du sol vivant."* + lien vers cartesolvivant.gogocarto.fr. Une fois activé, sous-filtres par catégorie GoGoCarto (Maraîchers, Céréaliers, Éleveurs, Arboriculteurs, etc.).

## 3. Vues (sélecteur segmenté)

- **🗺️ Carte** (défaut) — RichMap réutilisé. Marqueurs MdV colorés par type d'événement, taille = richesse biodiv. Marqueurs Sol Vivant en icônes GoGoCarto natives. Clustering intelligent au dézoom. Popup riche avec photo hero + mini-stats + CTA inscription.
- **📅 Timeline immersive** — Horizontal scroll des prochaines marches. Chaque carte = photo hero plein cadre + compte à rebours + lieu + type + CTA "Réserver". Autoplay doux, snap au scroll.
- **🖼️ Mur du Vivant** — Masonry des plus belles photos marcheurs/observations, chaque tuile cliquable ouvre un drawer "espèce / marche source" + CTA rejoindre la marche.
- **✨ Constellation d'espèces** — Canvas SVG animé : chaque marche = étoile pulsante dont le rayon = nb d'espèces, liens filiformes entre marches partageant des espèces. Clic → fiche marche.
- **📋 Liste éditoriale** — Cards triées date/proximité, filtrables, sobre pour pragmatiques.

Toutes les vues partagent le **même state de filtres** (contexte React).

## 4. CTA contextuels

- **CTA global (hero + footer sticky mobile)** : "Rejoindre la communauté des marcheurs" → `/mon-espace` (ou signup).
- **CTA par fiche événement (dans popups, cards, timeline)** : détection **auto session Supabase** :
  - Connecté : bouton vert *"S'inscrire à cette marche"* → flow inscription 1-clic existant.
  - Non connecté : bouton *"Créer mon compte pour rejoindre"* + micro-texte *"Déjà marcheur ? Se connecter"*.
- Badge discret *"3 places restantes"* / *"Complet"* selon `marche_participations` count vs `max_participants`.

## 5. Partage riche

- Bouton **Partager** flottant en haut à droite avec 3 actions :
  1. **Copier lien** (avec query params reflétant les filtres actifs → deep-linkable)
  2. **Web Share API** natif (mobile) + fallback boutons WhatsApp / Email / LinkedIn
  3. **Télécharger l'affiche** → génère une image OG dynamique de la sélection courante
- **OG image dynamique par événement** : edge function `generate-event-og-image` produisant une image 1200×630 (photo hero + titre + date + lieu + logo + "X espèces déjà observées"). Meta tags `og:*` gérés via `react-helmet-async` par fiche événement.

## 6. Architecture technique

### Backend (Supabase)

- **Table `carte_sol_vivant_points`** — cache local des points GoGoCarto (id externe, nom, catégorie, lat, lng, tags, adresse, url source, updated_at). RLS public read.
- **Edge function `sync-carte-sol-vivant`** — fetch `https://cartesolvivant.gogocarto.fr/api/elements.json`, upsert dans la table, log dans `data_collection_logs`. **Cron pg_cron quotidien (03:00 UTC)**.
- **RPC `get_marches_map_events`** — retourne les événements filtrés + agrégats biodiv (nb espèces via `get_exploration_species_count`), coords GPS, photo hero, participants count. Public.
- **Edge function `generate-event-og-image`** — SVG/Satori → PNG, cache par event_id + updated_at.

### Frontend

- `src/pages/CarteMarchesDuVivant.tsx` — page racine + Helmet SEO
- `src/components/carte-mdv/` :
  - `CarteMdVHero.tsx` (compteurs live)
  - `CarteMdVFiltersBar.tsx` (sticky, mobile drawer)
  - `CarteMdVViewSwitcher.tsx` (segmented control)
  - `views/MapView.tsx` (RichMap + calques MdV + calque Sol Vivant conditionnel)
  - `views/TimelineView.tsx`
  - `views/MurDuVivantView.tsx`
  - `views/ConstellationView.tsx` (SVG + framer-motion)
  - `views/ListView.tsx`
  - `EventCard.tsx` (CTA inscription session-aware, badge places)
  - `SolVivantOptInPanel.tsx` (modal d'explication au premier toggle)
  - `SharePanel.tsx` (Web Share API + copie lien deep-linkable)
- `src/hooks/` :
  - `useCarteMdVFilters.ts` (state + sync URL query params)
  - `useCarteMdVEvents.ts` (React Query, RPC)
  - `useCarteSolVivantPoints.ts` (React Query, table locale, enabled si toggle ON)
- Ajout entrée nav dans le hub Marches du Vivant existant.

## 7. Détails UX & wahouh

- Skeleton élégant pendant chargement (silhouette de carte + shimmer)
- Animation d'entrée : marqueurs qui *poussent* à l'apparition (framer-motion `scale` + `easeOutBack`)
- Deep-linking complet : chaque combinaison filtres + vue = URL partageable
- Compteur *"12 marches à venir près de vous"* si géoloc autorisée
- Micro-copy poétique fidèle à la charte (Papier Crème / Forêt Émeraude)
- Responsive mobile-first : bottom sheet pour filtres, vue par défaut Timeline sur mobile (plus digeste que carte)
- SEO : title/description/JSON-LD (Event schema par événement), sitemap-friendly

## 8. Livraison en 4 étapes

1. **Backend** : migration `carte_sol_vivant_points` + RPC `get_marches_map_events` + edge `sync-carte-sol-vivant` + cron
2. **Squelette page + Carte + Filtres + Recherche** (MVP fonctionnel)
3. **3 vues additionnelles** (Timeline, Mur, Constellation, Liste)
4. **OG image dynamique + partage riche + polish animations**

## Points techniques à noter

- L'API GoGoCarto `/api/elements.json` renvoie GeoJSON-like. À valider : pagination éventuelle et champ `categories` exact. La sync se fera en 1 fetch complet (~940 points, léger).
- Aucun impact sur les URLs existantes ni sur la logique métier des inscriptions (réutilisation des flows).
- La détection de session utilise déjà `useAuth()` — pas de nouvelle infra auth.
- La constellation utilise SVG (pas Canvas WebGL) pour rester léger et accessible.

