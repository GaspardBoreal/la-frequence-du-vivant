# Page publique « L'étude de sol vivante » — Enjeux · Méthodes · Cas Deviat

Une page publique, sans connexion, qui raconte pourquoi l'étude de sol est décisive, expose les méthodes que nous outillons, et prouve le tout par un cas réel documenté : le Jardin Monde DEVIAT.

Route : `/etude-de-sol` (indexable, canonique, JSON-LD Article).

## Structure — trois menus dans une barre sticky

```text
[ Enjeux ]   [ Synthèse des méthodes ]   [ Cas concret · Jardin Monde DEVIAT ]        [ Nous contacter ]
```

Navigation par ancres, barre sticky sous le hero, indicateur de section active au scroll, retour haut de page sur mobile.

### 0. Hero
Titre plein écran, fond dégradé terre/forêt, une phrase-manifeste, deux boutons (Découvrir la méthode / Nous contacter) et une ligne de trois chiffres réels tirés du cas Deviat (7 prélèvements, 45 preuves photo, pH moyen 7,8).

### 1. Enjeux
Quatre cartes « pourquoi le sol décide de tout » : l'eau (infiltration, réserve), la vie (fertilité auto-entretenue), la structure (racines et tassement), la palette (planter juste du premier coup). Puis un bandeau « ce qu'on perd sans diagnostic » (replantations, arrosage, chlorose) en contraste, et la promesse : une méthode de terrain reproductible, sans laboratoire, traçable.

### 2. Synthèse des méthodes
Le tableau de référence des 12 méthodes de la phase « J'analyse », groupées par catégorie avec chips de couleur (Terrain, Prélèvements, Structure, Texture, Acidité, Vie du sol, Synthèse). Chaque ligne : Catégorie / Nom / Résumé simple / Livrable.

| Catégorie | Nom | Résumé simple | Livrable |
|---|---|---|---|
| État du terrain | État du terrain | Remanié, remblai, décaissement, naturel ou inconnu : l'histoire du site conditionne toute la lecture. | Statut du terrain qualifié |
| Prélèvements | Carottes géolocalisées | Jusqu'à 10 points nommés, posés sur la carte cadastrale, renommables et déplaçables. | Carte des prélèvements (GPS) |
| Structure | Test de la bêche | Une motte de 20 cm lâchée ou ouverte à la main : bloc massif, agrégats nets ou effondrement en grains. | Compacte / Grumeleuse / Très meuble |
| Structure | Test de stabilité | Un agrégat sec immergé dans l'eau claire : bulles, tenue ou dispersion en 10 minutes. | Confirmation de la classe de structure |
| Texture | Test du boudin | Terre humide roulée en boudin de 1 cm puis courbée : droit, en lune ou en cercle. | Sableux / Limoneux / Argileux + teneur en argile |
| Texture | Test de sédimentation (option) | Bocal de terre et d'eau, 24 h de repos, lecture des strates sable/limon/argile. | Classe de texture confirmée |
| Acidité | Bandelette / kit colorimétrique | Terre humide + eau déminéralisée, bandelette, comparaison au nuancier. | Valeur de pH par prélèvement |
| Acidité | pHmètre électronique (option) | Sonde calibrée dans une boue de terre : lecture chiffrée plus fine. | Valeur de pH précise |
| Vie du sol | Bêche vivante | Un bloc 20 × 20 × 20 cm émietté 5 min : comptage des vers et relevé des indices. | Nombre de vers + indices de vie |
| Vie du sol | Test du vinaigre | Quelques gouttes sur une motte sèche : l'effervescence révèle le calcaire actif. | Présence de calcaire actif |
| Vie du sol | Test du sachet de thé (option) | Un sachet enterré 6 à 8 semaines : la vitesse de dégradation mesure l'activité. | Indice d'activité biologique |
| Synthèse | Lecture d'ensemble | Agrégation automatique des prélèvements en quatre curseurs (eau, texture, nutrition, pH). | Verdict du site + carnet imprimable |

Sous le tableau, un bloc « ce que la méthode garantit » : preuve photo par test, valeurs par prélèvement jamais moyennées à l'aveugle, historique des versions, carnet PDF daté.

### 3. Cas concret · Jardin Monde DEVIAT
Récit en quatre temps, avec les vraies données du diagnostic clos le 24/07/2026 :

- **Le site** — sol naturel en place, 7 prélèvements dont 5 géolocalisés, carte des carottes.
- **Les mesures** — tuiles chiffrées : structure grumeleuse, texture limoneuse, pH moyen 7,8 (basique), indice de vie du sol, nombre de vers par bêchée.
- **Les preuves** — galerie des photos de terrain groupées par test (boudin 18, bandelette 10, bêche vivante 7, bêche 5, stabilité 5), en carrousel léger avec légende « repère · lieu · test ».
- **La synthèse** — le verdict du site en quatre curseurs et les conséquences concrètes sur la palette végétale (calcicoles favorisées, acidophiles écartées).

Encart « du terrain au carnet » : aperçu du PDF produit automatiquement.

### 4. CTA contact
Section pleine largeur en fin de page, plus un bouton permanent dans la barre sticky : bouton principal `mailto:contact@la-frequence-du-vivant.com` avec objet pré-rempli « Étude de sol — demande de contact », bouton secondaire vers `/marches-du-vivant/connexion`.

## Direction visuelle

Papier crème et vert forêt (tokens existants), typographie sérif pour les titres, accents ambre. Coupes de sol dessinées réutilisées depuis les composants existants (`TerrainCrossSection`, `TextureCrossSection`, `PhCrossSection`, `LifeCrossSection`) pour illustrer les catégories : c'est le signe visuel fort de la page. Apparitions au scroll, compteurs animés sur les chiffres, cartes en relief doux. Responsive : une colonne sur mobile, tableau des méthodes transformé en cartes empilées sous 768 px, menu d'ancres en scroll horizontal.

## Détails techniques

- Nouvelle page `src/pages/EtudeDeSolPublique.tsx` + sous-composants dans `src/components/etude-sol/` (Hero, EnjeuxSection, MethodesTable, CasDeviat, ContactCTA, StickyAnchorNav).
- Route publique ajoutée dans `src/App.tsx`, chargée via `lazyWithRetry`. Ajout dans `public/sitemap.xml` et `public/llms.txt`.
- SEO : `react-helmet-async` (title < 60, description < 160, og/twitter, canonical), un seul H1, JSON-LD `Article`.
- Contenu des méthodes : nouveau module `src/content/etudeDeSolMethodes.ts` dérivé des catalogues existants (`structureTests.ts`, `textureTests.ts`, `phTests.ts`, `lifeTests.ts`, `soilTestCatalog.ts`) — aucune duplication de logique, uniquement des libellés publics.
- Données du cas Deviat : les photos vivent dans le bucket privé `propriete-tests`, donc inaccessibles en public. Création d'une edge function publique `public-case-deviat` (service role, `verify_jwt = false`, propriété en dur, lecture seule) qui renvoie : agrégats du diagnostic (structure, texture, pH, vie, nombre de prélèvements) et URLs signées 1 h d'une sélection de photos par test. Aucun champ personnel n'est exposé.
- Réutilisation en lecture des agrégateurs existants côté client : `buildSoilReading`, `soilLiteFromState`, `buildTextureReading` — la page n'invente aucun chiffre.
- Aucune modification des écrans propriété, du registre de sol ou des flux d'écriture existants.
