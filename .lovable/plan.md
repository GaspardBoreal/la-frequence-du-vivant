# Apprendre → La main · Photos entières, grille égale 3 colonnes, fond vert forêt

## Décisions validées

- **Cadrage** : `object-contain` — la photo entière reste visible, jamais rognée.
- **Disposition** : grille égale 3 colonnes (retour à un alignement régulier, fini la mosaïque hero+side).
- **Fond des cellules** : vert forêt très sombre (palette dark Forêt Émeraude). Sur thème light, fallback en `bg-muted/40` neutre pour rester sobre.

## Implémentation

Fichier unique : `src/components/community/insights/curation/MainCuration.tsx`.

### 1. Grille des photos dépliées

- **1 média** : 1 colonne, ratio `aspect-[16/9]`, photo en `object-contain` centrée.
- **2 médias** : 2 colonnes égales, ratio `aspect-[4/3]`, `object-contain`.
- **3+ médias** : `grid-cols-3` égales, ratio `aspect-[4/3]`, `object-contain`. Sur la 3ᵉ tuile, badge `+N` (déjà fait) conservé.
- Gouttière `gap-1`.

### 2. Fond des cellules

- Container vignette : `bg-[hsl(var(--forest-deep))]` côté dark / classe utilitaire dédiée. Comme on n'a pas forcément ce token existant, je vais utiliser une approche thème-safe : `bg-emerald-950 dark:bg-emerald-950` (vert forêt profond, ~`#022c22`) qui colle au design dark de l'app. Pour le thème light, on reste sur ce même vert sombre pour garder l'esthétique "galerie" — le cadre photo a sa propre identité, ce n'est pas du chrome d'app.
- Décision finale : **`bg-emerald-950`** dans toutes les cellules (cohérent avec la palette Forêt Émeraude, lisible en light et en dark, conforme à la demande "vert forêt très sombre").

### 3. Adaptation de `renderThumb`

- Ajouter une option `objectFit?: 'cover' | 'contain'` (défaut : `'cover'` pour préserver les autres usages éventuels, mais ici on passera `'contain'`).
- L'`<img>` reçoit `object-cover` ou `object-contain` selon l'option. Conserver `w-full h-full` pour que l'image se centre dans la cellule.

### 4. Hover

- Garder le micro-hover (`group-hover:brightness-105`) mais **retirer le `scale-[1.02]`** : un scale sur une photo en `object-contain` recadre visuellement, ce qui contredit l'objectif "voir toute la photo". On garde juste l'effet de luminosité.

### 5. Picto en tête de carte

- Inchangé (URL brute déjà corrigée précédemment).

## QA visuelle

- Pratique « Haies pour corridor écologique » (3 médias mixtes paysage/macro/macro) : 3 cellules égales, paysage entier visible (bandes vert forêt en haut/bas), scarabée entier visible (bandes sur les côtés), feuilles entières visibles. Aucun crop.
- Pratique 1 média : 16/9 plein, photo contenue, fond vert forêt si format ne remplit pas.
- Pratique 2 médias : diptyque 4/3 égal, `object-contain`.
- Pratique 5+ médias : 3 cellules avec badge `+N` discret sur la dernière.
- Test dark + light : vert forêt sombre suffisamment sombre pour rester élégant en light theme, intégré naturellement en dark theme.
