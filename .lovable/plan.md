# Onglet « Analyses » — lire les sondes pour décider de la palette végétale

Un quatrième onglet de la console des sondes (espace partenaire `/partenaire-iot/:slug` et `/admin/iot`), pensé comme une salle de lecture : trois niveaux d'analyse d'une même donnée, du coup d'œil au dossier agronomique, toujours orientés vers une décision de plantation autour de chaque sonde.

Périmètre : uniquement de la lecture et du calcul côté client à partir des mesures déjà en base (`iot_mesures`) et du registre de sol de la propriété. Aucune nouvelle collecte, aucune modification des données existantes.

## Niveau 1 — Simple : « Que planter ici, maintenant ? »

Une carte par sonde, lisible en trois secondes.

- **Le verdict** : une phrase et une couleur — « Sol frais et couvert : plantations possibles cette semaine », « Sol sec en surface : arroser avant toute plantation », « Données insuffisantes ».
- **Quatre cadrans** : humidité du sol (surface / profondeur), température du sol, lumière reçue, pluie cumulée 7 jours. Chaque cadran affiche la valeur, son unité et une flèche de tendance sur 7 jours.
- **Trois espèces suggérées** issues de la palette végétale de la propriété, celles dont les exigences (eau, lumière, rusticité) collent le mieux au micro-climat mesuré autour de la sonde, avec la raison en une ligne.
- **Une action** : « Planter », « Attendre la pluie », « Pailler », « Arroser » — avec la fenêtre de temps conseillée.

## Niveau 2 — Intermédiaire : « Comment ce coin respire »

Les rythmes, en visuel, sur 7 / 30 / 90 jours.

- **Le tapis d'humidité** : une frise heures × jours colorée du sec au saturé, une bande par profondeur — on voit d'un coup les séquences sèches, l'effet des pluies, les remontées nocturnes.
- **La respiration jour/nuit** : amplitude thermique du sol et de l'air superposées ; une forte amplitude signale un sol nu, une faible amplitude un sol couvert ou vivant.
- **Le budget d'eau** : pluie entrante contre assèchement observé, cumul glissant, et le compteur « jours depuis la dernière recharge du sol ».
- **La lumière disponible** : heures d'éclairement utile par jour, traduites en classe d'exposition (plein soleil / mi-ombre / ombre) — la clé du choix des strates.
- **Comparateur de sondes** : deux ou trois sondes côte à côte sur la même grandeur, pour révéler que le potager d'été et le verger ne sont pas le même jardin.

## Niveau 3 — Avancée : « Le dossier agronomique »

Pour l'expert et pour l'IA de Jardin.

- **Croisement sol mesuré × sol analysé** : les mesures d'humidité mises en regard de la réserve utile, de la texture et de l'ICG du registre de sol de la propriété — on sait enfin si le sol se vide plus vite que sa réserve théorique.
- **Signature hydrique** : vitesse de ressuyage après pluie, profondeur du front d'humectation, indicateur de stress hydrique cumulé par profondeur.
- **Degrés-jours de croissance** et somme thermique du sol depuis le 1er janvier, avec les seuils de reprise végétative.
- **Fenêtres de plantation** : les créneaux passés et à venir où température de sol, humidité et lumière sont simultanément dans la plage favorable, par grande famille végétale.
- **Table de correspondance palette** : chaque espèce de la palette recommandée notée sur la niche mesurée (eau / lumière / thermique), avec l'écart chiffré et la mention explicite des grandeurs manquantes.
- **Qualité de la donnée** : couverture de transmission, trous, valeurs hors plage plausible, profondeurs absentes — toute lecture avancée annonce sa fiabilité.

## Garde-fous

Aucune valeur inventée : quand une grandeur manque (humidité de sol non transmise, profondeur absente), l'écran le dit et indique ce qui manquerait pour conclure. Les anomalies connues de la chaîne Brad sont signalées comme anomalies, jamais commentées comme faits agronomiques. Un bouton « Interroger l'IA de Jardin » à chaque niveau cadre le chat sur la sonde et la fenêtre affichées.

## Détails techniques

- Nouvel onglet `analyses` dans `src/pages/PartenaireIot.tsx` et dans `/admin/iot`, monté via `IotConsolePanel` (`view: 'analyses'`) pour rester mutualisé — le périmètre vient de `IotConsoleProvider`, sans nouvelle requête d'accès.
- Nouveau moteur de calcul `src/lib/iot/analyses.ts` : agrégats par sonde/grandeur/profondeur (min/moy/max, tendance, amplitude jour-nuit, ressuyage, degrés-jours, heures d'éclairement, cumuls de pluie), tous purement fonctionnels et testables.
- Nouveau hook `src/hooks/iot/useIotAnalyses.ts` s'appuyant sur `useMesuresWindow` / `useMesureSeriesRange` existants et sur `useAllCapteursGeo` ; `staleTime` long, aucun point brut retransmis au-delà du calcul.
- Croisement sol : réutilisation de `usePropertySoil(..., { readOnly: true })` + `soilLiteFromState`, dans le respect du verrou d'écriture existant du registre de sol.
- Croisement palette : lecture seule de la palette existante (`usePropertyPalette` / palette recommandée) pour la notation des espèces.
- Composants sous `src/components/iot/analyses/` : `AnalysesTab.tsx` (sélecteur de niveau + fenêtre), `SimpleVerdictCard.tsx`, `MoistureCarpet.tsx`, `BreathChart.tsx`, `WaterBudget.tsx`, `LightClass.tsx`, `SensorCompare.tsx`, `AgronomicDossier.tsx`, `PlantingWindows.tsx`, `PaletteFitTable.tsx`, `DataQualityNote.tsx`.
- Rendu graphique avec la bibliothèque de graphiques déjà utilisée dans le projet ; couleurs prises dans `GRANDEURS` et les tokens du design system, jamais en dur.
- Aucun changement de schéma, aucune edge function, aucune nouvelle policy.
