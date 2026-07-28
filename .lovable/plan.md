## Constat (vérifié dans le code)

La version **édition** de l'Étape 3 est nettement plus riche que la version **verrouillée** :

| Bloc | Édition | Verrouillé (actuel) |
| --- | --- | --- |
| Somme des indices | 4 cartes par critère (Eau / Texture / Nutriments / pH), 2 pôles opposés par carte, jauge 5 crans colorée par axe, nb de plantes contributrices, ligne « Dominante », encart « Lecture d'ensemble » | simple liste de 8 barres vertes monochromes, sans axe couleur, sans opposition, sans dominante |
| Concordance sol/flore | anneau ICG + pastille de bande, compteurs oui/partiel/non/na, jauge de fiabilité animée, tableau à filets colorés par critère, jauges 3 crans sol vs flore, pastilles verdict OUI 2 pts / PARTIEL 1 pt / NON, guide de lecture 3 cartes, encart remèdes si ICG < 60, note de calcul | anneau + tableau texte brut à 4 colonnes, pastilles ternes, aucune jauge, aucun guide, aucun remède |
| Narration | mode automatique, 2 variantes, traçabilité du registre | paragraphe brut, sans mention de l'origine ni du registre |

Le composant `IdentifySummary.tsx` sert **à la fois** l'écran verrouillé et l'impression A4 (`printOnly`), d'où l'appauvrissement actuel : tout a été calibré pour la page imprimée.

## Principe retenu

Séparer les deux régimes de rendu au sein du même composant : **écran verrouillé = riche** (proche de l'édition, en mode « lecture »), **impression = compact** (inchangé, A4 sûr). Tout l'enrichissement est conditionné à `!printOnly`.

## Ce qui sera construit

### 1. Section 02 — « Somme des indices : ce que racontent les plantes observées »

À l'écran verrouillé, remplacement de la liste de barres par la **lecture par critère** :
- 4 cartes (Eau, Texture, Nutriments, Réaction), une par critère, en grille 2 colonnes desktop / 1 colonne mobile.
- Dans chaque carte, les deux pôles opposés face à face avec la jauge 5 crans **colorée par l'axe** (tokens `--ds-eco-*` déjà en place), points, nombre de plantes contributrices et niveau nommé.
- Bandeau « Dominante » en pied de carte.
- En tête de section, l'encart **« Lecture d'ensemble »** (la phrase `narratePoleScores`) présenté comme une citation sur filet doré — sans le bouton « Reprendre dans ma conclusion », inutile en lecture seule.
- Aucune animation d'entrée en lecture (comme déjà fait pour l'impression) afin de rester net à l'ouverture.

### 2. Section 03 — « Concordance sol / flore : deux voix, une seule histoire ? »

Reprise à l'écran des composants de lecture de l'édition :
- Colonne gauche : anneau ICG + **pastille de bande** colorée, ligne `points / max → ICG %`, compteurs `oui · partiel · non · non évalué`, puis la **carte Fiabilité** (jauge + phrase d'avertissement quand des lignes ne sont pas évaluées).
- Tableau : **filet vertical coloré par critère**, libellé d'axe en tête de groupe, **jauges 3 crans** sol (minéral) vs flore (chlorophylle) avec légende de niveau, et **pastille verdict** contrastée (OUI · 2 pts / PARTIEL · 1 pt / NON · 0 pt / NON ÉVALUÉ).
- Sous le tableau : **guide de lecture** en 3 cartes (même niveau / un cran d'écart / deux crans) et, si ICG < 60, l'encart **« En cas de faible cohérence »** avec les 3 pistes de vérification.
- Note de calcul officielle (16 points fixes) conservée en pied.

Les sous-composants `VerdictChip` et `LevelGauge` sont extraits de `ConcordanceBlock.tsx` vers un fichier partagé pour être réutilisés à l'identique par la synthèse — une seule source de vérité visuelle entre édition et verrouillé.

### 3. Section 04 — « Ce que la flore raconte »

- Titre de section renommé en **« Ce que la flore raconte »** (au lieu de « Narration du diagnostic »).
- Texte présenté comme une **page de manuscrit** : lettrine sur le premier paragraphe, filet doré latéral, paragraphes séparés proprement (le texte est déjà en `whitespace-pre-line`).
- Sous le texte, une ligne de traçabilité discrète : **registre retenu** (Agronomique / Sensible) quand la narration vient de l'IA, et la mention *« Un texte auto-généré à partir de vos observations — relu et validé par le propriétaire »*. Si le texte a été écrit ou repris à la main, la mention devient *« Rédigé sur site »*.
- Rappel d'action en lecture seule : le crayon d'édition de section (déjà présent au survol) reste le chemin pour reformuler.

### 4. Cohérence d'ensemble

- Le bandeau « Lecture dominante » en tête de synthèse gagne les chips manquants (nb de plantes, strates, ICG **et** fiabilité).
- L'impression (`printOnly`) reste **strictement inchangée** : mêmes pages, même pagination, mêmes gabarits A4 — vérification visuelle de la simulation d'impression avant clôture.

## Détails techniques

- `src/components/propriete/identify/blocks/ConcordanceBlock.tsx` : extraction de `VerdictChip`, `LevelGauge`, `VERDICT_TOKEN`, `GUIDE`, `REMEDES` vers `src/components/propriete/identify/ConcordanceParts.tsx` ; le bloc d'édition importe désormais ces primitives (aucun changement visuel côté édition).
- `src/components/propriete/identify/IdentifySummary.tsx` : ajout de deux rendus alternatifs (`renderPolesRich`, `renderConcordanceRich`) utilisés quand `!printOnly` ; les rendus compacts actuels restent pour l'impression. Ajout du bloc narration enrichi.
- Aucune modification de calcul : `computePoleScores`, `computeConcordanceDetail`, `narratePoleScores` et l'ICG/16 restent identiques.
- Aucune migration de base ; le registre de narration est lu depuis l'état déjà présent côté client (pas de nouvelle colonne — si aucun registre n'est connu, la mention générique s'affiche).
