## Plan d'implémentation — Drawer "Nouvelle marche" v1 Compact épuré

Refonte purement visuelle du `CreateMarcheDrawer.tsx` selon le prototype validé. Aucun changement fonctionnel.

### Structure du drawer (Sheet existant, côté droit)

1. **Header sticky** (border-bottom subtil)
   - Titre `Nouvelle marche` (text-xl font-bold, tracking-tight)
   - Bouton close X aligné droite
   - **Pill ambre déplacée SOUS le titre** : `inline-flex` chip arrondi `bg-amber-500/10 border-amber-500/20 text-amber-400` avec icône pin + "Glissez le repère, puis validez"
   - Coordonnées GPS affichées en mono discret sous la pill

2. **Corps** (`p-6 space-y-6`)
   - Champ **Nom de l'étape** (label `text-sm font-semibold text-zinc-300`, input `bg-zinc-800/50 border-zinc-700 rounded-lg`)
   - Grille 2 colonnes **Ville / Date**
   - **Description courte** (textarea 3 rows, compteur 0/200 aligné droite)
   - Carte toggle **Collecter la biodiversité** (conservée, restylée avec même langage : `bg-zinc-800/50 border-zinc-700`)
   - Carte **Position GPS** (conservée, restylée)

3. **Footer sticky** (`p-6 pt-2 flex gap-3`)
   - **Annuler** : `flex-1 border-zinc-700 text-zinc-300`
   - **Créer l'étape** : `flex-1 bg-amber-500 text-zinc-900 font-bold shadow-amber-500/20`

### Tokens / cohérence

- Utiliser les tokens sémantiques existants du projet (palette dark forêt) : remplacer `zinc-900/800/700` par leurs équivalents `card / muted / border` du design system, et `amber-500` par `accent` (ambre du thème). Vérifier `index.css` et `tailwind.config.ts` avant — sinon utiliser HSL via tokens existants.
- Conserver tous les comportements existants : auto-suggestion nom, validation 200 car., toggle biodiversité (fire-and-forget Edge function), affichage GPS read-only.

### Fichier touché

- `src/components/community/exploration/CreateMarcheDrawer.tsx` uniquement.

### Validation

- Header lisible (titre + pill séparés, plus de chevauchement).
- Champs respirent (space-y-6).
- Footer toujours visible (sticky), CTA ambre haut contraste.
- Drawer reste un `Sheet` Radix (z-index 1100 préservé, comportement responsive intact).
