
# Recherche enrichie — « Quand un résultat raconte d'où il vient »

## Le problème
Aujourd'hui, taper « clématite » renvoie 3 lignes « Clematis · Clematis » identiques. Le marcheur ne sait pas **où**, **quand**, ni **par qui** ces observations ont été faites — donc impossible de retrouver le bon contexte. La recherche n'a pas de mémoire géographique ni temporelle.

## La proposition retenue
**Fusion intelligente côté SQL + cartes contextuelles côté UI avec expand inline.**

Chaque résultat raconte trois choses en un coup d'œil :
- **📍 où** (marche + ville)
- **📅 quand** (« il y a 3 jours », « 12 mars »)
- **🌿 combien / par qui** (« Vue 12× sur 3 marches » ou « observée par Marie + 2 »)

Et un tap déplie une mini-galerie + mini-carte + sous-liste des occurrences, avec un bouton explicite « Ouvrir la fiche ».

---

## Mockup conceptuel

```text
ESPÈCES · 3 résultats fusionnés

┌──────────────────────────────────────────────────┐
│ [🖼]  Clématite des haies                    ▾  │
│       Clematis vitalba                           │
│       📍 Dordogne · Beynac  📅 il y a 3 j        │
│       🌿 Vue 12× sur 3 marches · 4 marcheurs    │
└──────────────────────────────────────────────────┘
  └ (déplié)
    • Beynac — 12 mars · Marie L. · 5 obs    [🖼🖼🖼]
    • Sarlat — 8 mars  · Pierre D. · 4 obs   [🖼🖼]
    • Domme  — 1 mars  · Anouk B. · 3 obs    [🖼]
    [mini-carte avec 3 pins]
                              [Ouvrir la fiche →]

TEXTES · 1
┌──────────────────────────────────────────────────┐
│ [📖]  Carnet de Beynac                       ▾  │
│       « …la clématite grimpe le long du… »      │
│       📍 Beynac  📅 12 mars · ✍ Marie L.        │
└──────────────────────────────────────────────────┘
```

Les chips contextuels (📍 📅 🌿) sont des badges glassmorphism émeraude, sobres, scannables au pouce.

---

## Comportement par type

| Type | Titre | Sous-ligne 1 | Sous-ligne 2 | Expand révèle |
|---|---|---|---|---|
| **Espèce** | nom FR (fallback sci.) | 📍 marche principale · ville | 🌿 vue N× sur K marches · M marcheurs | sous-liste marches + mini-carte + 3 vignettes |
| **Pratique** | titre curation | 📍 exploration · ville | ✨ catégorie | extrait description + bouton |
| **Texte** | titre | 📍 marche | 📅 date · ✍ auteur | extrait surligné autour du match |
| **Témoignage** | auteur | 📍 marche · 📅 date | extrait avec match surligné | citation complète |
| **Marcheur** | prénom + nom | 📍 ville · 🎭 rôle | 🚶 N marches · 🌿 N obs | mini-stats + bouton |
| **Event** | titre | 📍 lieu · 📅 date | 🏷️ type | description + bouton |

---

## Changements techniques

### 1. RPC `search_global` — fusion + enrichissement

Refonte du bloc `species` :
- `GROUP BY species_scientific_name` (anti-doublon)
- Agrège : `count(*)`, `count(distinct marche_id)`, `count(distinct user_id)`, `max(observation_date)`, `array_agg` des 3 dernières marches (id, title, ville, date, marcheur prénom)
- Retourne dans `meta` : `{ occurrences, marches_count, marcheurs_count, last_observation_date, recent_contexts: [{marche_id, title, ville, date, marcheur, photo_url}], thumb_url }`

Enrichissement des autres blocs dans `meta` :
- **practice** : `ville`, `exploration_name`, `photo_url`
- **text** : `ville`, `date_marche`, `author_name`, `excerpt_around_match` (snippet ±40 chars)
- **testimony** : `date_marche`, `ville`, `excerpt_around_match`
- **marcheur** : `marches_count`, `observations_count`, `role_label`
- **event** : déjà OK, ajouter `ville`, `participants_count`

`subtitle` reste le nom FR/sci ; `context` devient une chaîne pré-formatée des chips principaux ; le détail riche est dans `meta`.

### 2. Hook `useGlobalSearch` — typage du `meta`

Ajout d'un type discriminé `SearchResultMeta` par `kind` pour exposer les champs typés au composant.

### 3. UI `GlobalSearchOverlay`

Extraction de `<SearchResultCard />` (nouveau composant) :
- Layout : vignette 48×48 (cascade `SpeciesThumb` pour espèces, avatar pour marcheurs, gradient + picto pour autres) + bloc texte 2 lignes + chevron expand
- Chips contextuels : composant `<ContextChip icon label />` réutilisable (📍 📅 🌿 ✍ 🏷️)
- Helper `formatRelativeDate(date)` → « il y a 3 j », « hier », « 12 mars »
- Helper `highlightMatch(text, query)` pour les snippets textes/témoignages (span émeraude)
- État `expanded` local par carte ; animation Framer Motion `AnimatePresence` height auto
- Zone dépliée : sous-liste des `recent_contexts` (espèces) ou extrait long (textes), + mini-carte Leaflet `<RichMap>` compact 120px de haut pour espèces multi-marches, + bouton CTA « Ouvrir la fiche → » qui ferme l'overlay et navigue

### 4. Logging

Le `logSearch` enregistre toujours, et au CTA on passe `clicked_kind` + `clicked_id` (déjà supporté).

---

## Détails techniques

- **Performance** : la fusion `species` réduit drastiquement les lignes retournées (de N obs à K espèces) → plus rapide à rendre.
- **Vignette espèce** : utilise `<SpeciesThumb />` existant (cascade locale → iNat → kingdom) — pas de nouvel appel réseau.
- **Vignette marche / event** : on prend la `cover_url` de `marche_events` si présente, sinon gradient émeraude + picto.
- **Mini-carte expand** : montée seulement à l'ouverture (lazy) pour ne pas tuer le scroll.
- **Snippet « highlight match »** : regex côté front sur `meta.excerpt_around_match` déjà coupé en SQL (LEFT/RIGHT autour de la position du match), évite de transférer le `contenu` complet.
- **Migration** : `CREATE OR REPLACE FUNCTION public.search_global(...)` — un seul fichier, pas de table modifiée.

---

## Hors scope (pour une itération future)
- Vue carte agrégée de TOUS les résultats sur une seule mini-mappemonde
- Filtres temporels (« seulement cette saison »)
- Reconnaissance vocale dans le champ recherche
- Suggestions sémantiques IA (« vous cherchez peut-être… »)

---

## Question résiduelle (optionnelle, je peux choisir si pas de réponse)
Pour les espèces, quand un seul résultat existe (1 obs, 1 marche, 1 marcheur), affiche-t-on quand même le compteur « Vue 1× » ou on le masque pour rester sobre ? **Recommandation** : masquer si N=1, afficher « 📅 12 mars · ✍ Marie L. » à la place, plus humain.
