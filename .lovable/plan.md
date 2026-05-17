## Diagnostic

La mosaïque actuelle (lignes 612-640 de `MarcheursTab.tsx`) souffre de trois manques :

1. **Photos perso noyées** — elles sont juste triées en tête, sans hiérarchie visuelle forte. Quand le marcheur a 3 photos perso sur 40 espèces, on voit surtout des miniatures iNat dès le 2ᵉ écran. Le toggle "Mes photos" existe mais est secondaire (petite pastille à droite).
2. **Pas de filtres règne** — impossible d'isoler la Faune, la Flore, les Champignons. Pourtant le `kingdom` est déjà disponible dans chaque `ContribSpeciesItem`.
3. **Pas de mise en récit** — toutes les tuiles ont la même valeur visuelle, on ne ressent pas "ce que CE marcheur a vu de ses yeux".

## Améliorations proposées

### A. Vue par défaut : "Mes photos" en premier

Réorganiser la sous-onglet en **deux sections empilées** :

```
┌─ Section 1 — "Mes captures" (si ownCount > 0) ──────────┐
│  Titre : "📷 Vos {N} captures personnelles"            │
│  Bento généreux : 1ʳᵉ tuile 2x2, photos plus grandes   │
│  Tuiles : grandes (180px desktop), ratio variable      │
│  Carousel léger si plusieurs photos par espèce         │
└─────────────────────────────────────────────────────────┘

┌─ Section 2 — "Repérées dans le périmètre" (iNat) ──────┐
│  Titre : "{N} espèces vues par la communauté"          │
│  Bento compact : tuiles 120px uniformes                │
│  Visuellement plus discret (saturation -10%, ring fin) │
└─────────────────────────────────────────────────────────┘
```

Si `ownCount === 0` → on n'affiche que la section iNat (comme aujourd'hui).
Si `onlyOwn === true` → seule la section "Mes captures" est visible.

**Effet** : le marcheur voit IMMÉDIATEMENT ses propres photos en grand, valorisées. Les photos iNat passent en "contexte du périmètre".

### B. Filtres par règne (chips horizontales)

Ajouter un rang de chips sous le header :

```
[ Tout (42) ]  [ 🐦 Faune (18) ]  [ 🌿 Flore (22) ]  [ 🍄 Fungi (2) ]
```

- Calculé depuis `all` (avant filtre `onlyOwn`) pour montrer les totaux réels.
- État local `kingdomFilter: 'all' | 'Animalia' | 'Plantae' | 'Fungi' | 'other'`.
- Chip actif : `bg-emerald-500/15 ring-1 ring-emerald-500/40 text-foreground`.
- Chip inactif : `bg-muted/40 hover:bg-muted/60 text-muted-foreground`.
- Icône + label + count entre parenthèses, taille `text-[11px]`.
- Compatible avec `onlyOwn` : les filtres se combinent (ex. "Faune" + "Mes photos").
- Si un règne a 0 espèce → chip masquée (pas grisée, on évite le bruit).

### C. Header repensé

Remplacer la ligne actuelle par 2 rangs :

```
Rang 1 : Counter + toggles principaux
   "🌿 42 espèces"  [📷 Mes photos (3) ●] [⇅ Tri]

Rang 2 : Chips règne
   [Tout] [🐦 Faune] [🌿 Flore] [🍄 Fungi]
```

Le toggle "Mes photos" devient un **switch visible** (pas une mini-pastille) avec compteur intégré, désactivé si `ownCount === 0`.

### D. Tuile "Mes captures" enrichie

Pour les tuiles de la section 1 (photos perso) :
- Badge "📷 Marcheur" remplacé par un **liseré emerald** plus subtil (ring-2 emerald-500/60 permanent, pas seulement au hover) — la photo elle-même est le badge.
- Indicateur "×N photos" en bas-droite si `ownPhotos.length > 1` (préfigure carousel V2).
- Date plus visible : "📅 12 nov." en chip semi-transparent.
- Au clic : lightbox déjà en place — ajouter navigation flèches si `ownPhotos.length > 1`.

Tuiles iNat (section 2) restent comme aujourd'hui mais sans le badge "iNat" en haut-droite (info redondante avec la section), gagnant en sobriété.

### E. État vide différencié

- `ownCount === 0` + section iNat non vide → bannière discrète au-dessus : *"Aucune photo perso encore. Uploadez vos clichés via l'onglet Observations ↑"* (CTA léger).
- Filtre règne vide → message contextuel : *"Aucune espèce de Faune identifiée"* + bouton "Voir tout".

## Robustesse

- **Performance** : le filtre `kingdomFilter` est purement client-side sur `items` déjà en mémoire — aucun re-fetch.
- **Memoization** : `kingdomCounts` calculé via `useMemo` sur `all`, recalcul seulement si `items` change.
- **Accessibilité** : chips sont des `<button role="tab" aria-pressed>`, navigation clavier supportée.
- **Persistance** : `kingdomFilter` et `onlyOwn` restent locaux au composant (pas de URL state) — cohérent avec `sort`.
- **Fallback kingdom** : valeurs hors `Animalia/Plantae/Fungi` regroupées sous "Autres" si présentes, sinon ignorées.
- **Aucun changement de schéma** ni de hook backend : tout est purement UI sur les données déjà chargées par la query `marcheur-contributions-bento`.

## Fichiers touchés

- **Édité** : `src/components/community/exploration/MarcheursTab.tsx`
  - Composant `ContributionsSubTab` (lignes 431-790 environ) : ajouter state `kingdomFilter`, calculer `kingdomCounts`, rendre les chips, scinder le rendu en deux blocs `<BentoSection variant="own" />` / `<BentoSection variant="inat" />`, factoriser la tuile en sous-composant local `ContribTile`.

## Hors scope

- Carousel multi-photos par espèce (préparation seulement via l'indicateur "×N").
- Filtres par catégorie écologique (bioindicateur/EEE/etc.) — pourrait venir en V3.
- Drag-and-drop de réordonnancement (déjà géré ailleurs).
