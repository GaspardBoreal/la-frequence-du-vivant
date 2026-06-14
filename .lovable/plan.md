# Onglet Pratiques /admin/crm/marches — 3 corrections

## Diagnostic

Dans `PratiquesRemarquablesTab.tsx` :

1. **Images manquantes** — les `media_ids` stockés sont préfixés (`conv:<uuid>` pour `exploration_convivialite_photos`, `media:<uuid>` pour `marcheur_medias`). La requête actuelle interroge uniquement `marcheur_medias` avec les UUID préfixés bruts → 0 résultats, fallback sur l'icône « sparkle ».
2. **Balises HTML brutes** — la description contient du HTML (`<span>`, `<h1>`, `<p>…`) issu de Google Docs, affichée via `{p.description}` en texte brut → balises visibles.
3. **Fiche non cliquable** — la `<article>` est purement décorative, aucun `onClick` ni handler.

## Plan

### 1. Résolution unifiée des médias (cover)

Dans le `queryFn` :
- Parser tous les `media_ids` en deux buckets : préfixe `conv:` → IDs convivialité, préfixe `media:` → IDs marcheur_medias, bare UUID → fallback `conv:` (legacy, voir `useExplorationAllMedia`).
- Faire **deux requêtes en parallèle** :
  - `exploration_convivialite_photos`: `id, url` (champ `url` direct).
  - `marcheur_medias`: `id, url_fichier, external_url`.
- Construire une `Map<rawId, url>` fusionnée.
- Pour chaque curation, garder la **première URL résolue** (pas seulement le premier ID) afin d'avoir une vraie cover même si le 1er ID est cassé.

### 2. Affichage texte enrichi

- Importer `sanitizeHtml` depuis `@/utils/htmlSanitizer`.
- Sur la carte (aperçu) : extraire le **plain text** (`stripTags` simple : `description.replace(/<[^>]+>/g, ' ').replace(/\s+/g,' ').trim()`) puis `line-clamp-2`.
- Dans la fiche détaillée (dialog) : rendu HTML sanitizé via `dangerouslySetInnerHTML` dans un conteneur `prose prose-invert prose-sm max-w-none` pour une typographie élégante (titres, paragraphes, listes correctement stylés).

### 3. Fiche cliquable + Dialog design

Nouveau composant `PratiqueRemarquableDialog.tsx` (`src/components/crm/marches/`) :
- Reprend le langage visuel de `PratiquesEmblematiquesDialog` (public-event) — gradient `from-background via-card to-primary/5`, bordure `primary/20`, glassmorphism léger — adapté aux tokens CRM (`hsl(var(--crm-surface))`, `--crm-accent`).
- **Layout** :
  - Header avec icône Sparkles dorée + titre `font-display` + sous-titre marche/lieu/date.
  - **Hero cover** pleine largeur (aspect 16/9) avec dégradé bas pour lisibilité.
  - **Mini-carrousel** horizontal des autres médias (vignettes 80×80, scroll-snap, clic = swap dans le hero) — résout TOUTES les URLs, pas juste la première.
  - **Corps texte** : HTML sanitizé dans `prose` (police chaleureuse, line-height généreux, marges respirantes).
  - **Footer** : badge marche cliquable (lien vers fiche marche existante si dispo via `/admin/crm/marches?marcheId=…`), date formatée, lieu.
- Animation `motion.div` discrète à l'ouverture (fade + scale 0.98→1, 200ms).

Sur la carte :
- `<article>` devient `<button>` (ou `role="button" tabIndex={0}` + handlers clavier) avec `cursor-pointer`, `focus-visible:ring-2 ring-[hsl(var(--crm-accent))]`.
- Hover : `scale-[1.01]` + ombre accent + bordure `crm-accent/60` (déjà partiellement présent, à renforcer).
- État sélectionné géré dans `PratiquesRemarquablesTab` via `useState<PratiqueRow | null>`.

### 4. Petits + UX

- Si aucune cover résolue, montrer une cover dégradée élégante (emerald→amber) plutôt que l'icône grise actuelle.
- Badge `+N` (compte total de médias) repositionné avec `backdrop-blur` pour rester lisible sur images claires.
- Tronquer titres à 2 lignes, descriptions à 2 lignes — déjà fait, vérifier après le strip HTML.

## Fichiers touchés

- `src/components/crm/marches/tabs/PratiquesRemarquablesTab.tsx` — résolution medias (conv+media), strip HTML pour aperçu, ouverture dialog, fallback cover.
- `src/components/crm/marches/PratiqueRemarquableDialog.tsx` — **nouveau**, fiche détaillée design.

Aucune migration BDD, aucune modification d'API.
