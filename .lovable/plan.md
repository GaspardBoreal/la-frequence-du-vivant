## Objectif

Ajouter une nouvelle page **« Propriété »** dans le Cahier complet (mode d'impression « J'observe + Portrait »), insérée entre le **Sommaire visuel** et la première page **Diagnostic étape 1 (J'observe)**. Elle reprend, sur **une seule page A4**, l'intégralité des informations visibles dans **Portrait → Cadastre**.

## Contenu de la page (single A4, portrait)

Organisation en 3 bandes verticales, sur fond crème du carnet, filet doré latéral cohérent avec la charte :

**1. En-tête (~15 % de la page)**

- Eyebrow « Fiche propriété · Cadastre »
- Titre serif : nom de la propriété
- Sous-titre : ville · code postal
- Filet doré + date d'édition à droite

**2. Bloc principal (~55 %) — deux colonnes**

- **Colonne gauche « Identité & Cadastre »**
  - Adresse complète (rue, CP, ville)
  - Communes couvertes (chips)
  - Liste des parcelles : Section · N° · Préfixe · Contenance (m²) — présentée en tableau serré 2 colonnes si > 8 lignes
  - Total surface cadastrale cumulée + nombre de parcelles
- **Colonne droite « Repères géographiques »**
  - Coordonnées GPS du centroïde (format DMS + décimal)
  - Altitude si disponible
  - Mini-carte statique **snapshot** du cadastre (rendue via `html2canvas` sur la carte plein-écran au moment du print, ou fallback SVG des contours de parcelles depuis `geometry`) — cadre doré, ~70 mm × 55 mm
  - Légende sobre : « Contours cadastraux · centroïde »

**3. Pied de bloc (~30 %) — Station météo & QR**

- Encart « Station météo de référence » (nom, distance km, altitude, coordonnées, source badge)
- Rayons d'observation configurés (chips : 250 m / 500 m / 1 km…) si présents dans les préférences
- QR code discret vers la page publique + footer paginé standard

## Design

- Palette crème/or/vert forêt existante (`portrait-print-*` tokens)
- Typo : Cormorant Garamond italique (titre), Helvetica (data)
- Numérotation à l'ancienne « 03 » en marge, cohérente avec les autres planches
- Aucun scroll : dimensionnement strict A4 avec `page-break-after: always` et grille CSS calibrée pour tenir même avec 30+ parcelles (bascule auto en 3 colonnes de parcelles au-delà de 20)

## Insertion dans le flux du cahier combiné

Ordre final du PDF « Cahier complet » :

1. Couverture Hero
2. Sommaire visuel
3. **Propriété (nouveau) ← ici**
4. Diagnostic étape 1 — J'observe (pages 1 & 2)
5. Planches photo
6. Citation
7. Colophon

## Fichiers touchés (frontend uniquement)

- **Nouveau** `src/components/propriete/print/PropertyPrintPage.tsx` — la page A4 elle-même (reçoit `nom`, `adresse`, `ville`, `codePostal`, `parcelles`, `center`, `nearestStation`)
- `src/components/propriete/print/CombinedPrintLayout.tsx` — accepte les props propriété + station, compose `<PropertyPrintPage/>` dans un nouveau slot `insertAfterToc`
- `src/components/propriete/portrait/PortraitPrintLayout.tsx` — ajoute la prop `insertAfterToc?: ReactNode` rendue juste après le Sommaire visuel, et incrémente `totalPages` en conséquence
- `src/index.css` — styles `.property-print-page` (grille, filet doré, tableau parcelles, mini-carte cadre)
- `src/pages/ProprieteEspace.tsx` (ou le composant qui monte `CombinedPrintLayout`) — passe `parcelles`, `center`, `adresse`, `ville`, `codePostal`, `nearestStation` déjà disponibles via `useProprieteParcelles` + `useNearestStations`

## Points ouverts / questions

1. **Mini-carte** : un rendu SVG des contours de parcelles à partir de `geometry` (léger, fiable à l'impression, sans dépendance),
2. Faut-il aussi afficher le **paysagiste / propriétaire** rattachés (si présents en base) 