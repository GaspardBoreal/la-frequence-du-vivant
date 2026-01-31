

## Re-constat (d’après tes captures)
- Le **texte de contexte** (Partie/Marche) est désormais **correctement en bas à gauche**.
- Le **numéro de page** est **toujours “dans le flux” au milieu de la page** (aligné avec une ligne du texte), au lieu d’être ancré au bas de page.

Donc: **le positionnement “absolute/bottom” est bien respecté pour un `<Text>` statique, mais pas pour le `<Text>` qui utilise `render={({ pageNumber }) => ...}`**.

## Do I know what the issue is?
Oui. Dans `@react-pdf/renderer` (Yoga), un `<Text>` avec `render` peut:
1) **perdre son ancrage** (absolute / contraintes du parent) lors des passes de layout, et
2) se retrouver **replacé au point d’insertion** dans le flux de la page.
De plus, dans notre précédente tentative, le `<Text render>` était **enfant d’un `<View fixed>`**; or on observe dans certaines versions de react-pdf que **le `render` de `<Text>` se comporte mieux lorsqu’il est “directement au niveau Page”** et surtout lorsqu’on lui donne **une contrainte de largeur explicite**.

## Problème précis (ce qui cause “le 7/8 au milieu”)
Le `<Text>` du numéro de page:
- utilise `render`
- n’a pas de “boîte” suffisamment contrainte (largeur explicite) pour que Yoga l’ancre correctement
- et/ou le nesting dans un `<View>` “fixed+absolute” déclenche le bug: le nœud est recalculé puis réinséré dans le flux.

Résultat: **le style d’ancrage n’est pas appliqué** et le numéro apparaît au milieu.

---

## Solution proposée (robuste et minimaliste)
### Objectif
Forcer le numéro de page à:
- être **direct child** de la `<Page>` (via le composant `PageFooter` qui retourne des `<Text>` “plats”, sans `<View>` conteneur),
- et avoir une **largeur explicite** + `textAlign: 'right'` pour que Yoga ne puisse pas “lâcher” l’ancrage.

### Concrètement
1) **On arrête d’utiliser** le conteneur `pageFooterBar` pour le numéro (on peut le garder dans les styles, mais on ne s’en sert plus pour le `render`).
2) `PageFooter` redevient un fragment:
   - `<Text fixed ...>` pour le contexte (Partie/Marche) : déjà stable
   - `<Text fixed render ...>` pour le numéro : avec un style “largeur explicite” (pas uniquement `right:`)

---

## Modifs de code (2 fichiers)
### A) `src/utils/pdfStyleGenerator.ts`
Ajouter un style dédié au numéro dynamique, par exemple:
- `pageNumberRenderFixedRight`

Caractéristiques importantes:
- `position: 'absolute'`
- `bottom: mmToPoints(10)` (comme le contexte)
- `left: mmToPoints(options.marginInner)`
- **`width: (dimensions.width - left - right)` en NUMÉRIQUE** (pas `right:`)
- `textAlign: 'right'`
- typo identique à l’actuel numéro (fontFamily/fontSize/color)

Pourquoi `width` plutôt que `right`:
- Ça évite un cas Yoga où `right` + `render` peut être ignoré lors des passes de layout.
- Le pattern react-pdf le plus fiable pour les numéros dynamiques est “boîte pleine largeur + textAlign”.

### B) `src/utils/pdfPageComponents.tsx`
Modifier `PageFooter` pour ne **plus** encapsuler le numéro dans un `<View>`:
- Conserver la règle de contexte:
  - `const contextText = partieName || marcheName || ''`
- Retourner:
  - un `<Text fixed style={styles.pageFooterContext}>...</Text>` (ou `pageFooterContextInline` si tu préfères; mais `pageFooterContext` marche déjà)
  - un `<Text fixed style={styles.pageNumberRenderFixedRight} render={({pageNumber}) => ...} />`

Important:
- Le `<Text render>` sera maintenant “à plat” (direct sibling), plus de nesting dans `View`.
- `fixed` est gardé sur le `<Text render>` pour stabiliser son comportement.

---

## Vérifications (acceptance)
1) Export PDF Pro sur plusieurs pages (celles de tes screenshots notamment):
   - contexte toujours en bas à gauche
   - numéro **collé en bas à droite**, au même niveau vertical que le contexte
2) Vérifier au moins:
   - une page de texte “normal”
   - une page issue de la pagination manuelle (milieu de long texte)
   - une page d’index / TOC (si activés), pour s’assurer que le numéro reste stable partout

---

## Fallback si (et seulement si) ce fix ne suffit pas
Si Yoga continue à “détacher” le `render` malgré tout (rare mais possible selon versions), on activera une stratégie 100% déterministe pour les pages manuelles:
- Calculer les numéros de pages “à la génération” (on sait exactement combien de `<Page>` on crée)
- Passer `pageNumber` en prop et afficher un `<Text>` statique (sans `render`) sur ces pages-là

Je ne le fais pas tout de suite car la solution “width explicite + Text direct child + fixed” est généralement suffisante et moins invasive.

