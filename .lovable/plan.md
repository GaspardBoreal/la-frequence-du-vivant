## Objectif

Aligner le Widget 4 (Texture du sol) sur la logique déjà en place au Widget 3 (Structure) : un test + un résultat **par prélèvement** (A→E positionnés sur la carte du Widget 2), avec protocole illustré et synthèse.

## Contenu repris de la page 7 du document

Protocole du test du boudin :
1. Prélevez de la terre humidifiée
2. Façonnez un boudin (1 cm de diamètre)
3. Essayez de le courber doucement
4. Observez le résultat

Les 3 résultats (libellés exacts du carnet) :
- **Sable à sable limoneux** — modelage difficile ; boudin très grossier, ne tient pas ; ne colle pas, granuleux, ne salit pas les mains une fois sec
- **Limon sableux à limon moyen** — modelage possible ; petit boudin ou boudins colmatés ; peu collant, peu granuleux, salit les mains
- **Limon argileux à argiles** — modelage facile à très facile ; boudin bien dessiné, peut être mis en cercle ; collant, doux, ne salit pas ou peu les mains

Indice complémentaire (teneur en argile), proposé uniquement si un boudin a pu être formé :
- boudin **droit** ≈ 10 % d'argile
- boudin **en lune** ≈ 10–30 %
- boudin **en cercle** > 30 %

Second test : **Test de sédimentation** (optionnel, renforce le boudin) — fiche présentée avec protocole en attente + slots vidéo, sélectionnable comme méthode mais sans grille de résultats propre pour l'instant (le résultat saisi reste la classe de texture).

## Ce qui sera construit

1. `src/components/propriete/analyze/textureTests.ts` — modèle de données : `TextureTestId` (`boudin` | `sedimentation`), `TextureResultId` (`sable` | `limon` | `argile`), libellés longs/courts, protocoles pas-à-pas, slots `videos: []` (1 à 3 par test, à remplir plus tard), lecture agronomique par dominante, helper `dominantTexture()`.

2. `TexturePictos.tsx` — 3 pictos SVG partageant la même grammaire visuelle (un boudin de terre entre deux doigts) : boudin qui s'émiette / boudin cassé en tronçons / boudin plié en cercle. Plus 2 schémas animés de test (mains qui roulent le boudin ; éprouvette de sédimentation à 3 strates sable/limon/argile).

3. `TextureCrossSection.tsx` — hero animé qui morphe selon la dominante (grains libres → mélange feuilleté → masse plastique), avec verbe clé doré (« Fuit · granuleux », « Se casse · équilibré », « Se plie · retient »), sur le modèle de `StructureCrossSection`.

4. `TextureProtocolCard.tsx` + `TextureChoiceTooltip.tsx` — fiches des 2 tests (étapes numérotées, schéma, boutons ▶ masqués tant qu'aucune URL) et tooltip riche au survol des 3 résultats (puces sensorielles : modelage / tenue du boudin / toucher), avec le même système `align` + `clamp` que le Widget 3 pour éviter tout débordement.

5. `TextureSampleRow.tsx` — une ligne par prélèvement : pastille A/B/C…, rappel du lieu, choix du test (Boudin / Sédimentation), choix du résultat (3 pictos), et — si résultat ≠ sable — mini-sélecteur de forme du boudin (droit / lune / cercle) affichant l'estimation d'argile.

6. `TextureResultsSummary.tsx` — barres de répartition des 3 classes, dominante auto-calculée, mention « profil contrasté » en cas d'égalité, compteur par type de test, et lecture agronomique de la dominante.

7. `blocks/TextureBlock.tsx` — réécriture complète : bandeau consigne doré (Humidifier → Rouler → Courber → Noter), grille des 2 fiches-tests, liste des résultats par prélèvement (état vide avec lien d'ancre vers le bloc Prélèvements), puis synthèse. Le hero est piloté par la dominante.

## Données

Aucune migration : les prélèvements sont stockés en JSONB. On étend `SoilSample` dans `src/hooks/propriete/usePropertySoil.ts` avec `texture_test`, `texture_result` et `boudin_form` (`droit` | `lune` | `cercle`). Les champs globaux existants `texture` et `boudin_shape` sont maintenus en synchronisation automatique depuis la dominante (comme `structure` au Widget 3), donc la synthèse, l'export PDF et l'étape 3 « J'identifie » continuent de fonctionner sans changement.

`TabAnalyze.tsx` : le `TextureBlock` reçoit `samples` + `updateSample` ; le compteur « blocs renseignés » comptera un prélèvement texture complété.

## Ce qui ne change pas

Widgets 1, 2, 3, 5 (pH) et 6 (signes de vie) restent identiques. Pleine largeur conservée pour le bloc 4.
