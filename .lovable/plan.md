
## Constat (d’après tes captures)
- Le texte de contexte (Partie/Marche) est bien “collé” en bas à gauche → donc `fixed` + `position: 'absolute'` fonctionne sur ce `<Text>` statique.
- Le numéro de page reste “dans le flux” au milieu de la page → il se comporte comme si **son `position: 'absolute'` n’était pas pris en compte** (très probablement à cause de la combinaison `render` + positionnement direct sur le `<Text>` dans cette version de `@react-pdf/renderer` / Yoga).

Autrement dit : **le problème n’est plus la logique “Partie vs Marche”, mais l’ancrage du `<Text render>`**.

## Hypothèse technique (la plus plausible)
`@react-pdf/renderer` gère parfois mal le positionnement absolu d’un `<Text>` quand il utilise `render={() => ...}` (le texte est mesuré/rendu différemment), ce qui fait que le composant se place au point d’insertion dans la page (donc au milieu), malgré `fixed`.

## Solution proposée (robuste)
Revenir à la stratégie “conteneur fixe” (celle qu’on voulait au début), **sans jamais mettre `render` sur `<View>`** :

- Créer un **`<View fixed>`** ancré en bas (position: absolute, bottom, left, right), qui sert de “barre de footer”.
- Mettre à l’intérieur :
  1) un `<Text>` statique à gauche (Partie ou Marche)
  2) un `<Text>` à droite avec `render={({pageNumber}) => ...}`

Ainsi, même si `render` perturbe le positionnement du `<Text>`, **c’est le conteneur** qui fixe la position en bas de page ; le `<Text render>` n’a plus besoin d’être en `absolute`.

## Changements à faire (code)

### 1) `src/utils/pdfStyleGenerator.ts`
Objectif : garder les styles existants (compatibilité), mais ajouter des styles “inline” pour le footer en conteneur.

- Ajouter 2 nouveaux styles dans `PdfStylesRaw` (interface) :
  - `pageFooterBar` (ou réutiliser `pageFooter` mais il est marqué “legacy”; je préfère un nouveau nom clair)
  - `pageFooterContextInline`
  - `pageNumberInlineText`

- Implémenter ces styles dans `generatePdfStyles()` :

Exemple d’intention (valeurs exactes à caler sur tes marges existantes) :
- `pageFooterBar` :
  - `position: 'absolute'`
  - `bottom: mmToPoints(10)`
  - `left: mmToPoints(options.marginInner)`
  - `right: mmToPoints(options.marginOuter)`
  - `flexDirection: 'row'`
  - `justifyContent: 'space-between'`
  - `alignItems: 'flex-end'` (ou `center` selon rendu typographique)
- `pageFooterContextInline` :
  - mêmes attributs typo que `pageFooterContext`, mais **sans** `position/bottom/left`
- `pageNumberInlineText` :
  - mêmes attributs typo que `pageNumberInline`, mais **sans** `position/bottom/right`
  - `textAlign: 'right'`

### 2) `src/utils/pdfPageComponents.tsx`
Objectif : modifier `PageFooter` pour utiliser le conteneur fixe.

Remplacer le return actuel par :

- `<View fixed style={styles.pageFooterBar}>`
  - `<Text style={styles.pageFooterContextInline}>{contextText}</Text>`
  - `<Text style={styles.pageNumberInlineText} render={({pageNumber}) => formatPageNumber(pageNumber, options.pageNumberStyle)} />`
- `</View>`

Important :
- **Pas de `render` sur `<View>`**.
- Le `<Text>` du numéro **n’a plus** `fixed` nécessairement (le conteneur est fixed), mais on peut le laisser sans danger ; je le laisserai généralement “simple” (non fixed) pour limiter les bizarreries.

## Vérifications à faire après correctif (acceptance)
1) Export PDF Pro → sur plusieurs pages “Texte” (y compris celles générées par pagination manuelle) :
   - Contexte en bas à gauche
   - Numéro en bas à droite
2) Vérifier 2-3 pages au milieu (là où tu voyais le numéro au centre) : le numéro doit être collé au footer.
3) Vérifier les pages Haïku/Fable + Index : le footer doit rester stable et ne pas remonter au milieu.

## Option bonus (si on veut gérer “odd/even” parfaitement)
Si tu veux que les marges internes/externes s’inversent selon page paire/impair (style livre), on peut ajouter une version “odd” et “even” du conteneur et n’en afficher qu’une selon `pageNumber` via deux `<Text render>` qui renvoient `''` côté non concerné. Mais je ne le fais pas tant que tu ne le demandes pas explicitement, pour éviter tout risque Yoga supplémentaire.
