# Diagnostic

La popup "Où insérer ce point ?" est rendue par le composant shadcn `Dialog`, dont l'overlay et le contenu utilisent `z-50`. Or, la carte d'exploration superpose plusieurs panneaux flottants en `z-[1000]` / `z-[1001]` / `z-[1100]` :

- Barre de stats en bas (`13 étapes · ~7.7 km · 38 espèces`) → `z-[1000]`
- Boutons d'actions latéraux → `z-[1000]`
- Bandeau du mode picking → `z-[1100]`

Résultat visible sur la capture : la modale est correctement centrée verticalement, mais sa partie basse — y compris le bouton **"Confirmer l'insertion"** — passe **derrière** la barre noire du bas. Le footer est donc visuellement tronqué et non cliquable sur la zone masquée.

C'est exactement ce que le screenshot montre : le bouton orange "Confirmer l'insertion" apparaît coupé à la ligne pile où commence la barre `13 étapes / km / espèces`.

# Solution

Forcer un z-index supérieur à 1100 pour cette modale précisément (sans toucher au composant shadcn générique, qui est utilisé partout ailleurs).

## Changement unique

**`src/components/community/exploration/WaypointInsertConfirmDialog.tsx`**

Ajouter `z-[1200]` sur le `DialogContent` (et passer une classe overlay équivalente si nécessaire). Le `DialogContent` Radix monte dans un `Portal` à la racine du `<body>`, donc seul le z-index compte (pas d'effet de stacking context piégé).

```text
<DialogContent className="... z-[1200] ...">
```

Note : Radix attache l'overlay et le content au même portal ; relever uniquement `DialogContent` suffit pour que la modale + son footer passent au-dessus de la barre stats. L'overlay sombre reste en `z-50` (acceptable car les éléments carte en `z-[1000]` ne capturent pas les clics utiles pendant que la modale est ouverte — Radix bloque déjà l'interaction via `pointer-events`).

Si nécessaire en complément (ceinture + bretelles) : ajouter une classe overlay custom via le rendu shadcn — mais le seul changement requis pour résoudre le bug visible est le z-index du `DialogContent`.

# Vérification

Après le changement :
1. Reproduire le scénario : créer un point intermédiaire jaune → cliquer point 8 → cliquer point voisin → la modale "Où insérer ce point ?" doit apparaître intégralement au-dessus de la barre `13 étapes`, avec le bouton "Confirmer l'insertion" entièrement visible et cliquable.
2. Capture d'écran via `browser--screenshot` à viewport 1046×754 pour confirmer que le footer n'est plus tronqué.
