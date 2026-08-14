# Synthèse des méthodes d'analyse de sol — phase « J'analyse »

Aucune modification de code n'est requise. La synthèse est livrée directement ci-dessous.

## Tableau des méthodes gérées dans `TabAnalyze`

| Catégorie | Nom | Résumé simple | Livrable |
|---|---|---|---|
| **État du terrain** | État du terrain | Diagnostic historique : remanié, remblai, décaissement, naturel (en place) ou inconnu. | `terrain_status` (remanie / remblai / decaissement / naturel / inconnu) |
| **Prélèvements** | Géolocalisation des prélèvements | Jusqu'à 10 points de prélèvement nommés, repositionnables sur la carte, renommables et supprimables. | Tableau `samples` avec `lat`, `lng`, `label`, `location` |
| **Structure** | Test de la bêche | Observer comment une motte de ~20 cm se rompt au choc ou à la main : bloc massif, agrégats nets ou effondrement. | `structure_result` par prélèvement : `compacte`, `grumeleuse`, `particulaire` |
| **Structure** | Test de stabilité | Immerger un agrégat sec dans un bocal d'eau claire et observer la tenue, les bulles d'air ou la dispersion. | `structure_result` complémentaire + `structure_test` |
| **Texture** | Test du boudin | Humidifier un échantillon, rouler un boudin de 1 cm et le courber : droit, lune ou cercle. | `texture_result` par prélèvement : `sable`, `limon`, `argile` + `boudin_form` |
| **Texture** | Test de sédimentation (optionnel) | Bocal au tiers de terre + deux tiers d'eau, agitation, repos 24 h, lecture des strates sable/limon/argile. | `texture_result` confirmé par `sedimentation` |
| **Acidité** | Bandelette / kit colorimétrique | Mélanger terre humide + eau déminéralisée, tremper la bandelette, comparer au nuancier. | `ph_value` par prélèvement + `ph_test` = `bandelette` |
| **Acidité** | pHmètre électronique (optionnel) | Sonde calibrée insérée dans une boue de terre humide ; lecture chiffrée plus précise. | `ph_value` par prélèvement + `ph_test` = `phmetre` |
| **Vie du sol** | Test de la bêche vivante | Emietter un bloc 20 × 20 × 20 cm et compter les vers, puis relever les indices de vie. | `life_signs[]` + `worm_count` par prélèvement |
| **Vie du sol** | Test du vinaigre | Déposer quelques gouttes de vinaigre blanc sur une motte sèche et observer l'effervescence (CO₂ = calcaire actif). | `life_signs` incluant `effervescence` |
| **Vie du sol** | Test du sachet de thé (optionnel) | Enterrer un sachet de thé/coton à 8 cm pendant 6 à 8 semaines et évaluer la vitesse de dégradation. | `life_test` = `sachet` + observation qualitative |
| **Synthèse** | Synthèse du diagnostic | Rédaction libre par l'utilisateur qui consolide les observations de l'étape. | `synthesis` (texte libre) |

## Points clés de l'architecture

- Chaque prélèvement peut porter ses propres résultats (`structure_result`, `texture_result`, `ph_value`, `life_signs`, `worm_count`) et sa propre preuve photo (via `TestMediaBadge` / `TestMediaRegistry`).
- Les valeurs globales du site (`structure`, `texture`, `boudin_shape`, `ph`, `life_signs`) sont **dérivées** des prélèvements par agrégation (`dominantResult`, `dominantTexture`, `aggregatePh`, `aggregateLife`), et non saisies manuellement.
- Les résultats alimentent ensuite la phase « J'identifie » via `soilLiteFromState()` et les 4 curseurs de concordance sol/flore (`soilFloraScales.ts`).