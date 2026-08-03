# Rendre l'ICG du Chantier explicable, espèce par espèce

Aujourd'hui l'écran Chantier affiche deux nombres (avant / après) et un tableau de 8 lignes. Le calcul existe et est juste, mais rien ne dit **d'où vient le score** ni **quelle espèce le tire vers le haut ou vers le bas**. On ajoute deux niveaux de lecture, sans changer le barème.

## 1. « Comment ce chiffre est né » — la chaîne du calcul en 4 marches

Un bandeau dépliable sous le grand chiffre ICG, qui rejoue la mécanique réelle :

```text
Espèces lues dans le lot  →  Bio-indicatrices reconnues  →  8 pôles écologiques notés
   (n observations)            (n espèces du référentiel)     (flore vs sol : niveau 1-3)
                                                          →  Points /16  →  ICG /100
```

Chaque marche est cliquable et montre son contenu réel : la liste des espèces retenues, celles reconnues comme bio-indicatrices (et surtout **celles ignorées faute de fiche**, aujourd'hui invisibles), puis le tableau existant. On explicite la règle en une phrase : même niveau = 2 pts, un cran d'écart = 1, deux crans = 0, une ligne sans donnée sol = 0 mais toujours comptée sur 16.

## 2. « Le jury des espèces » — qui fait monter, qui fait descendre

Le cœur de la demande. Pour chaque bio-indicatrice du lot, on recalcule l'ICG **sans elle** (retrait à un, sur le même sol) : la différence est sa contribution nette signée.

- Colonne verte « Elles confirment la lecture du sol » : contribution > 0.
- Colonne rouge « Elles contredisent la lecture du sol » : contribution < 0.
- Colonne neutre « Sans effet sur le score » : contribution nulle (l'espèce est reconnue mais ne déplace aucun niveau).

Chaque ligne : vignette photo, nom français puis nom scientifique (via le résolveur FR déjà en place), les pôles sur lesquels elle pèse (Frais, Argile, Riche, Acide…), et le gain en points d'ICG. Un clic ouvre la ligne du tableau correspondante et surligne l'espèce sur la carte du lot.

Une phrase de synthèse en haut : « 5 espèces confirment la lecture du sol, 3 la contredisent — ce sont surtout Ortie dioïque et Rumex qui font baisser le score sur le pôle Richesse. »

## 3. Le même jury en mode Avant / Après

- Sur l'état **avant** : le jury des espèces en place.
- Sur l'état **projeté** : le jury des espèces du scénario, en signalant celles dont l'apport corrige un pôle discordant (« ajoutée pour redresser le pôle Acide ») et celles qui, au contraire, dégradent un pôle déjà en accord.
- Sur l'état **constaté** : jury des observations postérieures aux travaux.

Le bloc Δ existant garde ses 3 « drivers » par pôle ; le jury répond à la question complémentaire : *quelle plante* est derrière ce driver.

## 4. Reprise dans le rapport imprimé

Une page « Comprendre le score » dans le rapport complet : la chaîne en 4 marches, le tableau des 8 lignes déjà présent, et les deux colonnes du jury (confirment / contredisent) avec les contributions. Le rapport simple garde une version condensée : la phrase de synthèse + les 3 espèces les plus influentes dans chaque sens.

## Détails techniques

- `src/lib/chantierIcg.ts` : nouvelle fonction `speciesIcgContributions(pool, soil)` — retrait à un sur `observedIndicatorIds`, réutilise `computeConcordanceDetail` (aucun barème dupliqué), retourne `{ plant, poles[], deltaPoints, deltaIcg, direction }`.
- Ajout d'un `unmatchedSpecies` retourné par l'appariement pour afficher les espèces sans fiche indicatrice.
- Nouveaux composants `IcgPipeline.tsx` (chaîne en 4 marches) et `SpeciesJury.tsx` (colonnes), placés dans `src/components/propriete/chantier/`, branchés dans `ChantierOverlay.tsx` sous `IcgDeltaHero`.
- Noms d'espèces via `useWaypointFrenchNames` / `<SpeciesName />`, vignettes via `resolveSpeciesThumbs` (déjà utilisé à l'impression).
- Ajout d'une section dans `ChantierRapportLayout.tsx`, tokens `--ds-ink` / verdicts existants, aucune nouvelle couleur en dur.
- Aucun changement de base de données.
