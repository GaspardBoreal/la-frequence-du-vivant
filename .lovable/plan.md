# Tags-Marcheurs sur Espèces — Plan d'implémentation

## Vision UX (wahouhh & sobre)

Chaque marcheur dispose de son **carnet de tags privé** — petits mots-clés libres qu'il colle sur les espèces qu'il rencontre. Invisibles aux autres marcheurs, consultables uniquement par lui (et l'admin via back-office).

**Métaphore visuelle** : Pastilles colorées discrètes en coin de vignette espèce. Au repos : 1 à 3 dots colorés (12px). Au survol/tap : déploiement en chips lisibles avec animation `motion` douce (spring, scale 0→1, stagger 40ms). Couleurs auto-assignées par hash du label (palette Forêt/Papier cohérente : `#0D6B58`, `#C9A84C`, `#E85D3A`, `#5A8A5C`, `#A78BFA`, `#67E8F9`) — zéro friction de création.

**Signature poétique** : la création d'un tag déclenche un micro-rituel (fade + glow vert 600ms) — cohérent avec le Ritual Reveal existant.

## Modèle de données

Deux niveaux comme demandé : **tag global espèce** (suit l'espèce partout dans mon espace) ET **tag observation-spécifique** (esp×marche).

```text
marcheur_species_tags
├─ id (uuid)
├─ user_id (uuid, FK auth.users)         ← propriétaire, RLS strict
├─ scientific_name (text, normalisé NFD) ← clé esp. (cohérent avec Identity matching)
├─ marche_id (uuid, nullable)            ← NULL = tag global ; rempli = tag observation
├─ label (text, max 40 char, trim)
├─ label_normalized (text, généré)       ← pour dédup et suggestions
├─ color_hash (smallint)                 ← index palette 0-5, dérivé du label
├─ created_at, updated_at
└─ UNIQUE (user_id, scientific_name, COALESCE(marche_id,'00000000…'), label_normalized)
```

**RLS** :
- SELECT/INSERT/UPDATE/DELETE : `auth.uid() = user_id`
- Admins : via `has_role(auth.uid(),'admin')` SELECT only
- Aucune policy publique.

**RPC `SECURITY DEFINER`** :
- `get_my_tags_for_species(scientific_names text[], marche_ids uuid[])` → renvoie map indexée pour chargement batch écran.
- `upsert_marcheur_tag(...)` / `delete_marcheur_tag(id)` — validation longueur, normalisation NFD, dédup.
- `admin_list_marcheur_tags(user_id, filters)` — admin only.

## Écrans concernés & intégration

| Écran | Fichier | Intégration |
|---|---|---|
| Marches → Voir | `MarcheDetail*` (espèces vues) | Pastilles sur cards espèce + filtre |
| Marches → Vivant | `EventBiodiversityTab` | Pastilles + barre filtres en haut |
| Apprendre L'œil/Main/Oreille | `insights/curation/CeQueNousAvonsVu` & co | Pastilles sur grille |
| Synthèse → Taxons observés | `MarcheursTab` zone taxons | Pastilles + filtre intégré |

## Composants partagés à créer

```text
src/components/community/tags/
├─ MarcheurTagDots.tsx         ← 1-3 pastilles + "+N", clic ouvre popover
├─ MarcheurTagPopover.tsx      ← Liste tags, input ajout (Enter), suppr (×), suggestions
├─ MarcheurTagsFilterBar.tsx   ← Multi-select avec modes ET/OU/SAUF (Toggle group)
├─ MarcheurTagChip.tsx         ← Chip atomique réutilisable
└─ AdminMarcheurTagsTable.tsx  ← Back-office (DataTable)

src/hooks/
├─ useMarcheurTags.ts          ← Query batch par scope (espèces visibles)
├─ useMarcheurTagsMutations.ts ← upsert/delete avec optimistic update
├─ useMarcheurTagsFilter.ts    ← État filtre + logique AND/OR/NOT
└─ useMarcheurTagSuggestions.ts ← Top tags récurrents du marcheur
```

## UX détaillée par interaction

**Création** : sur n'importe quelle vignette espèce, icône `+` discrète apparaît au hover. Clic → input inline avec autocomplete depuis ses propres tags récents (suggestions intelligentes). Enter valide, Esc annule. Création optimistic, rollback toast en cas d'erreur.

**Choix portée** : dans le popover, toggle "Cette observation" / "Toujours pour cette espèce" (défaut = global, plus utile au quotidien).

**Filtre** : barre persistante en haut de chaque écran espèces, format chips actives + bouton "+". Modes : `ET` (toutes), `OU` (au moins une), `SAUF` (exclusion). État conservé via URL (`?tags=oiseau-rare,jardin&mode=or`).

**Suggestions intelligentes** :
- Top 5 tags récurrents du marcheur, affichés au focus de l'input
- "Tags similaires" : si tagué "à revoir" sur 3 oiseaux, suggérer le même sur les autres oiseaux non tagués (signal léger, dot pulsant)

**Carnet & Stories** : nouvelle section "Mes tags" dans Carnet vivant (timeline) — nuage cliquable + compteurs. Une story Impact dédiée "Mon vocabulaire du vivant" (les 5 tags les + utilisés + espèces associées).

## Back-office Admin

Nouvelle entrée dans `AdminOutilsHub` → "Tags marcheurs" :
- Table : marcheur · espèce · tag · marche (si scoped) · date
- Filtres : par marcheur, par tag, par exploration
- Lecture seule (modération via suppression seulement si abus signalé)
- Export CSV

## Sécurité & confidentialité

- Tags **jamais** retournés dans aucun endpoint public ou autre marcheur (RLS strict + RPC dédiées)
- Validation Zod côté client + contraintes SQL (longueur 40, label trim non vide)
- Mention claire dans le popover : "🔒 Visible uniquement par toi"

## Performance

- Préchargement batch : un seul query `get_my_tags_for_species(scientific_names[])` par écran, mappé dans React Query (cache 60s, invalidation à la mutation)
- Optimistic updates pour zéro latence perçue
- Index SQL : `(user_id, scientific_name)`, `(user_id, marche_id)`, GIN sur `label_normalized` pour suggestions

## Plan de livraison (séquentiel)

1. **Migration SQL** : table + RLS + 3 RPC + indexes
2. **Hooks** : `useMarcheurTags`, mutations, filter, suggestions
3. **Composants partagés** : Dots, Popover, FilterBar, Chip
4. **Intégration écran 1** : Synthèse → Taxons observés (référence)
5. **Intégration écrans 2-5** : Marches→Voir, Marches→Vivant, Apprendre×3 (réutilisation)
6. **Back-office admin** : table + export
7. **Bonus Carnet & Stories** : nuage de tags + story dédiée

## Hors scope

- Partage social des tags (100% privés)
- Tags structurés en catégories
- Couleurs choisies manuellement (auto via hash)
- Emoji/icônes (texte libre uniquement)
