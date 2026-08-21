# Poste de contrôle → Alertes : même contrôle qu'à l'accueil, règles visibles

## Ce qui change pour le lecteur

1. **« Alertes » devient l'onglet ouvert par défaut** dans le Journal de livraison. On arrive sur ce qui cloche, le Journal complet reste à un clic (l'URL `?vue=journal` reste partageable, et les liens existants vers `?vue=alertes` continuent de fonctionner).

2. **Le même jugement qu'à l'accueil.** Aujourd'hui l'accueil marque « à vérifier » une lecture qui sort du domaine physique, qui sort de la plage de terrain, ou qui contredit une autre profondeur de la même sonde (le fameux 1 % à 5 cm face à 27 % à 30 cm). Les deux premiers cas existent déjà côté Alertes, **le troisième non** : une huitième veille « Incohérence entre profondeurs » est ajoutée, et les libellés des trois cas sont repris mot pour mot du moteur de l'accueil. Conséquence concrète : une valeur repérée « à vérifier » sur la page d'accueil se retrouve systématiquement dans les Alertes, avec sa date, sa durée et son lien vers l'Observatoire.

3. **Les règles de détection deviennent consultables d'un coup d'œil.** Aujourd'hui l'explication est cachée derrière un petit « ? » sur chaque pastille. On ajoute sous la constellation un bouton **« Comment sont détectées les alertes »** qui déplie une grille de fiches — une par veille — avec : le nom, la gravité, ce que la règle cherche, le seuil réellement appliqué sur la période, ce qu'elle ignore volontairement, et une micro-courbe qui dessine la signature recherchée (pic, marche, plateau, trou…). Les « ? » existants restent pour la consultation à l'unité.

## Détail technique

- `src/lib/iot/anomalies.ts` : nouvelle entrée `incoherence` dans `RegleKey` / `REGLES` (gravité « surveiller », signature en marche). Dans `analyserAnomalies`, regroupement des mesures par sonde + horodatage, puis appel de `jugerLecture` (moteur de l'accueil) pour produire les événements `hors_domaine`, `hors_usage` et `incoherence` à partir d'une source unique — le motif affiché est celui renvoyé par le verdict. Regroupement des occurrences consécutives et exclusion des sondes en maintenance inchangés.
- `src/lib/iot/fiabilite.ts` : inchangé sur le fond ; il devient la référence partagée (accueil + alertes). Import croisé déjà en place (`fiabilite` lit `DOMAINE`/`USAGE` d'`anomalies`), on garde ce sens pour éviter tout cycle.
- `src/components/iot/alerts/RuleConstellation.tsx` : 8e pastille + icône, grille `lg:grid-cols-8`.
- `src/components/iot/alerts/RulesLegend.tsx` (nouveau) : grille dépliable de `RuleCard`, repliée par défaut, mémorisée dans l'URL (`?regles=1`) pour rester partageable.
- `src/components/iot/alerts/AlertsPanel.tsx` : insertion de la légende sous la constellation, compteur « 8 règles appliquées ».
- `src/components/iot/DeliveryJournal.tsx` : `vue` par défaut = `alertes`, `?vue=journal` explicite.

Aucune modification de base de données : tout est calculé à la lecture, sur la période déjà chargée.
