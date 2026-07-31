## Intention

Chaque prélèvement porte 4 dimensions (Structure, Texture, pH, Vie du sol). Aujourd'hui la vignette n'affiche que du texte partiel ("Texture Limoneux") : impossible de voir d'un coup d'œil ce qui a été fait, ce qui manque, et s'il existe des preuves photo.

Proposition : un **« Sceau des 4 strates »** — une signature graphique unique, déclinée à 3 échelles (marqueur carte, vignette popup, tableau/registre), qui code la complétude par couleur, remplissage et micro-glyphe.

## Le langage visuel

Un jeu de 4 pictos SVG dessinés main, un par bloc, réutilisant les accents déjà définis dans `soilTestCatalog.ts` :

```text
Structure  motte fracturée   brun terre   24 52% 42%
Texture    boudin roulé      ocre         38 68% 46%
pH         goutte + bandelette violet     286 38% 48%
Vie        ver + feuille     vert         142 46% 34%
```

Trois états par picto :
- **Renseigné** : glyphe plein, couleur du bloc, petite valeur courte dessous (« Limoneux », « 6.4 », « 12 vers »)
- **Test noté sans résultat** : glyphe en contour couleur, pointillé
- **Non fait** : glyphe gris ardoise, opacité 35 %, tiret

Un anneau de complétude entoure les 4 pictos : 4 arcs de quart, remplis dans la couleur du bloc dès qu'il est renseigné → on lit « 3/4 » sans compter.

## Les 3 échelles

**1. Marqueur carte (`SoilSamplesLayer` – `makeCoreIcon`)**
La pastille passe de 40 à 44 px : autour du disque avec la lettre, 4 arcs de quart colorés (un par bloc renseigné), l'arc restant en pointillé gris. L'arc pH existant est conservé mais déplacé en anneau extérieur fin. Ajout d'une micro-pastille photo (compteur) en bas à droite quand des preuves existent. Lisible même dézoomé, puisque c'est de la couleur, pas du texte.

**2. Vignette popup (la copie d'écran)**
Réorganisée :
- Titre `Prélèvement A` + lieu (inchangé)
- **Bandeau de 4 pictos** cliquables, chacun ouvrant la fiche carotte directement sur sa strate (via `focusSampleCore` + strate active)
- Ligne de complétude : `3 strates sur 4 · 5 preuves`
- Bouton `Ouvrir la fiche carotte ›` (inchangé)
- Note de glissement (inchangée)

**3. Registre / tableau (`SamplesRegisterTable`, `AnalyzeSummary`, `SoilLinkBlock`)**
La même bande de 4 pictos en version compacte (18 px, sans libellés) remplace les colonnes textuelles redondantes → une ligne = une carotte lisible instantanément, et l'écart entre prélèvements saute aux yeux.

## Interaction

- Survol d'un picto : tooltip `pH · pHmètre · 6,4 — Légèrement acide`
- Clic sur un picto : ouvre la fiche carotte **sur la strate concernée** (le drawer sait déjà naviguer par strate)
- Clic sur un picto non renseigné : ouvre la fiche sur la strate vide, prête à saisir → transforme le manque en invitation

## Détails techniques

- Nouveau `src/components/propriete/analyze/sample/strataGlyphs.tsx` : les 4 pictos SVG + `strataState(sample)` qui calcule pour chaque bloc `{ done, testLabel, shortValue, color }` à partir de `SoilSample` (aucun champ BDD nouveau — tout est déjà dans `structure_result`, `texture_result`, `ph_value`, `life_signs`/`worm_count`).
- Nouveau `StrataSeal.tsx` : composant React unique avec `size="marker" | "popup" | "row"`, utilisé partout.
- Version chaîne HTML des glyphes pour le `divIcon` Leaflet (même géométrie, exportée en `strataSealHtml()`), afin de garder une seule source de vérité.
- Couleurs prises dans `SOIL_BLOCKS[...].accent` (HSL tokens existants), pas de couleur en dur.
- Le compteur de preuves réutilise le hook média déjà employé par la fiche carotte ; s'il n'est pas disponible côté carte, la pastille photo est simplement masquée.
- Impression : la bande de pictos est incluse dans `SoilSamplesPlan` / `AnalyzeSummary` en variante monochrome + trame, pour rester lisible en N&B.

## Fichiers touchés

- Créés : `strataGlyphs.tsx`, `StrataSeal.tsx`
- Modifiés : `SoilSamplesLayer.tsx` (icône + popup), `SamplesMapBlock.tsx`, `SamplesRegisterTable.tsx`, `AnalyzeSummary.tsx`, `SoilLinkBlock.tsx`, `sampleDrawerStore.ts` (ouverture ciblée sur une strate)
