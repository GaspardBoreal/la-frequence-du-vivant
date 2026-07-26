## Constat (vérifié sur le PDF fourni + le code)

Le PDF `V2_J_analyse.pdf` montre : page 1 = cartouche + plan + points 01 & 02, page 2 = points 03 & 04 (deux tiers de page vides), page 3 = points 05, 06, 07. Une bande blanche subsiste à droite sur les pages 2 et 3.

Cause : l'impression « J'analyse (seul) » (`TabAnalyze.tsx` → `document.body.classList.add('analyze-printing')`) n'imprime pas une maquette A4 dédiée : elle rend **le composant à l'écran**, rendu visible via `body.analyze-printing` (`src/index.css` l. 632‑656) avec `position:absolute; left:0; right:0`. Résultat :
- la largeur du bloc est celle du conteneur de l'app, pas 210 mm → fond crème qui ne va pas jusqu'au bord droit (la bande blanche) ;
- la coupure des pages est laissée au navigateur (flux continu), d'où les points 03/04 seuls sur la page 2.

À l'inverse, le « Cahier complet » utilise déjà un portail d'impression avec des pages `210mm × 297mm` (`.portrait-print-page`, `.combined-print-analyze`) — c'est ce modèle qu'il faut adopter pour l'étape 2 seule.

## Objectif de maquette (3 pages A4, pleine page)

```text
PAGE 1 — L'OUVERTURE                PAGE 2 — LES LECTURES              PAGE 3 — LE REGISTRE
┌───────────────────────────┐       ┌───────────────────────────┐      ┌───────────────────────────┐
│ Cartouche doré  ÉTAPE 2   │       │ bandeau « Suite »         │      │ bandeau « Suite »         │
│ Nom · validé le …         │       │ ┌─────────┬─────────┐     │      │ 07. REGISTRE DES          │
│ LE PLAN (SVG cadastral)   │       │ │02 Prélèv│03 Struct│     │      │     PRÉLÈVEMENTS          │
│  A→E, échelle, nord       │       │ ├─────────┼─────────┤     │      │ « Le sol, point par point»│
│ Lecture dominante         │       │ │04 Textur│05 Acidité│    │      │ Tableau A→E pleine largeur│
│ 01. ÉTAT DU TERRAIN       │       │ ├─────────┴─────────┤     │      │ 08. Note de synthèse (si) │
│                           │       │ │06 Vie du sol      │     │      │                           │
│ pied de page  1/3         │       │ pied de page  2/3         │      │ pied de page  3/3         │
└───────────────────────────┘       └───────────────────────────┘      └───────────────────────────┘
```

Traitement « wahouhh » : chaque page pleine chasse crème, filet doré haut/bas, pied de page discret « Jardin Monde DEVIAT · Étape 2 · Analyse du sol · n/3 », et sur la page 2 une grille 2 colonnes équilibrée (bloc 06 en pleine largeur) pour supprimer le grand vide actuel.

## Mise en œuvre

1. **`AnalyzeSummary.tsx`** — remplacer le découpage binaire `printSection: 'first' | 'second'` par un découpage en 3 pages : `'p1'` (cartouche + plan + lecture dominante + section 01), `'p2'` (sections 02 → 06), `'p3'` (registre 07 + note 08). Les valeurs `'first'`/`'second'` restent acceptées et mappent vers `p1`/`p2+p3` pour ne rien casser. En mode `printOnly`, la grille passe explicitement en 2 colonnes (classes print au lieu de `md:`), le bloc 06 en `col-span-2`.

2. **Nouveau `src/components/propriete/print/AnalyzePrintLayout.tsx`** — maquette A4 dédiée : 3 `<section className="analyze-print-page">` (210×297 mm) contenant `AnalyzeSummary printOnly printSection="p1|p2|p3"`, avec filets dorés et pied de page paginé. La page 3 n'est rendue que si le registre existe.

3. **`TabAnalyze.tsx`** — l'option « J'analyse (seul) » n'utilise plus `analyze-printing` sur le DOM écran mais un portail (`usePrintCombined`, `portalId="analyze-print-portal"`, `bodyClass="analyze-print-mode"`) rendant `AnalyzePrintLayout` (avec `soil`, `parcelles`, nom de propriété, date). Même bouton, même dialogue.

4. **`src/index.css`** — ajouter l'isolation du nouveau portail (`body.analyze-print-mode > *:not(#analyze-print-portal){display:none}`) et les styles `.analyze-print-page` (210mm/297mm, `padding: 16mm 15mm 12mm`, fond `#fbf7ee` en pleine chasse, `break-after: page`, couleurs forcées). Le bloc `body.analyze-printing` historique est retiré/neutralisé puisque plus utilisé.

5. **Cohérence « Cahier complet »** — `CombinedPrintLayout.tsx` passe de 2 à 3 pages pour l'étape 2 (`p1`/`p2`/`p3`) et `insertedPageCount` 5 → 6, pour que la pagination du cahier complet soit identique à celle du PDF seul.

## Vérification

Impression via Playwright (`page.pdf`) du parcours `/propriete/jardin-monde-deviat` → onglet J'analyse → Imprimer → « J'analyse (seul) », puis rendu image des 3 pages : contrôle que la page 1 s'arrête après « 01. État du terrain », que 02→06 tiennent sur la page 2, que 07 est seul en page 3, et que le crème couvre les 4 bords.

## Détails techniques

- Aucun changement de données ni de logique métier : uniquement présentation/impression.
- `SoilSamplesPlan` reste inchangé (déjà limité à 92 mm de haut en impression).
- Fallback : si l'étape 2 n'a aucun prélèvement, la page 3 est omise et le pied de page affiche « n/2 ».
