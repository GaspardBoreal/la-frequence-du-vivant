# Mosaïque des activités — libellés toujours lisibles

## Problème

Le `Treemap` de Recharts utilisé dans `ProfilsImpactDashboard.tsx` (ligne 137) est rendu sans prop `content`. Par défaut Recharts ne dessine **aucun texte** dans les tuiles — le libellé n'apparaît qu'au survol via le tooltip. Sur l'écran fourni, on voit donc des blocs colorés où seules deux ou trois activités se devinent, et il faut passer la souris pour identifier les autres. Sur mobile (pas de hover), c'est totalement illisible.

## Objectif

Afficher en permanence, dans chaque tuile, le **libellé de l'activité** et sa **valeur**, de façon élégante, sans débordement, et lisible sur fond clair comme foncé.

## Approche

Fournir au `<Treemap>` un composant `content` personnalisé qui dessine pour chaque cellule :

1. Un `<rect>` rempli de la couleur de la tuile (déjà fournie via `fill`).
2. Un libellé multi-lignes (nom court de la CSP) centré.
3. Une valeur secondaire (nombre de marcheur·euse·s) sous le libellé, plus petite et semi-transparente.

Règles d'élégance et de lisibilité :

- **Adaptation à la taille de la tuile** : taille de police calculée à partir de `min(width, height)` (clamp 10–16 px). Si la tuile est trop petite (< 44 px de large ou < 30 px de haut), on n'affiche que le libellé tronqué ; si elle est minuscule (< 28×22), rien — pour ne pas bruiter.
- **Couleur de texte automatique** : on calcule la luminance HSL de `fill` ; si la tuile est claire, texte `hsl(220 25% 12%)`, sinon texte `#fff`. La valeur secondaire reprend la même couleur avec `opacity: 0.78`.
- **Coupure intelligente du libellé** : on découpe le `name` en mots, on remplit chaque ligne en respectant la largeur disponible (≈ `(width - 12) / (fontSize * 0.55)` caractères), max 2 lignes, ellipsis sur la 2ᵉ si dépassement. Évite les coupures hideuses comme « Em\nployé·e ».
- **Padding interne** de 6 px, libellé centré (`textAnchor="middle"`) à `x + width/2`, vertical centering basé sur le nombre de lignes effectives.
- **Stroke des tuiles** déjà à `hsl(var(--background))` — on garde, ça donne le grain mosaïque propre.
- **Tooltip conservé** pour afficher le libellé long complet (ex. « Cadres et professions intellectuelles supérieures ») au survol — utile car on n'affiche que le `short` dans la tuile.

Bonus design (léger) :

- Léger arrondi `rx={4}` sur les rectangles pour adoucir la mosaïque (cohérent avec le reste du dashboard qui utilise `rounded-lg`).
- Ombre portée subtile sur le texte foncé sur fond clair via `paintOrder="stroke"` + `stroke="rgba(255,255,255,0.4)"` `strokeWidth={2}` pour garantir le contraste même si une tuile a une couleur intermédiaire.
- Hauteur de la carte portée à `240` (au lieu de `220`) pour que les tuiles aient un peu plus d'air vertical — aligne aussi mieux avec la `Card` voisine du donut qui a sa légende sous le graphe.

## Détails techniques

Fichier touché : `src/components/admin/community/ProfilsImpactDashboard.tsx`

1. Ajouter un composant local `CSPTreemapContent` (rendu SVG `<g><rect/><text/></g>`) implémentant les règles ci-dessus. Recharts lui passe `x, y, width, height, name, value, fill, depth` via props.
2. Passer ce composant via `content={<CSPTreemapContent />}` au `<Treemap>`.
3. Ajouter un `<Tooltip>` enfant du `<Treemap>` avec le même style que les autres graphes pour conserver l'info détaillée au survol.
4. Garder `CSP_OPTIONS[i].short` comme `name` (déjà le cas) — c'est le label affiché dans la tuile ; le tooltip pourra remonter le `label` long si on l'ajoute au `cspData` (champ `fullName`).
5. Aucune dépendance nouvelle, aucune migration, aucun changement de RPC.

## Aperçu visuel

```text
┌────────────────────────────────────────────────┐
│  Mosaïque des activités                        │
│  Tous les métiers convergent vers le vivant    │
│ ┌───────────┬──────────────────┬─────────────┐ │
│ │           │                  │ Sans        │ │
│ │  Cadre    │   Employé·e      │ activité    │ │
│ │   12      │      28          │    4        │ │
│ │           │                  ├─────────────┤ │
│ │           ├──────────────────┤ Retraité·e  │ │
│ │           │   Étudiant·e     │     3       │ │
│ │           │       9          │             │ │
│ └───────────┴──────────────────┴─────────────┘ │
└────────────────────────────────────────────────┘
```

Tous les libellés visibles d'un coup d'œil, plus besoin de hover, et le rendu reste cohérent avec le ton minimaliste « sobriété informationnelle » du reste du dashboard.
