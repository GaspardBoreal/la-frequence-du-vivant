# Réattribution unifiée Photo · Audio · Texte

## Constat

- **Photo (Voir)** et **Audio (Écouter)** utilisent déjà :
  - RPC `public.reattribute_media(_source, _media_id, _marcheur_id, _user_id)`
  - Hook `useReattributeMedia` (sources : `'media' | 'audio' | 'conv'`)
  - Picker unifié `useReattributionPicker` (marcheurs éditoriaux ∪ participants validés)
  - Composant `MediaAttributionSheet` (recherche + sélection + retrait)
  - Garde curatoriale `useIsCurator` (admin / ambassadeur / sentinelle)

- **Texte (Écrire)** stocke l'auteur sur `marcheur_textes.user_id` uniquement, sans champ d'attribution distinct. Aucune UI ne permet à un curateur de re-créditer un texte écrit par un marcheur "à la place" d'un autre marcheur (cas Victor → coccinelle, Pissenlit, etc.).

## Objectif

Un curateur (admin / ambassadeur / sentinelle) peut **re-créditer un texte** vers n'importe quel marcheur éditorial *ou* participant validé de l'exploration, exactement comme pour une photo, **sans dupliquer la logique** : même RPC, même hook, même Sheet, même picker.

## Modèle de données

Aligner `marcheur_textes` sur le pattern photo : conserver l'uploader/typeur (`user_id`) et ajouter une attribution séparée. Cela préserve les droits d'édition du rédacteur original et la traçabilité.

```text
marcheur_textes
├─ user_id              (typeur — inchangé, conserve les droits RLS d'édition)
└─ attributed_user_id   (NEW, nullable — auteur affiché si non NULL)
```

Auteur effectif affiché partout = `attributed_user_id ?? user_id`.

## Plan technique

### 1. Migration SQL

- `ALTER TABLE marcheur_textes ADD COLUMN attributed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;`
- Index : `CREATE INDEX idx_marcheur_textes_attributed_user ON marcheur_textes(attributed_user_id) WHERE attributed_user_id IS NOT NULL;`
- RLS lecture publique : pas de changement (la policy `is_public OR user_id = auth.uid()` reste correcte ; le typeur conserve l'édition).
- Étendre `media_attribution_log.source` pour accepter `'texte'`.
- Réécrire `public.reattribute_media` :
  - Accepter `_source = 'texte'`.
  - Résoudre `exploration_id` via `marcheur_textes → marche_events → exploration_id`.
  - Mode b (`_marcheur_id` fourni) : récupérer `user_id` de la ligne `exploration_marcheurs` → écrire `attributed_user_id = em.user_id` (rejet si `user_id` éditorial NULL → fallback : créer/réutiliser une row éditoriale shadow comme pour photos via mode c en interne).
  - Mode c (`_user_id` fourni) : vérifier participation validée, écrire `attributed_user_id = _user_id`.
  - Mode a (les deux NULL) : `attributed_user_id = NULL` (revient au typeur).
  - Logger dans `media_attribution_log` avec `source='texte'`.
- Garde existante `is_exploration_curator(_uid)` réutilisée à l'identique.

### 2. Frontend — réutilisation pure

- `useReattributeMedia` : étendre le type `ReattributeSource` à `'media' | 'audio' | 'conv' | 'texte'`. Ajouter invalidation des queries textes :
  - `['marcheur-textes', ...]`, `['marcheur-textes-exploration', ...]`, `['exploration-text-stats', ...]`, `['exploration-texts', ...]`.
- `MediaAttributionSheet` : aucun changement, c'est déjà générique sur `source: ReattributeSource`.
- `useReattributionPicker` : aucun changement.

### 3. UI — onglet Écrire (LireTab dans MarcheDetailModal)

Dans les blocs *Mes textes* et *Des marcheurs* (lignes ~788–829) :

- Calculer l'auteur affiché à partir de `attributed_user_id ?? user_id` côté hook `useMarcheurTextes` (et regrouper "Des marcheurs" par cet identifiant).
- Sur chaque `ContributionItem` de type `texte`, ajouter — si `isCurator` — une mini-action "Crédit" (icône `Sparkles` ou `Pencil`, même langage visuel que photo) qui ouvre `MediaAttributionSheet` avec :
  - `source="texte"`
  - `mediaId={t.id}`
  - `explorationId`
  - `currentAttributedId={attributedMarcheurId}` (résolu via `useReattributionPicker` à partir de `attributed_user_id ?? user_id`)
  - `uploaderName={typeur.fullName}` pour l'option "Retirer le crédit"
- Réutiliser le même bouton dans `TextesSubTab` de `MarcheursTab.tsx` (vue marcheur agrégée).

### 4. Cohérence des reads

Tous les sélecteurs lisant `marcheur_textes` doivent projeter `attributed_user_id`. Mettre à jour :

- `useMarcheurTextes` (dans `MarcheDetailModal`) — filtrage et regroupement par auteur effectif.
- `TextesSubTab` (`MarcheursTab.tsx`) — la query par `userId` doit filtrer `OR(user_id.eq.userId, attributed_user_id.eq.userId)` puis exclure les textes ré-attribués ailleurs : `attributed_user_id IS NULL OR attributed_user_id = userId`.
- `useExplorationTextsOptimized` / agrégats `stats.textes` : compter par auteur effectif (utiliser `COALESCE(attributed_user_id, user_id)`).

### 5. Régénération `types.ts`

Auto via Supabase après migration approuvée. Aucun edit manuel.

## Sécurité

- Le typeur original garde l'édition/suppression (RLS inchangée sur `user_id = auth.uid()`).
- Seul un curateur peut modifier `attributed_user_id` (toujours via la RPC `SECURITY DEFINER`, jamais en UPDATE direct).
- Toute réattribution est tracée dans `media_attribution_log`.

## Hors scope

- Pas de changement sur les hooks/composants photo/audio existants (zéro régression).
- Pas de changement sur `kigo_entries` (pas demandé).
- Pas de migration de données : `attributed_user_id` reste NULL pour tout l'existant — comportement identique.

## Livrables

1. Migration SQL (1 fichier) — colonne + RPC mise à jour + log accept `'texte'`.
2. `src/hooks/useReattributeMedia.ts` — ajout source `'texte'` + invalidations.
3. `src/components/community/MarcheDetailModal.tsx` (`LireTab`) — bouton crédit + Sheet.
4. `src/components/community/exploration/MarcheursTab.tsx` (`TextesSubTab`) — bouton crédit + Sheet + query par auteur effectif.
5. Hooks textes (`useMarcheTextes`, `useMarcheurTextes`, `useExplorationTextsOptimized`) — résolution auteur effectif.
