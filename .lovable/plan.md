# 🔍 Moteur de recherche « Forêt Émeraude »

Un FAB flottant 🔍 ouvre une overlay plein écran immersive (glassmorphism vert émeraude, particules, halos) qui cherche en live, avec tolérance aux fautes et aux accents, dans **5 univers de données** et affiche les résultats groupés par type avec un picto distinctif.

---

## 1. Périmètre v1

- **Marcheur (global)** : recherche dans toutes ses marches/événements/carnet/outils via FAB visible partout dans `/marches-du-vivant/mon-espace` et `/exploration/:id`.
- **Admin (cross-marcheurs)** : même UX dans `/admin/...`, mais scope élargi (tous les marcheurs, tous les événements).
- Pas de mode « événement uniquement » au v1 : un toggle in-overlay « Cet événement / Toutes mes marches » sera disponible **uniquement** quand on est sur une page exploration.

---

## 2. Sources de données interrogées

| Type | Picto | Source |
|---|---|---|
| 🌿 Espèce | feuille verte | `biodiversity_snapshots.species_data` + `marcheur_observations` (nom commun FR via `useFrenchSpeciesNamesAuto` + nom scientifique) |
| ✨ Pratique remarquable | étoile dorée | `exploration_curations` (source='main', liée marcheur) |
| 📖 Texte / écrit / témoignage | livre ouvert | `marche_textes` + `event_testimonies` + descriptions audio marcheur |
| 👤 Marcheur | silhouette | `community_profiles` (prénom, nom, slug) |
| 🚶 Marche / événement | pin émeraude | `marche_events` + `explorations` (titre, lieu, description) |

Chaque résultat → clic = navigation directe vers la fiche/drawer correspondant.

---

## 3. UX & Design — Forêt Émeraude immersive

**Déclencheur** : FAB rond `bottom-20 right-4` (mobile-first), au-dessus de la TabBar, halo pulsé vert `#2dd4a8`, ic. Lucide `Search`. Raccourci ⌘K en bonus desktop.

**Overlay** :
- Plein écran, fond `bg-[#0a1f1a]/95 backdrop-blur-2xl`
- Particules vertes flottantes (MagicUI `Particles`)
- Input géant centré, typo serif élégante, curseur lumineux, ring émeraude
- Sous l'input : **chips de filtres rapides** (Tous · 🌿 · ✨ · 📖 · 👤 · 🚶) avec compteurs
- Résultats en **AnimatedList** (MagicUI), cards glassmorphism, halo vert au hover, picto coloré à gauche, titre + snippet + contexte (« dans Marche X · 12 mai »)
- État vide : suggestions populaires (top 5 termes BDD) + 3 derniers termes du marcheur (`localStorage` + table `search_logs`)
- Loader : barre de lumière qui traverse (BorderBeam)
- Fermeture : Escape, swipe down mobile, clic backdrop

**Animations** : `fade-in` overlay, `scale-in` cards en cascade, `BlurFade` sur transitions de filtre.

---

## 4. Logique de recherche

- **Live debounced 250 ms** (`useDebounce`)
- **Fuzzy** : normalisation NFD côté JS + extension Postgres `unaccent` + `pg_trgm` (`similarity()`) côté DB → tolère « ortié » = « Ortie », « victorb » = « Victor Boixeda »
- **Mot ou groupe de mots** : tokenisation, chaque token doit matcher (AND), OR sur les colonnes
- **RPC unique** `search_global(p_query text, p_user_id uuid, p_event_id uuid default null, p_limit int default 8)` SECURITY DEFINER qui retourne une union typée `{kind, id, title, subtitle, context, score, route}` triée par score
- **RLS-aware** : la RPC respecte les permissions (un marcheur ne voit que ses marches et co-participants, l'admin tout)

---

## 5. Table de logs `search_logs`

```text
search_logs
├─ id uuid pk
├─ user_id uuid (nullable pour admin anon)
├─ prenom text, nom text          -- snapshot dénormalisé
├─ query text                      -- mot(s) recherché(s)
├─ event_id uuid nullable          -- événement courant
├─ marche_id uuid nullable         -- marche courante
├─ scope text                      -- 'global' | 'event' | 'admin'
├─ results_count int               -- nb total résultats
├─ clicked_kind text nullable      -- type sur lequel on a cliqué
├─ clicked_id text nullable
├─ created_at timestamptz          -- date+heure (Paris)
└─ user_agent text, route text     -- contexte
```

- Insert silencieux après chaque recherche **validée** (debounce 800 ms ou submit explicite) — pas chaque frappe
- Onglet admin `/admin/community → Recherches` pour visualiser les requêtes (cloud de mots, top termes, requêtes sans résultats)

---

## 6. Détails techniques

- Nouveau composant `<GlobalSearchFab />` monté dans `MarchesDuVivantMonEspace.tsx` + `ExplorationLayout.tsx` + layouts admin
- Overlay : `<GlobalSearchOverlay />` (Dialog Radix fullscreen)
- Hook `useGlobalSearch(query, scope)` → React Query, `staleTime: 30s`
- Migration : extension `pg_trgm` + `unaccent`, table `search_logs` avec GRANTs + RLS (insert authenticated own, select admin only), RPC `search_global`, RPC `log_search`
- Index trigram sur les colonnes texte fréquemment cherchées (species names, profile names, curation titles)
- Pictos via Lucide : `Leaf`, `Sparkles`, `BookOpen`, `User`, `MapPin`

---

## 7. Hors scope v1 (pour itérations futures)

- Recherche sémantique vectorielle (embeddings)
- Recherche dans les médias (OCR photos, transcripts audio)
- Auto-complete suggestions IA
- Synchronisation Algolia

---

**Livrables** : 1 migration SQL, 1 RPC, 4 composants React, 1 hook, intégration dans 3 layouts, 1 onglet admin de visualisation.
