## Vue Marcheurs → Marcheurs : score Sentinelle, tri & filtre espèces remarquables

Trois ajouts sur la liste des marcheur·euse·s d'une exploration (`MarcheursTab.tsx`), alignés mobile-first et cohérents avec le design system (tokens `emerald/amber/rose/violet`, pastilles arrondies déjà en place).

---

### 1. Affichage élégant du score Sentinelle (par carte)

Un **chip Sentinelle** unique, posé à droite de la ligne d'en-tête, juste avant le chevron — visible carte fermée comme ouverte.

```text
┌─ Avatar ─┬─ Prénom NOM ────────┬─ pictos contribs ─┬── chip Sentinelle ──┬─ ⌄ ─┐
│   LK     │  rôle               │ 📷7 🎧2 🪶1 🍃3   │ 🛡 72 · Ambassadeur │     │
└──────────┴─────────────────────┴───────────────────┴─────────────────────┴─────┘
```

Spécifications du chip :
- Icône `ShieldCheck` (lucide), valeur entière `/100`, libellé du tier en `text-[10px]` masqué `<sm` (juste icône + chiffre sur mobile très étroit).
- Couleur gradient selon le tier (`computeSentinelleIndex.tier`) :
  - `curieux` → `from-slate-500/10 to-slate-500/5` + texte `text-slate-500`
  - `eclaireur` → `from-amber-500/15 to-amber-500/5` + `text-amber-500`
  - `ambassadeur` → `from-emerald-500/15 to-emerald-500/5` + `text-emerald-500`
  - `sentinelle` → `from-violet-500/20 via-emerald-500/10 to-amber-500/15` + `text-emerald-400`, ring `ring-1 ring-emerald-500/30`, halo `shadow-[0_0_18px_-6px_rgba(16,185,129,0.5)]`
- Tooltip natif `title` : `"Indice Sentinelle 72/100 — Ambassadeur"`.
- Tap sur le chip → ouvre la carte directement sur le sous-onglet `impact` (où `MarcheurImpactPanel` détaille déjà la décomposition).

Calcul : un seul `useMemo` au niveau du parent (`MarcheursTab`) construit pour chaque marcheur :
- les buckets sensibles via `bucketSensibleSpecies(speciesNames, curationByName)` (la `curationByName` est hoistée du hook `useMarcheurSensibleSpecies` au parent — une seule requête `exploration_curations` pour toute la liste),
- puis `computeSentinelleIndex({ photos, sons, textes, hasTemoignage, speciesCount, bioCount, auxCount, eeeCount })`.

Aucune requête supplémentaire n'est ajoutée par marcheur.

---

### 2. Tri par score Sentinelle (décroissant par défaut) + croissant + alpha

Dans la barre de résumé existante (`Users · N marcheurs · X observations`), ajouter à droite un **segmented control compact** :

```text
[ 🛡 ↓ ]  [ 🛡 ↑ ]  [ A→Z ]
```

- Composant : trois petits boutons `rounded-full` `h-7` `px-2` `text-[11px]`, état actif `bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20`, inactif `text-muted-foreground hover:bg-muted/50`.
- État local `sortMode: 'sentinelle-desc' | 'sentinelle-asc' | 'alpha'`, défaut `'sentinelle-desc'`.
- Mobile : le contrôle reste sur la même ligne (icônes seules + lettres) ; au besoin il wrappe sous le compteur (flex-wrap déjà en place).
- Tri implémenté en remplaçant l'actuel `score()` du `useMemo` `sortedMarcheurs` par le score Sentinelle calculé en (1). Tie-break : ordre alphabétique FR via `Intl.Collator` (déjà présent).

---

### 3. Picto « espèces remarquables » : filtre rapide bio / auxiliaire / EEE

Sous la barre de tri, une rangée de **filter chips toggle** :

```text
Espèces remarquables :  [🌿 Bio · 4]  [🐞 Auxiliaire · 7]  [⚠ EEE · 1]   [✕ tout]
```

Spécifications :
- Trois chips, un par catégorie sensible :
  - Bio → `Flower2`, palette emerald (`bg-emerald-500/10 text-emerald-500`, actif `ring-1 ring-emerald-500/40 bg-emerald-500/20`).
  - Auxiliaire → `Bug` (lucide), palette amber.
  - EEE → `AlertTriangle`, palette rose.
- Compteur affiché = nombre de marcheurs qui ont ≥1 espèce dans ce bucket (pas le nombre d'espèces).
- Multi-sélect en **OR** (un marcheur passe le filtre s'il satisfait au moins un chip actif) — cohérent avec un "raccourci de découverte".
- Bouton `✕ tout` apparaît dès qu'au moins un chip est actif et réinitialise.
- Si aucun chip actif → liste complète (comportement actuel).
- Empty state si la combinaison de filtres ne renvoie personne : petit bloc inline `"Aucun marcheur n'a encore identifié d'espèce dans cette catégorie."` + bouton « Voir tous les marcheurs ».
- Le chip est **caché** si tous les compteurs sont à 0 (exploration sans aucune espèce sensible identifiée), pour rester sobre.

Tap sur un chip → également un cue visuel léger sur les cartes filtrées : ajout d'un mini-pastille colorée (`Flower2`/`Bug`/`AlertTriangle`) dans la ligne des pictos contributions, pour expliquer pourquoi le marcheur apparaît.

---

### Mobile-first & accessibilité

- Tous les contrôles : cible tap ≥ 32px, `aria-pressed` sur les toggles, `aria-label` explicite (« Trier par score Sentinelle décroissant », « Filtrer : auxiliaires »).
- Le chip Sentinelle reste visible même sur écrans étroits (les pictos contribs se compactent déjà via `flex-wrap` ; on garantit que le chip Sentinelle est `flex-shrink-0`).
- Aucune nouvelle dépendance, aucun changement de schéma.

---

### Détails techniques (pour implémentation)

Fichiers touchés (front uniquement) :
- `src/components/community/exploration/MarcheursTab.tsx` :
  - Hoister la query `exploration_curations` (sense=`oeil`, entity_type=`species`) au niveau parent → `curationByName: Map`.
  - Ajouter `marcheurMetrics: Map<id, { sentinelle: SentinelleResult; buckets: SensibleBuckets }>` via `useMemo`, partagé pour tri, filtre, chips et passage en prop à `MarcheurCard`.
  - Remplacer le `score()` actuel par `metrics.sentinelle.total`.
  - Ajouter état `sortMode` et `activeBuckets: Set<'bio'|'aux'|'eee'>`.
  - Filtrer `sortedMarcheurs` selon `activeBuckets` avant rendu.
- `MarcheurCard` reçoit `sentinelle: SentinelleResult` et `activeBuckets` ; affiche le chip + ouvre directement sur `impact` quand on tap le chip (via callback `onOpenImpact`).
- Aucun changement à `useMarcheurSensibleSpecies`, `sentinelleIndex.ts`, `speciesClassification.ts` (ils sont déjà la source de vérité unique alignée sur L'œil).

Pas de migration SQL. Pas d'edge function. Pas d'impact sur les vues admin.