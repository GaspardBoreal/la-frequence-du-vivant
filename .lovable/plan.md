# Pratiques emblématiques × Marcheurs — intégration dans la Fréquence

Faire de la mémoire d'un geste agroécologique (Jean-François Servant et ses pairs) un signal pleinement valorisé dans la Fréquence du marcheur, sans casser l'équilibre actuel du score.

## 1. Modèle de données

Les pratiques sont déjà stockées dans `exploration_curations` (sense = `'main'`). On ajoute simplement une **table de liaison** `curation_marcheurs` :

```text
curation_marcheurs
  id UUID PK
  curation_id UUID  → exploration_curations(id) ON DELETE CASCADE
  marcheur_name TEXT NOT NULL    (forme normalisée NFD, pour matcher les obs)
  marcheur_profile_id UUID NULL  → community_profiles(id) si résolu
  role_label TEXT NULL           ("Praticien", "Témoin", "Apprenti"…)
  display_order INT
  created_by UUID
  created_at TIMESTAMPTZ
  UNIQUE (curation_id, marcheur_name)
```

- Index sur `marcheur_name` et `marcheur_profile_id`.
- RLS : lecture publique (cohérent avec curations existantes), écriture réservée à `admin` + curateurs (`ambassadeur`, `sentinelle`) via `has_role` / RPC `SECURITY DEFINER` pour insert/delete (mêmes garde-fous que le réordonnancement des curations).

## 2. Édition (qui associe, où)

Dans `MainCuration.tsx` (vue admin/curateur déjà existante de l'onglet **Apprendre → La main**) : sur chaque carte de pratique éditoriale, ajouter un bloc "Marcheurs associés" :

- Combobox de recherche (alimenté par `useExplorationMarcheurs`) → multi-sélection.
- Chips supprimables.
- Champ optionnel `role_label` par marcheur.

Visible et modifiable par : admin, ambassadeur, sentinelle (réutilise `useCanCurateAudio`/équivalent).

## 3. Nouveau calcul de Fréquence (toujours sur 100)

Modification dans `src/lib/sentinelleIndex.ts` :

| Critère | Avant | Après |
|---|---|---|
| Détections précieuses | 35 | 35 |
| Voix singulière | 20 | 20 |
| Variété des gestes | 15 | 15 |
| **Volume** | **15** | **10** |
| **Diversité d'espèces** | **15** | **10** |
| **Pratiques emblématiques** (nouveau) | — | **10** |
| Total | 100 | 100 |

- Formule pratiques : `min(nbPratiques * 2 / 10, 1) * 10` → 5 pratiques saturent.
- Plafonds ajustés : `VOLUME_MAX=10`, `SPECIES_MAX=10`, `PRATIQUES_MAX=10`, `PRATIQUES_CAP=5`.
- `SentinelleInputs` reçoit un nouveau champ `pratiquesCount: number`.
- `SentinelleBreakdown` reçoit `pratiques: { value, max:10, count, cap:5, titles: string[] }`.
- `computeNextTip` : nouvelle branche prioritaire si `pratiquesCount === 0` → "Documentez une pratique avec un agriculteur : +2 pts".
- Paliers (`eveil` / `curieux` / `ecoute` / `eclaireur` / `engage`) inchangés : seuils déjà calibrés sur 100.

## 4. Affichage UI

**4a. Ligne dans `ScoreBreakdown.tsx`** — sous "Diversité d'espèces" :
- Icône 🌾, libellé "Pratiques emblématiques", couleur `hsl(40 70% 60%)` (paille / soleil).
- Détail : "N pratique(s) documentée(s)".
- Chips cliquables sous la barre (max 3 visibles + "…+N") → ouvrent la fiche pratique correspondante dans **Apprendre → La main**.

**4b. Section dédiée dans le portfolio du marcheur** (`MarcheursTab.tsx`, juste sous `CitizenPlatformsCard`) :
- Bloc "Pratiques portées par {prénom}", ton ambré chaleureux.
- Pour chaque pratique : vignette (premier média), titre, role_label, courte description, lien vers la fiche complète.
- Empty state inspirant : "Une pratique observée, c'est un savoir vivant transmis. Demandez à un curateur de relier {prénom} à un geste de terrain."

## 5. Hooks & agrégation

- Nouveau hook `useMarcheurPratiques(marcheurName, explorationIds)` → join `curation_marcheurs` × `exploration_curations` filtré par `sense='main'` et exploration en cours.
- Brancher le résultat dans le calcul du portfolio (déjà alimenté par les inputs Sentinelle) en passant `pratiquesCount` à `computeSentinelleIndex`.

## 6. Hors périmètre

- Pas de changement sur Voix singulière / Détections précieuses / Variété.
- Pas de migration des badges existants (12 badges) — sera traité ensuite si besoin.
- Pas de modification du quiz, du CRM ou des publications publiques.

## Détails techniques

- Migration SQL : table `curation_marcheurs` + index + RLS + RPC `attach_pratique_to_marcheur(curation_id, marcheur_name, role_label)` et `detach_pratique_from_marcheur(...)` en `SECURITY DEFINER` validant `has_role` admin/ambassadeur/sentinelle.
- Normalisation `marcheur_name` côté RPC via `unaccent(lower(trim(...)))` (cohérent avec [Identity matching](mem://technical/community/identity-matching-logic)).
- Invalidation React Query : clés `['marcheur-pratiques', marcheurName]` + `['exploration-curations', explorationId, 'main']`.
- Mémoires à mettre à jour après implémentation : `mem://features/community/marcheur-impact-stories-logic` (nouveau critère) et création d'une mémoire `mem://features/community/pratiques-emblematiques-marcheurs-logic`.
