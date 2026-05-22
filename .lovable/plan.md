# Page publique d'événement — compteurs robustes + indicateurs narratifs + redesign Wahouhhh

## 1. Diagnostic chiffré (cas DEVIAT 10 km — `df85910e…`)

| Métrique | Affiché | Attendu | Cause racine |
|---|---|---|---|
| **Marcheurs** | 8 | **10** | RPC compte `marche_participations.validated_at IS NOT NULL` (=8). Or la vérité narrative est `exploration_marcheurs` (8 + 1 invité) **+** participations (11). Pas de notion d'« invité » exclus. |
| **Espèces** | 0 | **116** | RPC interroge `biodiversity_snapshots WHERE marche_id = event_id`. Mais `marche_events.id` **n'est pas** un `marche_id`. Il faut résoudre via `exploration_marches` (15 marches → ~116 espèces dédupliquées). |
| **Observations** | 0 | **~346** | Même bug. Calcul correct = Σ `observations_count` des `species_data` des derniers snapshots par marche, + `marcheur_observations` propres. |
| **Découvreurs** | 1 | 1 ✓ | OK. `count(DISTINCT session_id)` sur `event_public_views`. Anonyme, dédupliqué par session navigateur. À conserver. |
| **Pratiques emblématiques** | — | **5** | Indicateur manquant. Source : `curation_marcheurs` (curation `'main'` liée à l'exploration). |
| **Paysages sonores** | — | **2** | Indicateur manquant. Source : `marcheur_medias` (ou table audio dédiée) filtrés `type_media IN ('audio','paysage_sonore')` et liés à l'exploration. |

## 2. Principe directeur : une seule source de vérité

Une fonction SQL unique `get_public_event_stats(_slug)` qui :
1. Résout l'événement → `exploration_id`.
2. Charge la liste **canonique** des marches via `exploration_marches`.
3. Pour chaque marche, retient **le dernier `biodiversity_snapshot`** (DISTINCT ON marche_id ORDER BY snapshot_date DESC).
4. Applique des règles **documentées et identiques** côté admin et public.
5. Renvoie `{ counters, methodology }` — le `methodology` expose les règles, pour transparence éditoriale.

## 3. Règles métier

### Marcheurs (10)
```
( exploration_marcheurs où is_guest = false )
∪ ( marche_participations.user_id du même event )
dedup : user_id puis lower(unaccent(prenom||nom))
```
- Ajout d'un flag `is_guest BOOLEAN DEFAULT false` sur `exploration_marcheurs`.
- Backfill : `role = 'invité'` → `is_guest = true, role = 'marcheur'`.

### Espèces (116)
```
species = UNION des species_data (dernier snapshot par marche de l'exploration)
        ∪ marcheur_observations.species_scientific_name des mêmes marches
species_count = count(DISTINCT lower(scientific_name))
```

### Observations (~346)
```
Σ observations_count des species_data (par marche, dernier snapshot)
+ count(marcheur_observations) non liées à un inaturalist_observation_id
```

### Découvreurs (1)
Inchangé : `count(DISTINCT session_id)` sur `event_public_views`.

### Pratiques emblématiques (5) — **nouveau**
```
count(*) FROM curation_marcheurs cm
JOIN exploration_marcheurs em ON em.id = cm.marcheur_id
WHERE em.exploration_id = _exploration_id AND cm.is_main = true
```
Renvoie aussi un échantillon `{ id, titre, prenom, photo_url }[3..5]` pour alimenter la popup.

### Paysages sonores (2) — **nouveau**
```
count(*) FROM marcheur_medias mm
JOIN exploration_marcheurs em ON em.id = mm.marcheur_id
WHERE em.exploration_id = _exploration_id
  AND (mm.type_media = 'audio' OR mm.categorie = 'paysage_sonore')
```
Renvoie aussi `{ id, titre, duree_secondes, url, marcheur_prenom }[]` pour la popup audio.

## 4. Photos dans l'ordre des marches

La galerie de l'aperçu (cover + species grid) doit respecter l'ordre **narratif** de l'exploration :
```
ORDER BY exploration_marches.ordre ASC, marche.date_marche ASC
```
- `get_public_event_biodiversity` : ajouter un champ `marche_ordre` à chaque photo (`species_data`/`observations_geo`).
- `PublicEventPage` : tri des `biodiversity.species` selon (a) `marche_ordre` minimal, puis (b) `observations_count` desc.
- Cover image : si non définie, prendre la **première photo de la première marche** (ordre 1) au lieu d'un fallback aléatoire.

## 5. Redesign Wahouhhh mobile-first

Brief design (palette Forêt Émeraude + Papier Crème, glassmorphism — Core memory) :

### Hero immersif
- Cover plein écran 100vh sur mobile avec overlay gradient bas → haut (background → transparent).
- Titre en `display-serif` grande échelle, échelonné via `clamp(2rem, 8vw, 4rem)`.
- Sous-ligne « 11 avril 2026 · DEVIAT — Charente » en lettres espacées (tracking).
- Pill « Lecture publique » + type d'événement en haut, en glass `backdrop-blur-xl bg-card/40 border border-primary/20`.
- Scroll cue animé (chevron descendant Motion).

### Strip d'indicateurs « Pulsations du vivant » (6 cartes)
Sur mobile : carrousel horizontal snap-x (`overflow-x-auto snap-x snap-mandatory`).
Sur ≥ md : grid 3×2 puis 6×1 en lg.

| Carte | Icône | Valeur | Popup |
|---|---|---|---|
| Marcheurs | Users | 10 | Avatars cliquables (déjà existant, recentré) |
| Espèces | Leaf | 116 | Drawer biodiversité (existant) |
| Observations | Camera | 346 | Carte des observations |
| Découvreurs | Eye | 1 | — (tooltip méthodologie) |
| **Pratiques emblématiques** | Sparkles | 5 | **Popup élégante** (cf. §5.1) |
| **Paysages sonores** | Waveform | 2 | **Popup audio élégante** (cf. §5.2) |

Chaque carte :
- `rounded-2xl` glass `bg-card/60 backdrop-blur-xl border border-primary/10`
- micro-animation Motion : nombre qui s'incrémente au scroll (`useInView` + spring)
- icône qui pulse en boucle douce (`animate-pulse-slow` custom)
- ombre intérieure verte ténue sur hover

### 5.1 Popup Pratiques emblématiques
- Drawer mobile (full-height bottom sheet) / Dialog desktop centré.
- Header : « 5 pratiques emblématiques de cette exploration » + ligne fine dorée.
- Carrousel vertical de cartes pratique : photo plein cadre 4:5, titre serif, prénom marcheur, citation tronquée. Tap → /pratiques/:id (lien existant).
- Background du modal : gradient émeraude profond + grain SVG.
- Bouton « Découvrir toutes les pratiques » → /pratiques?exploration=...

### 5.2 Popup Paysages sonores
- Même squelette de drawer.
- Liste de **lecteurs audio inline** (réutilise `AudioPlayer` existant) avec waveform animée pendant lecture.
- Vignette ronde du marcheur, titre, durée, mini-carte de localisation.
- Lecture automatique du premier au ouvrir (pause les autres). Respecte `useAudioPlayer` global (ne pas casser le player de fond).

### Bandes narratives suivantes
- Section « Le vivant observé » : photo grid masonry avec ratios variables (3-4-3 mobile), **dans l'ordre des marches** (§4).
- Section « Paroles de marcheurs » (déjà présent) : passer en `embla-carousel` plein-bleed sur mobile, cartes plein écran avec fond image floutée du marcheur.
- Section « Marcheurs » : avatars en mosaïque hexagonale serrée, halo doré sur les ambassadeurs.
- CTA final : « Rejoindre une marche près de chez vous » en bouton émeraude pleine largeur, micro‑animation feuille qui tombe.

### Détails Wahouhhh transversaux
- Curseur custom desktop (point + halo).
- Parallaxe douce sur la cover (Motion `useScroll` + `useTransform`).
- Apparition staggered de toutes les sections (`whileInView`, 80ms stagger).
- Police titre : Cormorant Garamond ou Instrument Serif (déjà disponible) — passage à `font-display` sur les H1/H2.
- Respect strict des tokens HSL existants (jamais de `text-white`).

## 6. Implémentation

### 6.1 Migration SQL (une seule)
- `ALTER TABLE exploration_marcheurs ADD COLUMN is_guest boolean NOT NULL DEFAULT false;`
- Backfill `role='invité'`.
- `CREATE OR REPLACE FUNCTION get_public_event_stats(_slug text) RETURNS jsonb SECURITY DEFINER` qui renvoie :
```json
{
  "marcheurs_count": 10,
  "species_count": 116,
  "observations_count": 346,
  "unique_visitors": 1,
  "pratiques_count": 5,
  "paysages_sonores_count": 2,
  "pratiques_sample": [ { "id": "...", "titre": "...", "prenom": "...", "photo_url": "..." } ],
  "paysages_sample": [ { "id": "...", "titre": "...", "duree_secondes": 120, "url": "...", "prenom": "..." } ],
  "methodology": { ... }
}
```
- Évolution de `get_public_event_biodiversity` : ajout du champ `marche_ordre` par espèce/observation.
- `get_public_event_counters` devient un alias de compat.

### 6.2 Frontend
- `usePublicEvent.ts` : nouveau hook `usePublicEventStats(slug)` typé sur le payload enrichi.
- `PublicEventPage.tsx` : refonte Hero + strip 6 indicateurs + popups Pratiques/Paysages + tri photos par `marche_ordre`.
- 2 nouveaux composants :
  - `<PratiquesEmblematiquesDialog />` (Dialog shadcn + drawer mobile via `vaul`)
  - `<PaysagesSonoresDialog />` (réutilise `AudioPlayer`)
- `PublicEventMetricsPanel.tsx` (admin) : ajout d'une ligne « **Aperçu public** » montrant les 6 chiffres calculés en direct, **même avant** `is_public = true` → valide la cohérence avant publication.
- Toggle « 👥 Inclure les invités » sur la fiche `exploration_marcheurs` (admin) → écrit `is_guest`.

### 6.3 Cache & fraîcheur
- React Query `staleTime: 60s` (en place).
- SQL `STABLE` ; jointures couvertes par l'index existant `(marche_id, snapshot_date DESC)`.

## 7. QA / validation

```sql
select public.get_public_event_stats('deviat-marcher-sur-un-sol-qui-respire-10-km-2026-04-11');
-- attendu : marcheurs=10, species≈116, observations≈346, unique_visitors=1, pratiques=5, paysages=2
```
- Événement sans `exploration_id` → fallback gracieux : marcheurs depuis participations, autres = 0, sans crash.
- Tests visuels : capture mobile 390×844 + desktop 1440 → comparer Hero, strip carrousel, popups Pratiques et Paysages, ordre des photos.

## 8. Hors scope
- Page « méthodologie » publique reprenant le JSON `methodology`.
- Refonte de `/pratiques/:id` et `/paysages-sonores/:id` (les popups linkent vers ces routes existantes).
