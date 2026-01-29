
## Diagnostic (ce qui se passe vraiment)

### Symptôme
Quand vous cliquez sur **“Générer l’EPUB (49 textes)”**, l’UI affiche “Erreur lors de la génération de l’EPUB”.

### Cause racine confirmée (console)
L’erreur réelle est :

- `TypeError: path.extname is not a function`
- provenance : `epub-gen-memory` → dépendance `ejs` → usage de `path` (Node.js)

Vite “externalise” les modules Node (`path`, `fs`) côté navigateur. Du coup, **`epub-gen-memory` n’est pas exécuté avec le bon build** dans le browser, et plante pendant la compilation des templates.

### Do I know what the issue is?
Oui. **Ce n’est pas un bug de données/chapitres**, c’est un **mauvais artefact importé** : on importe l’entrée Node (`dist/lib`) au lieu du **bundle browser** prévu par la lib.

---

## Solution “wahou” (robuste, rapide, sans backend) : charger le bundle navigateur de `epub-gen-memory`

`epub-gen-memory` fournit explicitement un bundle navigateur :  
`node_modules/epub-gen-memory/dist/bundle.min.js` (UMD), qui embarque ses propres dépendances (dont les shims nécessaires).  
C’est précisément ce qu’il faut utiliser dans Vite pour éviter `path.extname`.

### Pourquoi c’est “wahou”
- Zéro polyfill Vite à maintenir (pas de “vite-plugin-node-polyfills”, pas de bricolage fragile)
- On conserve le système **Ultra-design** (presets, CSS, TOC, cover)
- On garde la génération **client-side** (rapide, pas de latence serveur, pas de quotas edge)
- On peut ensuite ajouter une “version premium” server-side si un jour on veut embarquer des images privées ou faire du KDP strict, mais on débloque tout de suite l’usage.

---

## Changements à implémenter

### 1) Modifier `src/utils/epubExportUtils.ts` (correction principale)
Objectif : **ne plus importer `epub-gen-memory` (entrée Node)**, mais charger **le bundle browser** au moment du clic export.

- Remplacer :
  - `await import('epub-gen-memory')`
- Par :
  - `await import('epub-gen-memory/dist/bundle.min.js')`

#### Important : gérer correctement le type de retour
Le bundle browser configure `JSZip` pour retourner un **Blob** (la lib expose `type='blob'` dans `fetchable-browser.js`).

Donc :
- si le résultat est un `Blob` → on le renvoie directement
- sinon fallback compatible (ArrayBuffer/Buffer) → conversion en `Blob`

> Cela rend l’export robuste quel que soit l’environnement, sans hypothèses fragiles.

---

### 2) Améliorer le logging pour éviter une nouvelle boucle d’erreurs (petit mais décisif)
Dans `exportToEpub` / `downloadEpub`, ajouter des logs techniques plus “diagnostics” :
- quelle entrée a été chargée (`bundle.min.js`)
- type du résultat (`Blob`, `ArrayBuffer`, etc.)
- taille du fichier généré

Cela permet de trancher instantanément si un autre point (cover, fonts, images) bloque.

---

### 3) (Bonus cohérence UI) Harmoniser le “compteur de lieux”
Actuellement, dans `EpubExportPanel.tsx`, le badge “lieux” utilise :
- `new Set(textes.map(t => t.marche_nom || t.marche_ville)).size`

Ce mélange “nom de marche” et “ville” peut recréer de la confusion (ex: 32 au lieu de 16).
Le générateur de métadonnées a déjà été corrigé pour compter seulement `marche_ville`.

Plan :
- aligner le badge “lieux” sur la même logique (ville uniquement)
- optionnel : afficher aussi un badge “marches” séparé si vous voulez les deux métriques (utile éditorialement)

---

## Étapes de validation (test end-to-end)

1. Aller sur `/admin/exportations`
2. Vérifier que les filtres donnent bien **49 textes**
3. Cliquer “Générer l’EPUB”
4. Résultat attendu :
   - plus de warning `path/fs externalized`
   - plus d’erreur `path.extname`
   - téléchargement d’un `.epub` fonctionnel
5. Ouvrir l’EPUB dans Apple Books / Calibre pour valider :
   - styles (CSS)
   - table des matières
   - ordre des chapitres
   - métadonnées (titre/sous-titre/description)

---

## Plan B (si vous voulez une garantie “KDP-proof” et images privées)
Si, après ce fix, on veut aller encore plus loin (et c’est cohérent avec l’ambition) :
- déplacer la génération EPUB dans une **Edge Function** (serveur), avec :
  - récupération d’assets privés Supabase Storage (cover/images)
  - packaging ultra-strict EPUB3
  - validation structurelle

Mais dans l’état, **ce n’est pas nécessaire pour corriger l’erreur bloquante actuelle**.

---

## Fichiers concernés

- À modifier (obligatoire)
  - `src/utils/epubExportUtils.ts`

- À modifier (recommandé, cohérence UX)
  - `src/components/admin/EpubExportPanel.tsx`

Aucune migration Supabase nécessaire. Aucune dépendance à installer.

---

## Risques / points d’attention

- `bundle.min.js` est un gros fichier : on le garde en **dynamic import** (déjà le cas) pour ne pas alourdir le chargement initial de l’admin.
- Si vous activez cover/fonts/images via URL non publiques : la lib peut échouer au fetch. On pourra alors :
  - soit activer `ignoreFailedDownloads`
  - soit passer la cover en data URL
  - soit basculer en Edge Function (Plan B)

