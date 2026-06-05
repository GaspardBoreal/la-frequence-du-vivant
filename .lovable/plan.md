# Correctif proposé

## Constat
Pour **BORDEAUX / Patio végétalisé ISEG**, il y a bien eu de la mesure le **04/06/2026** :
- les **4 espèces de Victor** existent en base dans `marcheur_observations`
- elles sont **dans le rayon 50 m**
- elles sont aussi visibles par les RPC unifiées (`get_exploration_species_count` et `get_exploration_species_timeline`)

Le problème n’est donc **pas la collecte**, ni l’ingestion, ni le rayon.

## Problème exact
La vue **Marches** et la vue **Synthèse > Taxons observés** ne lisent pas encore la même source pour la courbe **Pouls du vivant** :
- **Marches** s’appuie sur le pool unifié et voit bien les 4 espèces du 04/06
- le graphe **Pouls du vivant** reconstruit encore son historique à partir des **snapshots passés en props**
- ce hook historique ne prend pas les `marcheur_observations` récentes comme source primaire

Conséquence :
- l’inventaire peut afficher **10 espèces**
- mais le graphe reste bloqué sur **6 espèces depuis le 29/05**
- cela donne l’impression fausse qu’aucune mesure récente n’a eu lieu

## Ce que je vais corriger
1. **Brancher le graphe “Pouls du vivant” sur la RPC unifiée `get_exploration_species_timeline`**
   - même source que le comptage officiel
   - inclusion des observations du 04/06
   - cohérence stricte entre Marches, Carte, Synthèse et Taxons

2. **Retirer la logique locale snapshot-only dans le hook d’évolution**
   - le calcul actuel à partir de `snapshots` restera seulement en fallback si nécessaire
   - la vue principale utilisera la timeline SQL canonique

3. **Aligner les en-têtes et les totaux affichés**
   - `10 espèces découvertes depuis le 29 mai 2026`
   - apparition d’un point/barre au **04/06/2026** avec les **4 nouvelles espèces**

4. **Ajouter une garde anti-régression**
   - si le graphe et le compteur divergent à nouveau, log diagnostic explicite
   - invalidation/reload cohérent quand `marcheur_observations` ou `biodiversity_snapshots` changent

## Résultat attendu
Après correction, pour cet événement :
- **Marches** : 10 espèces
- **Synthèse / Pouls du vivant** : 10 espèces
- courbe sur **2 dates** au minimum : **29/05** puis **04/06**
- les 4 espèces de Victor ne disparaissent plus de la narration temporelle

## Détail technique
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/community/exploration/BiodiversityEvolutionChart.tsx`
- `src/hooks/useBiodiversityEvolution.ts`
- éventuellement un nouveau hook dédié à `get_exploration_species_timeline`

Je validerai ensuite directement sur cette exploration que le **04/06/2026** ressort bien dans le graphe et que les chiffres sont identiques partout.