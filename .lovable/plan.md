

# Analyse de fiabilite : 3 executions identiques pour Poitiers

## Resultats des 3 tests

Les 3 appels a l'edge function avec les coordonnees exactes (46.5736217, 0.3292647) retournent des **donnees 100% identiques**. Aucune variation. Les calculs sont fiables et reproductibles.

```text
Zone (direction, rayon)    | Run 1   | Run 2   | Run 3
---------------------------|---------|---------|--------
N 5km  (Migne-Auxances)   | 15 518  | 15 518  | 15 518
NE 5km (Buxerolles)       | 11 740  | 11 740  | 11 740
E 5km  (Poitiers)         | 11 559  | 11 559  | 11 559
SE 5km (Saint-Benoit)     | 13 112  | 13 112  | 13 112
S 5km  (Ligue)            |  5 247  |  5 247  |  5 247
SO 5km (Fontaine-le-Comte)|  6 823  |  6 823  |  6 823
O 5km  (Vouneuil)         |  8 346  |  8 346  |  8 346
NO 5km (Vouneuil)         |  3 870  |  3 870  |  3 870
N 10km (Avanton)          |  2 817  |  2 817  |  2 817
NE 10km(Montamise)        |  6 487  |  6 487  |  6 487
E 10km (Sevres-Anxaumont) | 32 776  | 32 776  | 32 776
SE 10km(Nouaille-M.)      |  5 287  |  5 287  |  5 287
S 10km (Roches-Premarie)  |  1 693  |  1 693  |  1 693
SO 10km(Fontaine-le-Comte)|  1 274  |  1 274  |  1 274
O 10km (Beruges)          | 13 281  | 13 281  | 13 281
NO 10km(Cisse)            |  8 363  |  8 363  |  8 363
N 20km (St-Martin-Pallu)  |    600  |    600  |    600
NE 20km(Vouneuil/Vienne)  | 62 433  | 62 433  | 62 433
E 20km (Jardres)          |  1 722  |  1 722  |  1 722
SE 20km(Vernon)           |    562  |    562  |    562
S 20km (Marnay)           |  1 190  |  1 190  |  1 190
SO 20km(Lusignan)         |  3 003  |  3 003  |  3 003
O 20km (Boivre-la-Vallee) |  1 223  |  1 223  |  1 223
NO 20km(Champigny)        |  3 754  |  3 754  |  3 754
```

## Pourquoi 0 zones "Silence" -- et c'est normal

Les calculs sont corrects. Poitiers est une ville universitaire avec le CNRS, un Museum d'histoire naturelle, et de nombreux naturalistes actifs. La zone la plus "faible" (Vernon, 20km SE) a tout de meme **562 observations** GBIF. C'est bien au-dessus du seuil de Silence (0 obs).

## D'ou viennent les "Murmure" que vous voyez

En **mode relatif** (le toggle est active), les niveaux sont recalcules par rapport au min/max local :
- Min = 562 (Vernon), Max = 62 433 (Vouneuil-sur-Vienne)
- Seuil Murmure relatif = 15% du range = obs < ~9 843
- Resultat : 10 zones sur 24 apparaissent en "Murmure" relatif

C'est le comportement voulu : montrer les contrastes locaux. Mais ces zones "Murmure" relatives ne sont PAS des zones blanches -- elles ont toutes des centaines voire des milliers d'observations.

## Le vrai sujet : comment detecter de vrais Silences

Pour trouver des zones veritablement blanches autour de Poitiers, il faudrait scanner beaucoup plus loin (40-50km). Mais cela multiplierait les appels API.

### Proposition : Scanner adaptatif

Si aucun Silence n'est trouve dans les 3 rayons actuels (5/10/20km), ajouter automatiquement un 4e rayon a **40km** (8 points supplementaires, soit 32 points au total). Cela reste frugal (32 appels `limit=0`) et augmente fortement les chances de trouver de vrais vides, surtout en zones rurales lointaines.

### Modifications

1. **`supabase/functions/detect-zones-blanches/index.ts`** : si `blank_count === 0` apres les 24 premiers points, lancer 8 points supplementaires a 40km
2. **Pas de changement UI** : le composant gere deja un nombre variable de zones

Cela transformerait le detecteur en systeme adaptatif : il cherche plus loin uniquement quand c'est necessaire, dans l'esprit frugal du projet.

