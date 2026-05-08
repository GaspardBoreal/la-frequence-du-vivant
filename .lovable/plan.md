# Témoignages des marcheurs — révision

**Changement clé** : les témoignages sont rattachés à l'**événement** (`marche_events`), pas à l'exploration. Une exploration agrège tous les témoignages des marches qui la composent.

## 1. Base de données

### Table `event_testimonies`
- `event_id` (uuid NOT NULL, FK marche_events ON DELETE CASCADE) — **rattachement principal**
- `user_id` (uuid NOT NULL) — marcheur lié (matching strict, NULL refusé)
- `author_name` (text NOT NULL) — nom affiché tel qu'importé
- `quote` (text NOT NULL)
- `display_order` (int, défaut 0)
- `is_published` (bool, défaut true)
- timestamps standard
- Contrainte unique `(event_id, user_id)` — un témoignage par marcheur par événement
- Index sur `event_id`, `user_id`

### RLS
- **SELECT** public si `is_published = true`
- **ALL** réservé au propriétaire (`user_id = auth.uid()`) ou aux admins (via `is_admin_user()` existant)

### RPC matching
`match_marcheur_by_name(_name text, _event_id uuid)` :
- Recherche dans `exploration_marcheurs` lié à l'exploration de l'événement (via `marche_events.exploration_id`)
- Normalisation `lower(unaccent(prenom || ' ' || nom))`
- Retourne `user_id` ou NULL

## 2. Import du fichier `Témoignage_DEVIAT.xlsx`

L'exploration courante `70fcd8d1...` ("DEVIAT Marcher sur un sol qui respire") contient une marche `df85910e-82da-4ef7-98d2-d4c827d1d0ec` ("DEVIAT Le Réveil de la Terre…"). Cette marche sera la cible.

Mais : sur les 8 marcheurs du fichier, seuls 4 sont déjà inscrits dans `exploration_marcheurs` de cette exploration (Marie-Josee Daubigeon, Nathan Chaur, Sophie D, Karine Log) — Gaspard Boréal aussi mais absent du fichier. Les 4 autres (Jean-Paul Chiron, Laurence Karki, Victor Boixeda, Jean-François Servant) ne sont pas trouvés dans cette exploration.

→ Question résiduelle posée à l'implémentation : **veux-tu que je tente aussi de matcher dans les autres explorations DEVIAT** (607a0ae3 "première découverte" et 20dd3be8 "du 11.03.26 à aujourd'hui") avant import ? En mode strict, les non-matchés seront simplement listés dans le rapport.

Script one-shot via `code--exec` :
1. Parse XLSX
2. Pour chaque ligne → RPC matching sur `event_id = df85910e...`
3. INSERT si match
4. Rapport : importés vs non matchés

## 3. Onglet "Témoignages" dans la Synthèse

Dans `EventBiodiversityTab.tsx`, ajout entre `taxons` et `analyse` :
```ts
{ key: 'temoignages', label: 'Témoignages' }
```

Ce composant agrège les témoignages de **toutes les marches de l'exploration** affichée (puisque la Synthèse est au niveau exploration). Hook `useExplorationTestimonies(explorationId)` qui fait `select * from event_testimonies where event_id in (select id from marche_events where exploration_id = ?)`.

### 4 modes d'affichage (sélecteur animé)
1. **Mur de cartes citation** (défaut) — masonry, guillemet géant en watermark, citation en serif, avatar+nom en pied
2. **Carrousel immersif** — plein largeur, fade+slide, autoplay 8s, swipe mobile
3. **Nuage de mots interactif** ⭐ — tokenisation FR (stop-words), taille = √fréquence, palette dégradée, **clic mot → drawer avec marcheurs ayant utilisé le mot, surligné dans le témoignage**
4. **Constellation sensible** — SVG, témoignages en spirale autour d'un mot-thème, hover focus

### Curation
Owner ou admin : éditer (RichTextEditor) / masquer (toggle `is_published`).

## 4. ChatBot
`data-chat-section="temoignages"` + publish au `chatPageContext` (mode actif, nb témoignages).

## Fichiers
**Créés**
- migration SQL (table + RLS + RPC)
- `src/hooks/useExplorationTestimonies.ts`
- `src/components/community/insights/testimonies/TestimoniesTab.tsx`
- `src/components/community/insights/testimonies/modes/{QuoteWall,ImmersiveCarousel,WordCloud,Constellation}.tsx`
- `src/components/community/insights/testimonies/utils/tokenize.ts`

**Modifié**
- `src/components/community/EventBiodiversityTab.tsx`

**Mémoire** : nouvelle entrée `mem://features/community/event-testimonies-logic`.

Aucune dépendance npm ajoutée (Framer Motion + Tailwind).
