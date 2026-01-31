
Contexte / ce qui se passe (factuel)
- L’erreur affichée “Erreur lors de la génération du PDF” est juste un message générique.
- Le vrai crash (console) est : `Error: unsupported number: -1.3139137915487854e+21` et il vient de `@react-pdf/renderer` pendant `renderText`.
- Ce type d’erreur est un crash du moteur de layout (Yoga) : il calcule une coordonnée de placement de texte complètement invalide (énorme valeur négative), généralement à cause d’un bloc impossible à mettre en page (overflow, contraintes incompatibles, pourcentages, éléments “unbreakable” trop grands, etc.).

Do I know what the issue is?
- Oui, je sais ce qui se passe côté moteur : Yoga “overflow” et part en valeurs astronomiques.
- Ce que je dois encore verrouiller à 100% : quel bloc exact déclenche ce débordement dans notre document.
- Mais il y a un coupable très probable dans notre code actuel : dans `IndexKeywordsPage`, chaque catégorie est rendue dans un `<View wrap={false}>` qui englobe potentiellement des dizaines de lignes. Si une catégorie ne tient pas sur une page, elle devient “impossible à poser”, et React-PDF peut crasher avec précisément ce type de “unsupported number”.
- Deux autres facteurs connus qui aggravent ce crash existent encore chez nous : des `maxWidth: 'xx%'` et des `height: '100%'` dans les styles, qui sont régulièrement cités comme déclencheurs/accélérateurs d’instabilité Yoga sur des documents longs.

Objectif
- Obtenir à nouveau un export PDF qui se génère systématiquement (zéro crash), puis réintroduire les optimisations typographiques sans valeurs/contraintes instables.
- Conserver la pagination dynamique (le but initial) et restaurer les index sans rendre le layout “impossible”.

Plan de correction (robuste, en 2 passes)

Phase A — Stopper le crash (fix structurel le plus probable)
1) Corriger `IndexKeywordsPage` pour autoriser les sauts de page à l’intérieur d’une catégorie
   - Fichier : `src/utils/pdfPageComponents.tsx`
   - Problème actuel :
     - `entries.map(... <View key={cIndex} wrap={false}> ... {categoryEntry.keywords.map(...)} </View>)`
     - Toute la catégorie est “insécable”, donc si elle dépasse une page => layout impossible.
   - Correction :
     - Supprimer `wrap={false}` sur le conteneur de catégorie.
     - Appliquer une stratégie “garder l’en-tête avec au moins la 1ère ligne” (comme on le fait déjà dans `IndexGenresPage`) :
       - `wrap={false}` sur un petit bloc qui contient :
         - le `CategoryBox`
         - + le premier keyword (si présent)
       - laisser le reste des keywords s’écouler normalement (sans `wrap={false}` global).
   - Résultat attendu :
     - Les catégories longues se répartissent sur plusieurs pages au lieu de faire planter Yoga.

2) Rendre les lignes “keyword” plus tolérantes aux contenus longs
   - Fichiers :
     - `src/utils/pdfStyleGenerator.ts` (styles index)
     - `src/utils/pdfPageComponents.tsx` (si besoin)
   - Ajustements :
     - Donner `flexShrink: 1` au texte de gauche (`indexKeywordName`) pour éviter qu’il force un overflow horizontal.
     - S’assurer que la colonne “pages” ne pousse pas le layout (garder `flexShrink: 0` côté pages).
     - Optionnel : tronquer proprement les libellés très longs (rare, mais protège Yoga).

Phase B — Retirer les patterns connus pour déclencher “unsupported number”
3) Éliminer les valeurs en pourcentage dans les styles PDF (remplacer par valeurs numériques en points)
   - Fichier : `src/utils/pdfStyleGenerator.ts`
   - À corriger :
     - `coverContent.maxWidth: '85%'`
     - `indexGenreLieu.maxWidth: '70%'`
   - Remplacement recommandé :
     - Calculer une largeur “safe” numérique à partir des dimensions de page déjà disponibles dans `generatePdfStyles()` :
       - Exemple : `const safeWidth = dimensions.width - mmToPoints(40);`
     - Utiliser `width: safeWidth` ou `maxWidth: safeWidth` (numérique) au lieu de `%`.
   - Bénéfice :
     - Yoga n’a plus à résoudre des % dans des contextes flex/wrap complexes sur 150+ pages.

4) Remplacer `height: '100%'` par des primitives flex stables
   - Fichier : `src/utils/pdfStyleGenerator.ts`
   - À corriger :
     - `fauxTitrePage.height: '100%'`
     - `colophonPage.height: '100%'`
   - Remplacement :
     - `flexGrow: 1` (ou `flex: 1`) + conserver `justifyContent` / `alignItems`.
   - Bénéfice :
     - évite des calculs de hauteur relatifs parfois instables dans Yoga.

5) Stabiliser la couverture (optionnel mais fortement conseillé)
   - Fichier : `src/utils/pdfStyleGenerator.ts`
   - On a actuellement des propriétés non standards pour React-PDF sur le titre :
     - `hyphens: 'none'` et `wordBreak: 'keep-all'` (injectées via `@ts-ignore`)
   - Même si ça “marche parfois”, c’est typiquement le genre de propriété qui peut produire des comportements imprévisibles sur certains contenus/polices.
   - Correction :
     - Retirer ces propriétés non supportées.
     - Assurer la non-coupure de mots d’une autre manière :
       - imposer une largeur numérique stable au conteneur (étape 3)
       - et si nécessaire, faire un “line break” manuel dans le titre sur des séparateurs sûrs (`:`, `—`, `-`) plutôt que de demander à Yoga une règle de césure non supportée.

6) Harmoniser la pagination de la table des matières (nettoyage)
   - Fichier : `src/utils/pdfPageComponents.tsx`
   - Aujourd’hui `TocPage` n’utilise pas `PageFooter`, mais un `<Text fixed style={styles.pageNumber} .../>` sans `left/right`.
   - Par prudence :
     - soit on remplace par `PageFooter` (avec option “preface” si on veut le style romain),
     - soit on fixe explicitement `left/right` pour éviter toute coordonnée implicite.
   - Ce point est moins suspect que l’index keywords, mais c’est une source de variabilité inutile.

Instrumentation (pour ne plus “deviner” si un autre bloc casse)
7) Améliorer le message d’erreur pour afficher la vraie cause
   - Fichier : `src/components/admin/PdfExportPanel.tsx`
   - Actuellement on masque tout derrière “Erreur lors de la génération du PDF”.
   - Amélioration :
     - Afficher un toast du type : “PDF: unsupported number (layout). Correction en cours.” + log détaillé console.
     - (Optionnel) Ajouter un mode diagnostic qui tente un export sans index thématique pour confirmer en 1 clic que c’est bien cette section.

Critères d’acceptation (ce que je validerai après implémentation)
- L’export PDF se génère sans erreur (plus de `unsupported number` dans la console).
- Le PDF produit s’ouvre et la numérotation de page monte jusqu’à la fin réelle (ex: ~157).
- L’index thématique :
  - peut s’étaler sur plusieurs pages
  - ne coupe pas de façon “sale” le cartouche de catégorie (au minimum, catégorie + 1er item restent ensemble)
- Aucune régression visuelle majeure sur couverture / faux-titre / colophon.

Fichiers concernés
- `src/utils/pdfPageComponents.tsx` (IndexKeywordsPage + éventuellement TocPage)
- `src/utils/pdfStyleGenerator.ts` (suppression % + suppression height: '100%' + ajustements flexShrink)
- `src/components/admin/PdfExportPanel.tsx` (meilleur reporting + éventuel mode diagnostic)

Risques / arbitrages
- En rendant l’index thématique “wrappable”, la catégorie pourra se retrouver sur 2+ pages (c’est le comportement normal et attendu pour un index volumineux).
- Si on retire `wordBreak/hyphens` sur la couverture, il faudra éventuellement contrôler les retours à la ligne du titre via largeur numérique et/ou retours manuels sur séparateurs, pour préserver l’intention artistique (sans demander au moteur des propriétés non supportées).

Ordre d’exécution recommandé
1) Fix `IndexKeywordsPage` (wrap)
2) Retirer % + height:'100%'
3) Nettoyage TocPage (pagination homogène)
4) Ajustements couverture (hyphens/wordBreak)
5) Amélioration message d’erreur / mode diagnostic
