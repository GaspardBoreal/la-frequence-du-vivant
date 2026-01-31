
## Objectif (urgence 10 minutes)
Éliminer définitivement le crash `unsupported number: -1.3e+21` (Yoga overflow) en procédant **comme un diagnostic pro** : isoler la section fautive en 1–2 exports maximum, puis appliquer des garde-fous qui empêchent ce type de crash de revenir (même avec du contenu futur).

---

## Constat basé sur les logs + code actuel
- Le crash remonte à `renderText()` dans `@react-pdf/renderer` → c’est typiquement un calcul de position **énorme négatif** (souvent dû à une mesure de texte “impossible”).
- Aujourd’hui, on a déjà :
  - segmentation agressive des textes (`splitIntoParagraphs`, `chunkLongText`)
  - limitation des listes de pages (`formatPageList`)
  - suppression des `wrap={false}` les plus évidents
- Donc il reste très probablement un des cas suivants :
  1) **Dot leaders en flex (View flex:1)** qui se retrouvent avec **espace négatif** quand les 2 textes autour “mangent” toute la largeur (TOC + index).
  2) **Texte non cassable** (un “mot” très long / token / suite de caractères sans espaces) dans un titre, un lieu, un type, un keyword, ou un séparateur décoratif.
  3) Un **texte détecté comme haïku** mais qui produit trop de lignes (overflow vertical dans `HaikuBlock`).

Le problème : sans instrumentation, on ne sait pas **quel bloc précis** déclenche le crash, donc on tourne en rond.

---

## Plan d’action “Debug pro” (séquencé pour tenir en 10 min)

### Phase 1 — Isoler la section fautive (2–3 minutes)
**But : obtenir un verdict immédiat : “c’est un texte”, “c’est la TOC”, “c’est quel index”.**

1) Ajouter dans `src/components/admin/PdfExportPanel.tsx` un **mode Debug PDF** (UI) avec :
   - 3 cases à cocher visibles :
     - “Inclure TOC”
     - “Inclure Index Lieux”
     - “Inclure Index Œuvres”
     - “Inclure Index Thématique”
   - + un bouton “Exporter (debug auto)” qui lance une séquence d’essais :
     - Essai A : export SANS TOC, SANS index (contenu seul)
     - Essai B : A + TOC
     - Essai C : B + Index Lieux
     - Essai D : C + Index Œuvres
     - Essai E : D + Index Thématique
   - À chaque essai : `console.info("[PDF DEBUG] Step X ...")`
   - Dès qu’un essai échoue : toast “Crash dans : <section>” + arrêt (on a le coupable).

2) (Optionnel mais très utile) Si Essai A échoue (contenu seul), ajouter un **binaire sur la liste de textes** (binary search) :
   - Essai sur moitié des textes, puis quart, etc.
   - Objectif : identifier en < 1 minute **l’ID + titre** du texte qui casse.
   - Toast final : “Texte fautif : <titre> (id …)”.

Résultat attendu : on sait exactement ce qui casse au lieu de supposer.

---

### Phase 2 — Fix “structurel” sur la cause la plus probable (dot leaders) (4–5 minutes)
**But : empêcher les largeurs négatives en flex rows (cause classique de gros translate négatifs).**

Dans `src/utils/pdfStyleGenerator.ts` :
1) Remplacer les dot leaders “flex: 1” par une approche “safe” :
   - dot leader avec **largeur fixe** (ex: `width: mmToPoints(25)`), `flexGrow: 0`, `flexShrink: 0`
   - et forcer les textes gauche/droite à rester dans des limites :
     - côté gauche : `flexGrow: 1`, `flexShrink: 1`, `maxWidth` calculé (ou valeur fixe raisonnable)
     - côté droite (pages) : `maxWidth` déjà présent, on conserve

À appliquer à :
- `tocDotLeader`
- `indexLieuxDotLeader`
- `indexKeywordDotLeader`
- `indexGenreDotLeader` (déjà minWidth, mais on sécurise de la même façon)

Dans `src/utils/pdfPageComponents.tsx` :
2) Simplifier les lignes TOC / Index en évitant les “rows imbriquées” inutiles :
   - 1 ligne = 1 `View` row = `[gauche] [dot leader safe] [droite]`

Résultat attendu : plus aucun cas où Yoga calcule une largeur négative et part en coordonnées astronomiques.

---

### Phase 3 — Garde-fous anti “mots non cassables” (2–3 minutes)
**But : même si demain un mot-clé contient un token absurde, ça ne doit plus pouvoir casser la mise en page.**

Dans `src/utils/pdfExportUtils.ts` ou `src/utils/pdfPageComponents.tsx` (au choix, mais centralisé) :
1) Ajouter une fonction utilitaire du type `softBreakLongTokens(text)` :
   - détecte toute séquence non-espace > N (ex: 25–30 chars)
   - insère des “soft breaks” (`\u200B`) toutes les 10–15 chars
2) Appliquer cette fonction à **toutes les chaînes “UI”** rendues dans PDF :
   - titres (`texte.titre`)
   - `marche.nom`, `typeEntry.type`
   - `keyword.name`, `categoryEntry.category`
   - éventuellement aussi aux paragraphes (après sanitize), mais en priorité sur TOC/Index

Résultat attendu : plus jamais de “1 mot énorme” qui explose les calculs de largeur.

---

### Phase 4 — Sécuriser HaikuBlock (1 minute)
Dans `src/utils/pdfPageComponents.tsx` :
- Ajouter un garde-fou :
  - si `lines.length > 8` OU `content.length > 600`, alors **ne pas utiliser** `HaikuBlock`
  - fallback : rendu “TextePage” normal (flow multi-pages)

Résultat attendu : si un texte est mal typé “haïku” mais contient trop de contenu, il ne peut plus crasher.

---

## Validation (très concret, immédiat)
1) Lancer “Exporter (debug auto)”
2) Vérifier :
   - l’étape fautive est identifiée si crash
   - après corrections (dot leaders + soft breaks + haiku guard), **toutes les étapes passent**
3) Export complet : TOC + 3 index + colophon → PDF généré.

---

## Fichiers concernés
- `src/components/admin/PdfExportPanel.tsx`
  - Ajout du mode Debug + toggles index + séquence d’essais
- `src/utils/pdfStyleGenerator.ts`
  - Dot leaders “safe” (largeur fixe + contraintes)
- `src/utils/pdfPageComponents.tsx`
  - Simplification TOC/Index rows + Haiku guard + application softBreakLongTokens
- (Optionnel) `src/utils/pdfExportUtils.ts`
  - si on préfère centraliser `softBreakLongTokens` ici

---

## Pourquoi cette approche résout “définitivement”
- On ne “devine” plus : on **isole** la section fautive de façon reproductible.
- On supprime les patterns les plus instables de Yoga dans react-pdf :
  - flex dot leader qui peut tomber à largeur négative
  - tokens non cassables
  - haiku rendu sur une page sans filet de sécurité
- Et on ajoute un outillage de debug réutilisable (pour les futurs travaux), au lieu de bricoler à l’aveugle.
