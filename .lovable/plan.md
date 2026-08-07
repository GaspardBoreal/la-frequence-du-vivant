# Reconstituer les prélèvements de sol — Jardin Monde DEVIAT

## Ce que le PDF du 29/07 nous rend (A → E, certifié)

Le registre imprimé page 15 contient la totalité des valeurs. Elles sont réinjectables telles quelles :

| Repère | Lieu | GPS | Structure | Texture | pH | Vie du sol |
|---|---|---|---|---|---|---|
| A | Sous les marronniers | 45.41365 / 0.00961 | — | Limoneux (test du boudin) | — | — |
| B | Projet « Massif Méditerranéen » | 45.41369 / 0.00924 | Grumeleuse (test de la bêche) | — | 8.0 très basique (bandelette) | 1 ver · vers, galeries, taupinières, racines actives, matière organique |
| C | Potager | 45.41382 / 0.00900 | — | Limoneux (boudin) | — | 1 ver · vers de terre |
| D | Projet « Mare » | 45.41373 / 0.00870 | — | — | — | — |
| E | Petit verger | 45.41395 / 0.00884 | — | Limoneux (boudin) | — | — |

Contrôles de cohérence à respecter après réinjection : 5 géolocalisés, structure 1/5, texture 3/5, pH moyen 8.0, indice de vie 28/100, 1,0 ver par bêchée. Si l'écran affiche autre chose, la réinjection est fausse.

## Le ou les prélèvements manquants : retrouvés

Les photos de terrain n'ont pas été touchées par l'incident, et **chaque photo porte le repère, le lieu et le test auquel elle appartient**. Elles révèlent non pas un mais **deux prélèvements postérieurs au PDF** :

- **F · Massif Grenadier** — 3 photos test du boudin (texture), 5 photos bandelette (pH), 2 photos bêche vivante (vie du sol).
- **G · L'Onde Courte** — 4 photos boudin (texture), 5 photos test de stabilité (structure), 2 photos bandelette (pH), 1 photo bêche vivante (vie du sol).

Le PDF datant du 29 juillet ne les connaît pas. Nous savons donc avec certitude **quels tests ont été faits, où et sur quel repère** ; en revanche le **résultat chiffré** de F et G (forme du boudin, couleur de la bandelette, nombre de vers) n'existe plus qu'**en image**. Leurs coordonnées GPS sont également perdues.

Deux façons de les récupérer, à combiner :

1. **Relecture des photos** : je vous affiche les clichés par test, vous relisez la bandelette et la forme du boudin, je saisis. C'est la seule voie qui redonne des valeurs justes.
2. **Repositionnement sur la carte** : F et G sont nommés d'après des ouvrages du site (Massif Grenadier, L'Onde Courte). On replace les deux carottes au centre de ces ouvrages, à corriger d'un glisser si besoin.

## Déroulé proposé

1. Réinjecter A → E exactement comme au registre du 29/07 (lieux, GPS, tests, résultats, pH, vie du sol).
2. Recréer F « Massif Grenadier » et G « L'Onde Courte » avec leurs tests déjà attestés par les photos, laissés « à compléter » pour les valeurs.
3. Ouvrir les photos de F et G ensemble et saisir les lectures ; replacer les deux points sur la carte.
4. Vérifier la fiche à l'écran contre le PDF (5 repères d'origine intacts) puis réimprimer un carnet V2 daté, qui devient la nouvelle preuve papier.

Rien n'est écrasé en aveugle : les valeurs sont posées dans un ordre où chaque étape est vérifiable au regard du PDF.

## Détails techniques

- Écriture unique via `upsert_propriete_soil` sur `propriete_soil_diagnostics` (propriété `664670f9-…`), tableau `samples` reconstruit avec `structure_test`/`structure_result`, `texture_test`/`texture_result`, `ph_test`/`ph_value`, `life_test`/`life_signs`/`worm_count`, `location`, `lat`, `lng`.
- Mapping registre → modèle : bêche → `beche`/`grumeleuse` ; boudin → `boudin`/`limon` ; bandelette → `bandelette`/`8.0` ; bêche vivante → `beche_vivante` avec `worm_count` et `life_signs` (`vers`, `galeries`, `taupinieres`, `racines`, `matiere_organique`).
- F et G : `id`/`label` conformes aux `sample_id` déjà présents dans `propriete_test_medias` (sinon les photos se détachent des carottes). `sample_location` repris de la table médias.
- La vérification des totaux s'appuie sur `buildSoilReading` (3/5 texture, 1/5 structure, pH 8.0, indice 28/100) avant / après ajout de F et G.

## Reste à traiter plus tard

La section « Que cela n'arrive plus jamais » (historique, verrou anti-effacement, écriture par un seul écran) est mise de côté à votre demande — à reprendre juste après la reconstitution.

## Une question

Vous parliez de 6 prélèvements : les photos en montrent 7 (A à G). Faut-il reconstituer les sept, ou l'un des deux derniers (F ou G) est-il un doublon à écarter ?
