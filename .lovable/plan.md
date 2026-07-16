
# Accueil vivant — Carrousel « Nouveautés de la communauté »

Sur `/marches-du-vivant/mon-espace`, l'onglet Accueil affichera au-dessus de `FrequenceWave` un carrousel horizontal (cards style Netflix) présentant les nouvelles observations des autres marcheurs des 30 derniers jours, jamais vues par l'utilisateur connecté. Les observations des marches non inscrites sont regroupées dans une section « Ailleurs dans la communauté » juste après.

## Sources unifiées (5 types)

Une edge function `feed-community-new-items` renvoie un flux mixé, filtré côté serveur :

| Type | Table source | Onglet cible | Preview |
|---|---|---|---|
| `photo` | `marcheur_medias` (kind=photo) | Voir | miniature |
| `son` | `marcheur_audio` | Écouter | waveform + durée |
| `lire` | `marcheur_textes` (type=lire) | Lire | titre + extrait |
| `ecrire` | `marcheur_textes` (type=ecrire) | Écrire | titre + extrait |
| `espece` | `marcheur_observations` (nouvelle espèce dans le pool marche) | Biodiversité → Taxons | thumb SpeciesThumb |

Filtres serveur :
- `created_at >= now() - 30 days`
- `user_id != auth.uid()`
- `marche_event_id IN (marches de l'utilisateur)` → flux principal
- `marche_event_id NOT IN (…)` mais dans une marche publique/visible → flux découverte
- Exclure les items déjà loggés dans `marcheur_activity_logs` avec `event_type = 'feed_seen'` et `event_target = '<type>:<item_id>'`

Limite 20 items principal + 10 découverte. Tri : plus récents d'abord, avec une légère diversification par auteur pour éviter un seul marcheur qui monopolise.

## Composants

- `src/components/community/tabs/AccueilTab.tsx` — ajoute `<CommunityFeedCarousel />` et `<CommunityDiscoveryCarousel />` au-dessus de `FrequenceWave`.
- `src/components/community/feed/CommunityFeedCarousel.tsx` — carrousel horizontal snap-x (scroll natif + boutons ← →), header « Nouveautés depuis votre dernière visite ». Chaque carte : icône type (Camera/Waveform/BookOpen/Feather/Sparkles), preview, nom marcheur + avatar, marche + date relative.
- `src/components/community/feed/CommunityFeedCard.tsx` — carte unique 220×280, animation fadeIn en cascade (framer-motion), hover lift léger. Clic = navigation.
- `src/components/community/feed/CommunityDiscoveryCard.tsx` — variante pour marches non inscrites : bandeau « Marche non rejointe », CTA « Rejoindre cette marche » au lieu d'ouvrir l'item.
- `src/hooks/useCommunityFeed.ts` — React Query : appelle l'edge function, retourne `{ main: Item[], discovery: Item[] }`.
- `src/hooks/useFeedSeenTracker.ts` — extension de `useActivityTracker`, expose `markSeen(item)` et `markClicked(item)` qui insèrent respectivement `feed_seen` et `feed_clicked` dans `marcheur_activity_logs` (debounced, batch).

## Tracking « vu / cliqué »

Utilise la table existante `marcheur_activity_logs` (déjà utilisée par `useActivityTracker`) :
- `event_type = 'feed_seen'`, `event_target = '<type>:<item_id>'`, `metadata = { marche_event_id, kind, author_user_id }`
- `event_type = 'feed_clicked'`, même clé
- IntersectionObserver sur chaque carte : dès qu'elle est ≥50% visible ≥ 800ms, on log `feed_seen` (une seule fois via un `Set` in-memory + debounce 2s).
- Au prochain fetch, l'edge function exclut tout `<type>:<id>` déjà dans `feed_seen` pour cet utilisateur.

Les logs restent visibles dans l'onglet Community → Activités existant (via `event_type` filtrable).

## Navigation au clic

Le carrousel émet un `CustomEvent('mon-espace:navigate', { detail: { tab, subtab?, itemId } })` capté par `MarchesDuVivantMonEspace.tsx`, qui bascule sur le bon onglet (`carnet` puis sous-onglet Voir/Écouter/Lire/Écrire/Biodiversité) et scrolle/ouvre l'item.

- Photo → `carnet` → sous-onglet Voir → ouverture drawer photo `?photo=<id>`
- Son → `carnet` → sous-onglet Écouter → scroll + play `?audio=<id>`
- Texte lire/écrire → `carnet` → sous-onglet correspondant → drawer `?text=<id>`
- Espèce → `carnet` → sous-onglet Biodiversité → Taxons observés, ouvre `SpeciesDrawer` sur cette espèce
- Discovery card → navigate vers `/m/:slug` (page publique marche) pour inscription

## Edge function

`supabase/functions/feed-community-new-items/index.ts` — JWT-validated via `validateAuth`. Requêtes parallèles sur les 5 tables + join avec `community_profiles` (auteur) + `marche_events` (marche/titre/slug). Retourne le tableau trié + fusionné.

## États UX

- Loading : 3 cartes skeleton shimmer.
- Vide (aucune nouveauté) : carte unique poétique « Tout est calme aujourd'hui — vos marcheurs dorment 🌙 » + rappel prochaine marche.
- Erreur : silencieux (le carrousel disparaît, on garde `FrequenceWave`).

## Effet « wahouh »

- Animation d'apparition en cascade (stagger 80ms) via framer-motion.
- Léger glow doré autour de la première carte non vue (« 1 nouveauté »).
- Badge pulsant `n` en haut du carrousel indiquant le nombre de nouveautés.
- Compteur textuel qui décrémente en temps réel quand les cartes sont marquées vues.

## Détails techniques

- Nouveauté espèce : on considère nouvelle si `scientific_name` n'apparaît pas dans les précédentes `marcheur_observations` de la même marche avant `created_at` de la ligne courante.
- Les 30 jours sont calculés en UTC côté serveur.
- Aucun changement de schéma : `marcheur_activity_logs` supporte déjà les nouveaux `event_type`.
- RLS : l'edge function utilise le token utilisateur pour la requête `marcheur_activity_logs` (lecture propre) et service role pour joindre les données des autres marcheurs (nécessaire car photos/audio des autres marcheurs peuvent être privés selon marche — on ne retourne QUE des items déjà publics/visibles dans les onglets Voir/Écouter/Lire/Écrire).

## Fichiers touchés

**Créés**
- `supabase/functions/feed-community-new-items/index.ts`
- `src/hooks/useCommunityFeed.ts`
- `src/hooks/useFeedSeenTracker.ts`
- `src/components/community/feed/CommunityFeedCarousel.tsx`
- `src/components/community/feed/CommunityFeedCard.tsx`
- `src/components/community/feed/CommunityDiscoveryCard.tsx`

**Modifiés**
- `src/components/community/tabs/AccueilTab.tsx` (ajout carrousels au-dessus de FrequenceWave)
- `src/pages/MarchesDuVivantMonEspace.tsx` (listener CustomEvent → navigation onglet+sous-onglet+item)
