
Objectif : supprimer définitivement le faux `Tous (0)` et rendre le bloc contributeurs fiable pour tous les événements, y compris ceux dont les snapshots biodiversité historiques n’embarquent pas les `attributions`.

Constat vérifié sur “La transhumance…”
- L’exploration `48450295-ac38-4a80-bc24-6e828779a07f` a bien des participants : `2` entrées dans `marche_participations`.
- Les `biodiversity_snapshots` de cette exploration contiennent bien des espèces, mais `0 attribution` exploitable.
- Les `marcheur_observations` sont aussi à `0` pour cette exploration.
- Donc le filtre actuel de `SpeciesExplorer` n’a aucune donnée source à afficher, même si l’événement a bien des contributeurs humains.

Cause racine
- `SpeciesExplorer` compte uniquement `species[].attributions[].observerName`.
- Cela fonctionne pour les événements dont les snapshots sont enrichis.
- Cela échoue pour les événements historiques ou partiellement collectés : participants présents, mais aucune attribution dans `species_data`.
- Le composant affiche alors `Tous (0)`, ce qui est faux du point de vue événementiel et trompeur côté UX.

Correction robuste proposée

1. Séparer deux notions aujourd’hui mélangées
- `Contributeurs biodiversité` = personnes réellement reliées à des taxons observés, donc filtrables.
- `Participants de l’événement` = personnes présentes / contributrices au parcours, même si aucune attribution taxonomique n’est disponible.
- Le bug vient du fait qu’on affiche un filtre taxonomique avec une sémantique “participants événement”.

2. Créer une résolution unifiée des contributeurs pour les vues biodiversité
- Introduire un resolver/hook partagé qui construit :
  - `filterableContributors` depuis `species.attributions`
  - `fallbackEventContributors` depuis :
    - `get_exploration_participants(...)` pour les participants communauté
    - `exploration_marcheurs` pour l’équipe / crew
- Déduplication par nom normalisé / identifiant stable.

3. Faire évoluer `SpeciesExplorer` pour gérer 3 états
- Cas A : au moins 1 contributeur biodiversité
  - garder le dropdown actif et le vrai filtrage par espèce.
- Cas B : 0 contributeur biodiversité mais N participants événement
  - ne plus afficher `Tous (0)`
  - afficher à la place un état élégant du type :
    - `Participants (N)` ou
    - dropdown désactivé + aide “Aucune attribution taxonomique disponible pour filtrer les espèces sur cet événement”.
- Cas C : aucune donnée
  - masquer complètement ce contrôle.

4. Enrichir `EventBiodiversityTab` avec un fallback événementiel
- Continuer à agréger les espèces depuis `biodiversity_snapshots`.
- En parallèle, charger les contributeurs exploration (participants + crew).
- Passer ce contexte à `SpeciesExplorer` pour qu’il sache quoi afficher même si les snapshots n’ont pas d’attributions.
- Ne jamais attribuer artificiellement toutes les espèces à tous les participants : ce serait faux scientifiquement.

5. Appliquer la logique à toutes les vues utilisant ce moteur
- `src/components/community/EventBiodiversityTab.tsx`
- `src/components/biodiversity/SpeciesExplorer.tsx`
- Vérification de compatibilité sur :
  - `src/components/community/MarcheDetailModal.tsx`
  - `src/components/open-data/BioDivSubSection.tsx`
- Objectif : aucune vue ne doit plus montrer un `0` trompeur quand il existe au moins des participants événement.

Option recommandée pour une cohérence complète des événements historiques
- Ajouter ensuite un backfill ciblé des anciens `biodiversity_snapshots` sans `attributions`.
- Cela réactivera le vrai filtrage par contributeur biodiversité sur les événements déjà collectés.
- Mais ce backfill est un second chantier : l’app fix doit déjà corriger l’affichage sans mentir.

Fichiers à modifier
- `src/components/biodiversity/SpeciesExplorer.tsx`
- `src/components/community/EventBiodiversityTab.tsx`
- Éventuellement un nouveau hook/utilitaire partagé, par ex. :
  - `src/hooks/useSpeciesContributors.ts`
  - ou `src/utils/contributorResolver.ts`

Résultat attendu
- Plus jamais de `Tous (0)` faux sur un événement avec des participants.
- Quand le filtrage taxonomique est réellement possible, il reste précis.
- Quand seules les présences événementielles sont connues, l’UI reste juste, lisible et élégante.
- Le comportement devient générique et robuste, quel que soit l’événement et l’ancienneté des snapshots.

Détail technique
```text
AVANT
SpeciesExplorer
  -> lit uniquement species.attributions
  -> si vide => Tous (0)

APRÈS
EventBiodiversityTab
  -> espèces depuis snapshots
  -> contributeurs fallback depuis participants + crew
  -> passe les 2 au SpeciesExplorer

SpeciesExplorer
  -> si attributions => filtre actif
  -> sinon si participants => état informatif "Participants (N)"
  -> sinon => contrôle masqué
```
