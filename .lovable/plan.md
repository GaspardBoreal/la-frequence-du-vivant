## Constat (vérifié sur le PDF fourni et dans le code)

Le PDF « J'identifie » sort en 3 pages :

- **Page 1** : cartouche + lecture dominante + cortège (herbacées, arbustes) + somme des indices. Équilibrée.
- **Page 2** : cortège suite (lianes, arbres) + concordance sol ↔ flore + **narration qui déborde** — le texte est coupé net au pied de page (« En touchant la terre lors des prélèvements physiques… » passe sous le filet de pied de page et se perd).
- **Page 3** : l'atlas du cortège, lui aussi **tronqué** — les vignettes 17 à 19 sont coupées en bas de page.

Cause : dans `IdentifySummary.tsx`, la section 04 (narration), les notes de terrain et les sources sont rendues dans le même bloc `printSection="p2"` que la concordance. Aucun espace ne reste. Et `IdentifyPrintLayout` pagine sur `2 + atlasPages`, donc l'atlas s'ouvre en page 3 sans respiration.

## Ce qui sera construit

### 1. Nouvelle page 3 — « Ce que la flore raconte » (narration pleine page)

Ajout d'un régime d'impression `p3` dans `IdentifySummary` qui isole :

- Un **bandeau de suite** propre (eyebrow `Diagnostic Propriété · Étape 3 · Narration`, nom de la propriété en serif italique, sous-titre `Ce que la flore raconte`), aligné sur le bandeau actuel de la page 2.
- Une **exergue** en tête : la phrase de lecture dominante (`narratePoleScores`) sur filet doré, comme accroche du texte.
- La **narration en page de manuscrit A4** : colonne de texte confortable (justifiée, interlignage large), **lettrine** sur le premier paragraphe, filet doré latéral, paragraphes séparés — le texte respire enfin sur une page entière au lieu d'être écrasé.
- Une **ligne de traçabilité** discrète en pied de texte : origine du texte (auto-généré à partir des observations / rédigé sur site) — même mention qu'à l'écran.
- En dessous, **05. Notes de terrain** (si renseignées) et **06. Sources** (CNPF 2018 + iNaturalist), qui quittent la page 2.

La page 2 se termine désormais proprement sur la concordance : cortège suite + anneau ICG + tableau + note de calcul, avec de l'air en pied.

### 2. Atlas du cortège en page 4

- `IdentifyPrintLayout` passe à **3 pages fixes + N planches d'atlas** ; la pagination de pied (`x / total`) est recalculée en conséquence, l'atlas démarre donc en page 4.
- L'atlas actuel coupe ses dernières vignettes : la grille passe de 24 à **20 vignettes par planche (4 × 5)**, ce qui garantit que la dernière ligne tient sous le pied de page A4 et agrandit légèrement chaque photo. Ici : 19 espèces → une planche unique complète, sans troncature.
- Contrôle qualité visuel après génération (rendu en images des 4 pages) pour vérifier qu'aucun bloc n'est coupé.

### 3. Cahier complet (Portrait + J'observe + J'analyse + J'identifie)

La même page narration est insérée dans `CombinedPrintLayout` entre la page concordance et les planches d'atlas, afin que les deux sorties (étape seule et cahier complet) racontent la même histoire, dans le même ordre.

## Détails techniques

- `src/components/propriete/identify/IdentifySummary.tsx` : `printSection` accepte `'p3'` ; les sections 04/05/06 sont déplacées de `showP2` vers un nouveau bloc `showP3` avec son propre bandeau et son gabarit manuscrit d'impression. Aucun changement du rendu écran (`!printOnly`) ni des calculs.
- `src/components/propriete/print/IdentifyPrintLayout.tsx` : ajout de `<Page index={3}>` et `total = 3 + atlasPages`.
- `src/components/propriete/print/CombinedPrintLayout.tsx` : ajout de la section `printSection="p3"` avant `FloraAtlasPrintPlates`.
- `src/components/propriete/identify/print/FloraAtlasPrintPlates.tsx` : `ATLAS_PER_PAGE` 24 → 20.
- `src/index.css` : styles d'impression de la page narration (lettrine, colonne de texte, filet) et ajustement de la grille atlas en 4 × 5.
- Aucune migration, aucun appel IA supplémentaire.
