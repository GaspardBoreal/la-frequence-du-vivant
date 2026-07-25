## Objectif

Rendre chaque bloc du carnet scellé « Portrait de la Propriété » immédiatement lisible, améliorer l'impression, et ajouter un dispositif signature.

---

### 1. Chips lisibles (au lieu de pictos fantômes)

Dans `src/components/propriete/observe/ObserveSummary.tsx`, remplacer le composant `PictoRow` (qui affiche les 6-8 choix avec les non-cochés grisés) par un `ChipRow` qui affiche **uniquement les cases cochées**, sous forme de chip lisible :

- Fond crème, bordure or fine, coins arrondis
- Emoji + libellé complet (`{icon} {label}`)
- Taille confortable (text-sm, py-1 px-2.5)
- Wrap naturel, gap 2

Si aucune case cochée : petit texte italique `— Non renseigné —` en gris.

Ceci s'applique aux 7 premiers blocs. La phrase narrative (`describeBlock`) reste dessous en complément mais devient secondaire (couleur atténuée).

---

### 2. Refonte de l'impression

Actuellement `window.print()` imprime la page entière (header app, sidebar, sceau tourné, etc.). Refonte :

**a) Cacher tout sauf le carnet à l'impression** — ajouter dans `src/index.css` un bloc `@media print` :
```css
@media print {
  body * { visibility: hidden; }
  .print-root, .print-root * { visibility: visible; }
  .print-root { position: absolute; inset: 0; }
}
```
Et poser `className="print-root"` sur `<motion.article>` du `ObserveSummary`.

**b) Nouveau cartouche d'impression en tête** — remplacer le hero écran par un bandeau print-only (visible uniquement `@media print`) :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      DIAGNOSTIC PROPRIÉTÉ · ÉTAPE 1
      
      Jardin Monde — Deviat        [nom en serif italique XXL]
      
      Validé le 25/07/2026 · Fréquence du Vivant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- Nom de la propriété en grand (font-serif italic, 3xl print)
- Filet or fin dessus/dessous
- Sceau daté masqué à l'impression (`print:hidden` sur le sceau tourné) car redondant
- Actions footer déjà `print:hidden` ✓

**c) Récupérer le nom de la propriété** — `ObserveSummary` reçoit une nouvelle prop `propertyName?: string`, passée depuis `TabObserve.tsx` qui la reçoit lui-même via nouvelle prop depuis son parent (page Propriété). Fallback : `Portrait de la Propriété`.

---

### 3. Idée signature : « Ligne de Vie » — sparkline du site

Sous le header écran (et à l'impression), afficher une **ligne de vie horizontale** qui condense visuellement le portrait en un glyphe unique :

- Bandeau fin (h-16 écran, h-12 print) traversé par une ligne SVG ondulée qui suit métaphoriquement le terrain observé
  - amplitude = relief (plat → plate ligne, pentu → grande onde)
  - couleur du trait = dominante eau (bleu si stagnation/humide, ambre si sec)
  - épaisseur variable = intensité ambiance (1→4px)
- 8 points-repères le long de la ligne, un par bloc, chacun avec le picto dominant du bloc au-dessus/en-dessous en alternance
- Les points « à risque » (pollution, sécheresse…) pulsent en ambre (animation écran only)
- Sous-titre : `Signature écologique du site — 25/07/2026`

Un composant `SiteSignature.tsx` génère le SVG à partir des `answers` + `sensorial.intensity`. Fonctions utilitaires : `computeAmplitude`, `computeStroke`, `pickWaterColor` — pures, dans le même fichier.

Ce glyphe :
- devient la carte de visite du diagnostic (imprimable, exportable),
- se réutilisera plus tard en badge sur la fiche propriété, dans le PDF client, dans un futur partage social.

---

## Détails techniques

**Fichiers modifiés**
- `src/components/propriete/observe/ObserveSummary.tsx` : remplacer `PictoRow` par `ChipRow`, ajouter cartouche print, ajouter `<SiteSignature>`, ajouter prop `propertyName`, ajouter `print-root`, cacher sceau à l'impression.
- `src/components/propriete/tabs/TabObserve.tsx` : propager `propertyName` vers `ObserveSummary`.
- Page propriété appelante (à identifier via `rg TabObserve`) : passer `propertyName` déjà présent dans le state.
- `src/index.css` : règles `@media print` globales pour isoler `.print-root`.

**Fichier créé**
- `src/components/propriete/observe/SiteSignature.tsx` : composant SVG pur.

**Pas de changement backend / data / RPC.**
