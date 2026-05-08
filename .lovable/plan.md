# Témoignages des marcheurs

Module narratif pour faire entendre la voix des marcheurs dans la Synthèse d'une exploration. 4 modes d'affichage immersifs, dont un nuage de mots interactif.

## 1. Base de données

### Nouvelle table `exploration_testimonies`
- `exploration_id` (uuid, FK explorations) — rattachement principal (niveau exploration)
- `user_id` (uuid, FK profiles) — **strict**, NOT NULL
- `author_name` (text) — nom affiché tel qu'importé (cache lisible)
- `quote` (text NOT NULL) — texte du témoignage
- `source_event_id` (uuid nullable) — marche d'origine si connue (DEVIAT)
- `display_order` (int, défaut 0)
- `is_published` (bool, défaut true)
- timestamps standard
- Index unique `(exploration_id, user_id)` — un témoignage par marcheur par exploration
- Index sur `exploration_id`

### RLS
- **SELECT** : public si `is_published = true` (cohérent avec la vue Synthèse partageable)
- **INSERT/UPDATE/DELETE** : owner (`user_id = auth.uid()`) OU curator (ambassadeur/sentinelle/admin sur l'exploration), via la fonction `has_role` existante

### Matching strict des marcheurs
RPC SQL `match_marcheur_by_name(_name text, _exploration_id uuid)` :
- Normalisation NFD + unaccent + lowercase (réutilise le pattern Identity matching existant)
- Recherche dans `profiles` parmi les participants à l'exploration (via `exploration_marcheurs`)
- Retourne `user_id` ou `null`

## 2. Import du fichier DEVIAT

Script one-shot via `code--exec` :
1. Parser l'Excel (8 lignes)
2. Pour chaque ligne, appeler le RPC de matching avec `exploration_id = 70fcd8d1-7f63-43c8-a2bd-2cd436523437`
3. **Mode strict** : insertion uniquement si match trouvé
4. Rapport final : N importés / N non matchés (liste des noms à traiter manuellement)
5. `source_event_id` = ID de la marche DEVIAT si trouvée par recherche `nom ILIKE '%DEVIAT%'` dans cette exploration

Les guillemets typographiques `« »` sont conservés tels quels (style éditorial).

## 3. Nouvel onglet "Témoignages" dans Synthèse

Insertion dans `EventBiodiversityTab.tsx` ligne 351-356 entre `taxons` et `analyse` :
```
{ key: 'temoignages', label: 'Témoignages' }
```

### Composant `TestimoniesTab.tsx`
Sélecteur de mode (4 vues, switch animé) :

#### Mode 1 — Mur de cartes (par défaut)
Grille masonry responsive (CSS columns 1/2/3 selon breakpoint).
Carte = guillemet géant (`«` 80px en watermark), citation en serif élégant, avatar + nom du marcheur en bas.
Hover : légère élévation, halo couleur primaire.

#### Mode 2 — Carrousel immersif
Plein largeur, fond gradient subtil (palette saisonnière de l'exploration).
Une citation à la fois en typographie XL, transitions fade + slide.
Auto-play optionnel (8s), navigation flèches + dots, swipe mobile.

#### Mode 3 — Nuage de mots interactif ⭐
- Tokenisation côté client (filtre stop-words FR : `de, la, le, les, et, à, c'est, qui, que, j'ai, on, en...`)
- Conserve mots ≥ 4 lettres, normalise (lowercase, sans accents pour clé, affichage avec accent original le plus fréquent)
- Taille de police = f(fréquence) entre 14px et 56px
- Couleur = palette dégradée par fréquence
- Layout : `react-d3-cloud` ou implémentation maison spirale (préférence : maison, < 100 lignes, évite dep)
- **Clic sur un mot** → drawer/sheet latéral listant chaque marcheur ayant utilisé ce mot avec son témoignage complet (mot surligné dans le texte)

#### Mode 4 — Constellation sensible
Layout SVG : témoignages disposés en cercle/spirale autour d'un mot-thème central (ex: "Vivant").
Lignes fines reliant chaque carte au centre. Au survol, la carte s'agrandit, les autres s'estompent.
Animation d'entrée séquentielle (Framer Motion stagger).

### Curation
Si l'utilisateur connecté est curator (ou owner d'un témoignage) :
- Bouton "Modifier" sur chaque carte → édition inline du `quote` (RichTextEditor existant — gras/italique/souligné cohérent avec MainCuration)
- Bouton "Masquer" (toggle `is_published`)

### Hook
`useExplorationTestimonies(explorationId)` — React Query, partage la même fraîcheur que les autres hooks de l'exploration.

## 4. Tracking ChatBot
Ajouter `data-chat-section="temoignages"` sur le conteneur + publier dans `chatPageContext` le mode actif et le nombre de témoignages, pour que l'IA puisse référencer les voix des marcheurs.

## Détails techniques

**Fichiers créés**
- `supabase/migrations/...sql` (table + RLS + RPC matching)
- `src/hooks/useExplorationTestimonies.ts`
- `src/components/community/insights/testimonies/TestimoniesTab.tsx`
- `src/components/community/insights/testimonies/modes/QuoteWall.tsx`
- `src/components/community/insights/testimonies/modes/ImmersiveCarousel.tsx`
- `src/components/community/insights/testimonies/modes/WordCloud.tsx`
- `src/components/community/insights/testimonies/modes/Constellation.tsx`
- `src/components/community/insights/testimonies/utils/tokenize.ts` (stop-words FR + tokenizer)

**Fichiers modifiés**
- `src/components/community/EventBiodiversityTab.tsx` (ajout onglet + render)

**Aucune dépendance npm** : tout est fait avec Framer Motion + Tailwind déjà présents.

**Mémoire** : nouveau fichier `mem://features/community/testimonies-logic` ajouté à l'index.

## Question résiduelle (peut être traitée à l'implémentation)
Le fichier ne contient pas l'événement source précis dans la donnée — je recherche par nom `DEVIAT` dans `marche_events` liés à l'exploration `70fcd8d1...`. Si plusieurs ou zéro résultat, je laisse `source_event_id = null` et je te le signale dans le rapport d'import.
