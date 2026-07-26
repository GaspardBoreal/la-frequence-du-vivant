## Objectif

Coupler le Widget 3 (Structure du sol) aux prélèvements posés sur la carte du Widget 2 : pour chaque point A→E, l'utilisateur choisit **le test réalisé** (A — Test de la bêche / B — Test de stabilité) puis **le résultat observé** (Compacte / Grumeleuse / Très meuble (particulaire)). Le bloc devient un vrai protocole guidé, avec vidéos et synthèse.

## Nouvelle anatomie du Widget 3

```text
┌─ 3 · Étape 2 · Structure du sol ─────────────────────────────┐
│  Hero morphé sur la DOMINANTE (auto-calculée)                │
│                                                              │
│  ① Ce que vous devez faire  (3 étapes numérotées, 1 phrase)   │
│                                                              │
│  ② Les deux tests — 2 cartes côte à côte                     │
│     ┌ A · Test de la bêche ┐  ┌ B · Test de stabilité ┐      │
│     │ schéma SVG animé     │  │ schéma SVG animé      │      │
│     │ 3 puces protocole    │  │ 3 puces protocole     │      │
│     │ ▶ 3 slots vidéo      │  │ ▶ 3 slots vidéo       │      │
│                                                              │
│  ③ Résultats par prélèvement (une ligne par point A→E)       │
│     [A] sous le tilleul   Test: (A)(B)   Résultat: 3 pictos  │
│     [B] allée nord        Test: (A)(B)   Résultat: 3 pictos  │
│                                                              │
│  ④ Synthèse : barre de répartition + dominante + couverture  │
└──────────────────────────────────────────────────────────────┘
```

### ① Consigne
Encart doré : « Sur chacun de vos prélèvements, réalisez un des deux tests ci-dessous, puis notez le résultat observé. » + 3 pastilles : *Prélever → Tester → Noter*.

### ② Les deux tests
Deux cartes « fiche protocole » à la même grammaire visuelle que le reste du parcours (cream / forest / ruban doré) :
- **A · Test de la bêche** — prélever un bloc de terre à la bêche (20 cm), le laisser tomber d'environ 1 m ou l'ouvrir à la main, lire comment la motte se rompt. Schéma SVG dédié (bêche + bloc qui se fragmente).
- **B · Test de stabilité (bocal / slake test)** — immerger un agrégat sec dans un bocal d'eau claire, observer 10 min : bulles, tenue ou effondrement. Schéma SVG dédié (bocal + agrégat + bulles animées).
- Chaque carte porte **3 emplacements vidéo** : le tableau de liens est dans le code, vide au départ ; les boutons ▶ ne s'affichent que si une URL est renseignée (je les brancherai dès que tu me donnes les liens). Ouverture en lightbox si YouTube/Vimeo, sinon nouvel onglet.

### ③ Résultats par prélèvement
Une ligne par prélèvement existant (les mêmes A→E que le Widget 2, avec leur libellé d'emplacement, en lecture seule) :
- segmenté **Test A / Test B**,
- trois pictos de résultat réutilisant les icônes actuelles + le tooltip riche déjà en place (Compacte / Grumeleuse / Très meuble (particulaire)),
- état visuel « à compléter » (pointillés) → « complété » (anneau vert + coche),
- ligne survolée = point correspondant mis en avant (léger halo) pour garder le lien mental avec la carte.
- Si aucun prélèvement n'est encore posé : message d'appel vers le Widget 2 avec bouton de remontée.

### ④ Synthèse
- Barre de répartition proportionnelle (3 segments colorés) + compteur « n/N prélèvements renseignés ».
- **Dominante auto-calculée** = résultat majoritaire (égalité → mention « sol contrasté », résolution déterministe compacte < grumeleuse < très meuble pour l'affichage) ; c'est elle qui pilote le hero et qui remplace le choix global manuel.
- Phrase de lecture agronomique adaptée à la dominante et à l'hétérogénéité constatée.
- Répartition des tests utilisés (x bêche / y stabilité).

### Vocabulaire
Le 3ᵉ libellé devient « Très meuble (particulaire) » partout dans ce parcours (pictos, tooltip, hero, synthèse).

## Détails techniques

- **Aucune migration.** Les prélèvements sont déjà stockés en JSONB dans `propriete_soil_diagnostics.samples` ; j'y ajoute deux champs par échantillon : `structure_test` (`beche` | `stabilite`) et `structure_result` (`compacte` | `grumeleuse` | `particulaire`). L'auto-save debounce existant les persiste tel quel.
- `SoilSample` (dans `usePropertySoil.ts`) étendu avec ces deux champs optionnels ; `updateSample` est déjà générique, rien à changer côté persistance.
- Le champ global `structure` reste écrit en base, mais **dérivé** de la dominante (compat ascendante avec la synthèse et les exports existants) — plus de sélection manuelle.
- `StructureBlock.tsx` réécrit en composeur ; nouveaux fichiers : `StructureProtocolCard.tsx` (fiche test + slots vidéo), `StructureTestPictos.tsx` (2 schémas SVG bêche / bocal), `StructureSampleRow.tsx` (ligne prélèvement), `StructureResultsSummary.tsx` (synthèse), `structureTests.ts` (données protocole + tableau de liens vidéo à remplir).
- Réutilisation de `StructureChoiceTooltip`, `SoilPictos`, `StructureCrossSection` (hero piloté par la dominante), `AnalyzeCard`.
- Le compteur d'avancement de `TabAnalyze.tsx` (bloc 3) compte désormais « renseigné » quand au moins un prélèvement a test + résultat.
- Responsive : cartes protocole en 2 colonnes desktop / empilées mobile ; lignes de résultats en grille qui passe en 2 niveaux sur mobile ; tooltips conservent l'alignement anti-débordement déjà corrigé.
