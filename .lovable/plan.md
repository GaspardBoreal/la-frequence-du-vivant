# Le Chantier — Avant / Après travaux sur un ou plusieurs ouvrages

Un module plein écran ouvert depuis l'Atelier du jardin nourricier, qui prend un « lot de chantier » (1 à n ouvrages, ici « Massif Fréquence 01 ») et raconte, preuve à l'appui, ce que les travaux ont changé : espèces, sol, ICG, images, scénographies, rapport imprimable.

## Le principe

Un **Lot de chantier** est un objet enregistré : un nom, les ouvrages retenus, une date de travaux, un état d'avancement. Tout le module travaille dans ce périmètre et rien d'autre — le reste de la propriété est mis en sourdine.

Deux colonnes en permanence, **AVANT** (bleu ardoise) et **APRÈS** (vert vif), avec un curseur central qui fait glisser l'une sur l'autre.

```text
┌──────────── LE CHANTIER · Massif Fréquence 01 ─────────────┐
│  Lot ▾   Date des travaux : 12 mars 2026   [Rapport ⌘P]    │
├───────────────── AVANT ──────╫────────── APRÈS ────────────┤
│  ICG 56 / 100  ·  faible     ║   ICG 81 / 100 · bonne  ▲25 │
│  14 espèces · 1 prélèvement  ║   26 espèces (proj.)        │
│  [ herbier ]  [ carotte ]    ║   [ palette retenue ]       │
│  [ photos avant ]            ║   [ photos après ]          │
└────────────────────────────────────────────────────────────┘
```

## A — Les espèces de l'ouvrage seulement

Réutilisation du périmètre géométrique déjà en place (dedans / lisière +3 m / voisinage) : on ne garde que les observations réellement dans le tracé du massif, pas un cercle autour du centre. Herbier en vignettes, dédupliqué par nom scientifique, nom français puis (nom latin), avec l'étiquette bio-indicatrice quand elle existe. Curseur de rigueur identique à celui du Scénographe.

## B — Les prélèvements de l'ouvrage

Les carottes liées à l'ouvrage (lien déjà stocké) plus celles géographiquement dedans. Fiche lisible : structure, texture, pH, vie du sol, avec le sceau des 4 strates pour montrer d'un coup d'œil ce qui est renseigné et ce qui manque.

## C — ICG avant / après, expliqué

Le calcul existant est repris tel quel, mais restreint à l'ouvrage : 8 lignes de lecture (eau frais/sec, texture argile/sable, nutriments riche/pauvre, pH acide/calcaire). Chaque ligne compare le niveau lu dans le sol et le niveau lu dans la flore : même niveau = 2 points, un cran d'écart = 1 point, deux crans = 0. Total sur 16, ramené sur 100.

Affichage pédagogique : une ligne par critère, deux jauges face à face, le verdict en clair, et la phrase du calcul écrite en toutes lettres (« 11 points sur 16 → 69 / 100 »). Un indice de fiabilité indique combien de lignes ont pu être évaluées.

**Après travaux**, deux ICG possibles, au choix, affichés côte à côte quand les deux existent :
- **ICG projeté** — calculé sur les plantations du scénario retenu (les espèces posées deviennent la flore attendue) ;
- **ICG constaté** — calculé sur les observations et prélèvements datés après la date de travaux.

Le delta est mis en scène : flèche, gain par critère, et les 2 ou 3 lignes qui expliquent l'essentiel du gain (« la texture passe de partiel à oui grâce aux 4 espèces à limon apportées »).

## D — Photos et vidéos avant / après

Les médias de l'ouvrage sont rangés automatiquement selon la date de prise de vue par rapport à la date de travaux ; une étiquette Avant / Pendant / Après reste corrigeable à la main. Deux modes : mosaïque par phase, et **rideau comparatif** (glissement d'une image sur l'autre) pour les prises de vue appariées depuis le même point.

## E — Scénographies du seul ouvrage

Depuis le chantier, création directe d'un scénario limité au lot, en trois intentions : *avant travaux* (l'existant relevé), *après travaux* (le projet), *avant & après* (le morphing). Les scénarios existants du lot sont listés, ré-ouvrables et modifiables.

## F — Rapport imprimable

Deux formats :
- **Simple** (2 pages) : couverture du lot, tableau avant/après, ICG et delta, une planche photo.
- **Complet** : couverture, plan de l'ouvrage, herbier avant, palette après avec photos d'espèces, fiche carotte, tableau ICG ligne à ligne avec l'explication du calcul, planches photos avant/après, plan de plantation du scénario retenu.

Même moteur d'impression que le dossier de chantier existant, avec la préparation des vignettes d'espèces avant lancement.

## Sélection multi-ouvrages

- Bouton **Chantier** dans la barre de l'Atelier, à côté de Scénographies.
- Écran de sélection : cases à cocher sur la carte et dans le registre, ou reprise d'un lot existant.
- Un lot peut contenir un massif seul comme un ensemble (massif + mare + haie) ; les métriques sont alors cumulées, avec un repli par ouvrage.

## Mise en œuvre technique

1. **Base** — table `propriete_chantiers` (propriété, nom, ouvrage_ids, date_travaux, statut, notes) et `propriete_chantier_medias_phase` (surcharge manuelle de phase par média), avec GRANT + RLS alignées sur `propriete_objets` (accès via `can_access_propriete`). Hooks `useProprieteChantiers`, `useChantierScope`.
2. **Calculs** — `src/lib/chantierIcg.ts` : filtrage des observations par `ouvrageScope`, agrégation des carottes par `soilLinkEngine`, appel de `computeConcordanceDetail` sur trois jeux (avant, projeté, constaté) et calcul du delta ligne à ligne. Aucun changement du barème existant.
3. **UI** — `src/components/propriete/chantier/` : `ChantierOverlay`, `ChantierLotPicker`, `AvantApresRail`, `IcgLadder` (tableau explicatif), `IcgDeltaHero`, `HerbierColonne`, `CarotteColonne`, `MediaCurtain`, `ScenoLauncher`.
4. **Scénographe** — paramètre de lot passé au store existant, et intention (avant / après / comparé) stockée dans le scénario.
5. **Impression** — `ChantierRapportLayout` (variantes simple/complet) réutilisant les planches d'espèces et l'overlay de préparation.

## Direction artistique

Papier chaud, encre profonde, filet doré. L'avant en gris-bleu désaturé, l'après en vert vivant ; la bascule se fait par une animation de « respiration » plutôt qu'un fondu brut. Les gains d'ICG s'écrivent comme une partition : chaque critère est une corde qui se tend.

## Ordre de livraison

1. Lot de chantier + sélection + périmètre espèces/carottes (A, B)
2. ICG avant/après explicatif et delta (C)
3. Médias avant/après et rideau comparatif (D)
4. Scénographies liées au lot (E)
5. Rapports simple et complet (F)
