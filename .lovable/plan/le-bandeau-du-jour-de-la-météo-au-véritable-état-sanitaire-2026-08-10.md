# Le bandeau du jour : de la météo au véritable état sanitaire

Aujourd'hui le bandeau « Baromètre du jour » n'affiche qu'un score climatique (20/100, « Le jardin respire ») alors que la météo locale est indisponible sur cette propriété — les trois pastilles Température / Pluie / Humidité sont vides. Il ne dit rien des maladies réellement suivies.

Ce que contiennent les fiches de Jardin Monde DEVIAT aujourd'hui (vérifié en base) :
- 3 consultations ouvertes, toutes « En observation », aucune en traitement, aucune rétablie
- sujets : Groseiller 1, Groseiller 2, Groseiller 3 — organes Feuille et Rameau
- sévérités 3, 3 et 5
- pathogènes suspectés : Anthracnose du groseillier (x2), Oïdium (x2), Dessèchement de rameaux, Lichens
- 18 gestes de soin proposés, **0 réalisé**
- 9 photos de suivi, toutes du 9 août — aucune revisite depuis

## Le nouveau bandeau : « L'état sanitaire du jardin »

Une seule bande, trois temps de lecture.

### 1. Le pouls du lieu (ligne de gauche, remplace l'aiguille météo)
Un anneau de santé qui agrège ce qui est vraiment saisi :
- nombre de sujets suivis et leur poids de sévérité (moyenne + le sujet le plus atteint)
- part des consultations rétablies sur l'ensemble ouvert depuis toujours
- phrase de verdict : « 3 sujets sous surveillance, aucun en traitement » / « Le jardin se rétablit » / « Deux foyers s'aggravent »

### 2. Les quatre compteurs cliniques (cœur du bandeau)
Chaque compteur est cliquable et filtre la liste des consultations en dessous.
- **Sous surveillance** — statut « En observation » (3 aujourd'hui)
- **En traitement** — statut « En traitement » (0)
- **Rétablis** — statut « Rétabli », avec le délai moyen de guérison quand il existe
- **Sujets perdus** — statut « Perdu »

### 3. Les trois signaux d'action (ligne du bas, ce qui manque le plus)
- **Gestes en attente** : 0 / 18 réalisés → barre de progression + « aucun geste engagé depuis l'ouverture »
- **Foyers récurrents** : les pathogènes cités par plusieurs consultations (Anthracnose du groseillier · 2 sujets, Oïdium · 2 sujets) — c'est le vrai signal d'alerte du lieu
- **Dernière revisite** : jours écoulés depuis la dernière photo de suivi, avec relance « photographier à nouveau pour mesurer l'évolution »

### La météo devient secondaire, pas supprimée
Le climat des trente derniers jours et les fenêtres de vigilance du mois restent utiles, mais rétrogradés :
- une ligne discrète repliable « Le climat pousse-t-il à la maladie ? » avec le score, les trois valeurs et les raisons
- les fenêtres de vigilance du mois sont **croisées avec les pathogènes déjà suspectés sur place** : celles qui correspondent à un foyer existant passent en tête et en couleur d'alerte (ici Anthracnose et Oïdium), les autres restent en veille discrète
- quand la météo est indisponible, la ligne le dit franchement au lieu d'afficher un faux 20/100

## Détails techniques

- Nouveau `src/lib/gardenHealth.ts` : agrégation pure à partir des consultations, hypothèses, actions et médias (compteurs par statut, sévérité moyenne/max, ratio de gestes faits, pathogènes récurrents, jours depuis la dernière photo, délai moyen de guérison).
- Nouveau hook `useCliniqueOverview(proprieteId)` dans `useGardenClinique.ts` : une requête agrégée des hypothèses/actions/médias de toutes les consultations de la propriété (aujourd'hui seul le détail par consultation est chargé).
- `RiskBarometer.tsx` devient `HealthBanner.tsx` ; le contenu météo actuel est extrait dans un sous-bloc repliable `ClimatePressureRow`, alimenté par `computeGardenRisk` inchangé.
- `TabClinique.tsx` : rend le nouveau bandeau, reçoit l'état de filtre des compteurs et l'applique aux listes « Consultations en cours » / « Rétablies ».
- Tokens sémantiques `--ds-*` uniquement, animations Motion sur les compteurs et l'anneau, vocabulaire « Observations » conservé.
