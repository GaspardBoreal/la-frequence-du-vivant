# Méthodes d'analyse de sol — colonne « Méthode » + fiche téléchargeable

Objectif : rendre publiquement lisible l'intégralité du protocole d'analyse de sol de Fréquence Jardin, sur la page `/etude-de-sol` déjà en ligne, et le rendre emportable en Markdown et en PDF.

## 1. Enrichir le tableau public

Le tableau actuel a 3 colonnes utiles (Catégorie, Nom, Résumé, Livrable). On ajoute le **geste de terrain** — la méthode pas à pas — pour chacune des 12 entrées, repris mot pour mot des catalogues internes (`structureTests`, `textureTests`, `phTests`, `lifeTests`).

Présentation retenue :
- Le tableau desktop gagne une colonne **« Méthode »** qui affiche les étapes numérotées (1 → 4), compactes.
- Sur mobile, les étapes s'affichent dans la carte, sous le résumé, en liste numérotée.
- Les repères chiffrés déjà présents dans le code sont exposés : teneur en argile selon la forme du boudin (droit ≈ 10 %, lune 10-30 %, cercle > 30 %), seuil d'alerte des vers de terre (< 5 par bêchée), échelle pH 4 → 9 et ses 6 classes, durée du sachet de thé (6-8 semaines).
- Deux encarts de référence ajoutés en fin de section : **les 8 indices de vie** (vers, galeries, racines, micro-faune, mycélium, matière organique, odeur d'humus, effervescence) et **les 3 classes de vie** (discrète, installée, foisonnante).

## 2. Fiche téléchargeable « Méthodes d'analyse de sol »

Un bloc de téléchargement en tête de la section Méthodes, calqué sur celui de la fiche Fréquence Jardin :

- **Copier en Markdown** (presse-papier)
- **Télécharger le .md**
- **Télécharger le PDF**

Contenu de la fiche (identique dans les deux formats) :
1. Couverture : titre, baseline, date de génération, URL canonique.
2. Le cadre : à quoi sert le diagnostic, ce qui est mesuré, ce qui ne l'est pas (pas d'analyse laboratoire, pas de dosage NPK chiffré).
3. Le protocole complet, catégorie par catégorie : nom, type, matériel, étapes, résultats possibles, livrable.
4. Les tables de lecture : classes de structure, classes de texture, classes de pH, indices et classes de vie.
5. La synthèse : les quatre curseurs (eau, texture, nutrition, pH) et le verdict de site.
6. Ours : association, contact, mention de la méthode D.S. comme source d'inspiration du carnet.

## Détails techniques

- `src/content/etudeDeSolMethodes.ts` : chaque entrée de `PUBLIC_METHODS` gagne `steps: string[]`, `material?: string`, `results?: string[]` et `benchmarks?: string[]`. Les valeurs sont recopiées depuis les catalogues internes pour éviter d'importer du code d'application dans une page publique, mais restent identiques mot pour mot. Ajout des tables de lecture (`STRUCTURE_CLASSES`, `TEXTURE_CLASSES`, `PH_CLASSES_PUBLIC`, `LIFE_SIGNS_PUBLIC`, `LIFE_CLASSES_PUBLIC`) et d'une fonction `methodesToMarkdown()` sur le modèle de `ficheToMarkdown()`.
- `src/components/etude-sol/MethodesSection.tsx` : colonne « Méthode » (liste ordonnée compacte) + repères sous le livrable ; cartes mobiles enrichies ; barre de téléchargement ; deux encarts de référence.
- `src/components/etude-sol/MethodesPdf.tsx` (nouveau) : document `@react-pdf/renderer` réutilisant la charte de `FrequenceJardinPdf.tsx` (crème/vert forêt, Helvetica, pied de page paginé), chargé en import dynamique pour ne pas alourdir le bundle de la page.
- `public/llms.txt` : la ligne `/etude-de-sol` mentionne la disponibilité de la fiche en Markdown et en PDF.
- Vérification : typecheck, puis rendu Playwright de la section desktop et mobile, et contrôle visuel page par page du PDF généré.

## Hors périmètre

- Pas de changement dans l'application privée (étape « J'analyse » inchangée).
- Pas de nouvelle route : tout reste sur `/etude-de-sol`.
