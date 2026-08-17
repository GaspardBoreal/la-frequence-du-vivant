# Sondes : état de service et lecture par famille

Deux corrections de fond dans la console des sondes, pour que l'onglet « Analyses » ne parle que de ce qu'il sait vraiment lire.

## 1. Déclarer une sonde « En maintenance »

Aujourd'hui une sonde ne connaît que deux états implicites : active ou non. La Sonde Verger, batterie à plat, continue donc d'occuper une vignette d'analyse et d'annoncer un verdict agronomique construit sur des mesures figées depuis le 14 août.

Ce qu'on met en place :

- **Un état de vie explicite** sur chaque sonde : *En service*, *En maintenance*, *Retirée*, avec un motif libre (« batterie à changer ») et la date de mise en maintenance.
- **Le réglage se fait depuis « Carte des sondes »** : la bulle de la sonde et sa fiche gagnent un sélecteur d'état. Sur le plan, une sonde en maintenance passe en pastille grisée barrée, une sonde retirée disparaît du plan.
- **Analyses** n'affiche que les sondes en service. En tête d'onglet, une ligne sobre : « 1 sonde écartée : Sonde Verger — en maintenance depuis le 14 août (batterie à changer) », cliquable pour la voir quand même.
- **Poste de contrôle et alertes** : une sonde en maintenance ne déclenche plus d'alerte de silence ni d'alerte batterie — le silence est attendu, pas subi. Elle reste visible, marquée, avec ses dernières mesures.
- **Les données continuent d'arriver** : le webhook ne rejette rien, l'historique reste intact. La maintenance est une lecture, pas une coupure.

## 2. Chaque famille de sonde lue selon ce qu'elle mesure

La Station météo est de famille *meteo* et ne transmet que température et humidité de l'air. La lire avec la grille d'une sonde de sol produit un écran de quatre « non transmise », un verdict « Lecture impossible » et trois espèces suggérées identiques et arbitraires. C'est faux et cela décrédibilise le reste.

Ce qu'on met en place :

- **Un profil de lecture par famille**, fondé sur les grandeurs réellement déclarées dans le catalogue de la sonde (`/admin/iot`) et sur ses profondeurs.
  - **Famille sol** : la lecture actuelle, mais les cadrans ne réclament que les grandeurs et profondeurs déclarées pour ce modèle. Une grandeur jamais promise n'apparaît plus comme un manque.
  - **Famille météo** : une carte au vocabulaire de l'air — température de l'air (mini/maxi/moyenne, amplitude jour-nuit), humidité de l'air, point de rosée si disponible, jours de gel et jours de chaleur sur la fenêtre, tendance. Verdict formulé en climat, jamais en plantation : « Air doux et humide, amplitude modérée ».
  - Aucune suggestion d'espèces sur une sonde météo : à la place, une phrase honnête — « Cette station décrit le climat du lieu ; le choix des espèces se décide sonde de sol par sonde de sol » — et un renvoi vers les sondes de sol de la même propriété.
- **La météo devient le contexte des sondes de sol** : sur une propriété qui possède une station, les cartes des sondes de sol affichent en pied de carte la ligne climat du site (air, amplitude, gel) issue de la station, ce qui rend enfin utile la pluviométrie et la température d'air manquantes localement.
- **Niveaux 2 et 3** suivent la même règle : pour une station météo, on montre les rythmes de l'air et la qualité de la donnée ; les blocs sol (tapis d'humidité, ressuyage, fenêtres de plantation, concordance palette) sont remplacés par une note expliquant qu'ils demandent une sonde de sol.
- **Le comparateur de sondes** ne compare que des sondes qui partagent une grandeur, et affiche laquelle.

## Détails techniques

- Migration : `iot_capteurs` gagne `etat text not null default 'service'` (valeurs `service` / `maintenance` / `retire`, contrôlées par trigger de validation), `etat_motif text`, `etat_depuis timestamptz`. Aucun changement de RLS ni de GRANT — colonnes ajoutées sur une table existante. `actif` reste inchangé pour ne rien casser.
- `src/hooks/iot/useIot.ts` : `IotCapteur` étendu, mutation `useSetCapteurEtat` (écriture chirurgicale, invalidation ciblée).
- `src/hooks/iot/useIotTelemetry.ts` : `useAllCapteursGeo` remonte `etat`; l'exclusion se fait à la lecture, dans `useIotAnalyses`, avec la liste des sondes écartées renvoyée à l'UI.
- `src/lib/iot/grandeurs.ts` : nouvelle notion `sensorProfile(type)` → `{ famille, expected: string[], profondeurs }`, dérivée de `iot_types_capteurs.grandeurs` / `profondeurs_m` ; `expectedSlots` s'y adosse au lieu d'une liste sol figée.
- `src/lib/iot/analyses.ts` : `analyseSensor` reçoit le profil ; `simpleVerdict` se scinde en `soilVerdict` et `weatherVerdict` ; ajout de `climateSummary` (gel, chaleur, amplitude, point de rosée).
- `src/components/iot/analyses/` : `SimpleVerdictCard` délègue à `SoilVerdictCard` / `WeatherVerdictCard` ; `AnalysesTab` porte la ligne « sondes écartées » ; `RhythmPanel` et `AgronomicDossier` conditionnent les blocs sol au profil ; `SensorCompare` filtre par grandeur commune.
- `src/components/propriete/iot/map/IotLayer.tsx` + fiche capteur : sélecteur d'état, pastille grisée barrée, badge « Maintenance ».
- Alertes silence/batterie : `sensorHealth` renvoie `paused` pour un capteur en maintenance.
