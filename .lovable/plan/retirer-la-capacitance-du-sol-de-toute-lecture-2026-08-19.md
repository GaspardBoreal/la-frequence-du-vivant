# Retirer la « Capacitance du sol » de toute lecture

La capacitance brute (en volts) n'est pas exploitable : elle doit disparaître des fiches capteurs, de l'observatoire, des graphes, de la carte, des analyses et de l'admin IoT — sans toucher aux autres grandeurs.

## Principe : un seul point de vérité

Plutôt que de supprimer la grandeur à dix endroits (risque d'oubli et de régression), on déclare une liste de **grandeurs masquées** dans le dictionnaire central `src/lib/iot/grandeurs.ts` et on filtre **au niveau des lectures**, là où toutes les vues s'alimentent.

Conséquence : chaque écran qui affiche des mesures (vignettes, observatoire, courbes, comparateur, rythmes, verdicts, carte, widget horaire, dock atelier, exports CSV/Markdown, contexte IA) cesse de voir la capacitance, sans modification individuelle et sans effet sur les autres grandeurs.

## Ce qui change

1. `grandeurs.ts` : ajout de `GRANDEURS_MASQUEES = ['soil_capacitance']` et d'un helper `estGrandeurLisible(g)`. Le libellé reste défini (utile pour le journal des livraisons brutes), mais la grandeur sort de `GRANDEUR_ORDER` côté affichage.
2. Hooks de lecture (`useIot.ts`, `useIotTelemetry.ts`) : les requêtes `iot_mesures` excluent `soil_capacitance` côté serveur (`.not('grandeur','in',...)`), et le filtre est réappliqué en mémoire après agrégation. Les compteurs « n relevés · n grandeurs » deviennent donc cohérents avec ce qui est affiché.
3. Les listes de grandeurs annoncées par un type de capteur (`iot_types_capteurs.grandeurs`) sont filtrées à l'affichage, pour ne pas promettre une mesure qu'on n'affiche plus.
4. Rapport de confiance partenaire (`src/lib/iot/trustReport.ts`) : la capacitance sort des indicateurs et des questions ouvertes, puisque le sujet est tranché.

## Ce qui ne change pas

- Aucune donnée supprimée en base : les 645 relevés historiques restent stockés et le webhook Brad continue de les accepter (aucun rejet, aucune régression d'ingestion).
- Aucune autre grandeur touchée : humidité, températures, luminosité, UV, pluie, pression, batterie conservent leur pipeline, leurs couleurs et leur ordre de lecture.
- Aucun changement de schéma, de RLS ni d'edge function.

## Détails techniques

- `src/lib/iot/grandeurs.ts` : constante + helper, `GRANDEUR_ORDER` filtré.
- `src/hooks/iot/useIot.ts` (2 requêtes) et `src/hooks/iot/useIotTelemetry.ts` (4 requêtes + agrégations `spans` / dernières mesures) : exclusion serveur puis garde-fou mémoire.
- `src/lib/iot/analyses.ts` : les séries masquées ne sont pas construites (comparateur, tapis d'humidité, dossier agronomique restent inchangés pour le reste).
- `src/lib/iot/trustReport.ts` : retrait de l'entrée capacitance.
- Vérification après coup : ouvrir l'observatoire de « Sonde Potager d'Été » (5 grandeurs → 4), la fiche capteur, l'onglet Analyses et `/admin/iot`, et confirmer que les autres courbes sont identiques.
