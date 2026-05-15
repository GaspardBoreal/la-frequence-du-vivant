## Spirale du Vivant — direction visuelle #2

Une seconde lecture de la chaîne trophique, complémentaire à la Constellation. Là où la Constellation déploie les niveaux en orbites concentriques (vue "cosmique"), la Spirale enroule l'écosystème en un **flux d'énergie continu** : la photosynthèse au cœur, l'apex au bord externe, les décomposeurs en contre-spirale qui ramènent la matière vers le centre. Une métaphore directe du **cycle vivant** (énergie qui monte, matière qui redescend).

### Concept visuel

```text
                  ╭───── L5 apex (bord)
              ╭───┤
          ╭───┤   ╰── L4
       ╭──┤   ╰──── L3
       │  ╰──────── L2
       │ ◉  ←  L1 cœur (Soleil/photosynthèse)
       │  ╰╮
        ╲  ╲   ← contre-spirale décomposeurs
         ╲──╲    (matière qui redescend)
```

- **Spirale principale (logarithmique)** : du centre vers l'extérieur, traverse L1 → L2 → L3 → L4 → L5. Chaque niveau occupe un secteur d'angle proportionnel au nombre d'espèces (avec un minimum visible si vide → segment fantôme pointillé).
- **Espèces** = pastilles colorées posées le long de l'arc de leur niveau, taille = log(abondance).
- **Flux d'énergie** : un dégradé animé (or → vert → bleu) glisse en boucle douce le long de la spirale (≈8 s loop) — direction sortante = énergie qui monte la pyramide.
- **Contre-spirale décomposeurs** : une seconde spirale plus discrète, en sens inverse, depuis l'apex vers le cœur — symbolise la décomposition qui referme le cycle. Pastilles décomposeurs posées dessus.
- **Niveaux manquants** : segment pointillé + chip "⚠ L4 absent" sur le tracé → la spirale est *visiblement cassée* à cet endroit (puissant pédagogiquement).

### Interactions

- **Hover espèce** → tooltip (nom, niveau).
- **Clic espèce** → focus : la spirale s'estompe, seul le segment du niveau de l'espèce reste vif, et des arcs fins relient l'espèce à 4-6 proies probables (réutilise `probablePreyGroups`). Side panel = même `SelectedStarPanel` que Constellation (réutilisé tel quel).
- **Clic sur un secteur de niveau** (zone vide entre pastilles) → focus niveau, side panel = `LevelPanel`.
- **Side panel par défaut** : narratif "Suivez le fil de l'énergie" + compteurs par niveau (réutilise `DefaultPanel`).
- **Bouton "Réinitialiser"** identique à la Constellation.

### Détails techniques

- **Nouveau fichier** : `src/components/community/synthese/trophic/SpiraleTab.tsx`
  - Props identiques à `ConstellationTab` : `{ chain: TrophicChainResult }`.
  - Génère le path SVG de la spirale logarithmique : `r(θ) = a · e^(b·θ)` paramétré pour traverser les rayons de chaque niveau (réutilise `RADII` mental — ici on en fait une fonction du tour θ).
  - Place chaque espèce : pour chaque niveau, on calcule la portion d'angle qui correspond au tour de spirale dans ce niveau, on distribue les espèces uniformément dessus, puis on évalue (x, y) = polaire(θ, r(θ)).
  - Décomposeurs : seconde spirale `r(θ) = a · e^(-b·θ)` partant de l'extérieur, opacité 0.55, dasharray fin.
  - Animation flux : `<motion.circle>` qui suit la spirale via `offsetPath` CSS (fallback : 3 pastilles SVG animées en `animateMotion` le long du path).
  - Tooltip + side panel : composants `SelectedStarPanel` / `LevelPanel` / `DefaultPanel` extraits de `ConstellationTab` ou — plus simple — réimportés en exportant ces 3 composants depuis `ConstellationTab.tsx` (un petit refacto local).

- **Refacto léger** dans `ConstellationTab.tsx` : ajouter `export` aux 3 sous-composants `DefaultPanel`, `LevelPanel`, `SelectedStarPanel` pour qu'ils soient réutilisables par la Spirale (sinon on les déplace dans `trophic/_panels.tsx`). Préférence : extraction dans `src/components/community/synthese/trophic/_panels.tsx` pour ne pas créer de dépendance inversée.

- **Branchement** dans `TrophicChainPanel.tsx` :
  - Marquer `'spirale'` comme `ready: true`.
  - Importer `SpiraleTab` et l'afficher quand `active === 'spirale'`.

- **Tokens CSS** : aucun nouveau token nécessaire. Réutilise `--trophic-l1..l5`, `--trophic-decomposer`, `--trophic-bg`, `--trophic-bg-edge`, `--accent`.

### Hors scope

- L'onglet "Réseau Vivant" reste placeholder (sera la 3e direction).
- Pas de changement à `useTrophicChain` ni `trophicClassification.ts`.
- Pas de changement de mise en page extérieure.

### Fichiers touchés

- **Créé** : `src/components/community/synthese/trophic/SpiraleTab.tsx`
- **Créé** : `src/components/community/synthese/trophic/_panels.tsx` (extraction des 3 panneaux pédagogiques)
- **Édité** : `src/components/community/synthese/trophic/ConstellationTab.tsx` (importe les panneaux depuis `_panels`)
- **Édité** : `src/components/community/synthese/TrophicChainPanel.tsx` (active l'onglet, importe `SpiraleTab`)
