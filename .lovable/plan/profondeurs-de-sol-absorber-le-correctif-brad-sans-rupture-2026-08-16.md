# Profondeurs de sol — absorber le correctif Brad sans rupture

Olivier a livré côté Brad : `_0cm` devient `_5cm` (sondes 5/15 et 5/30), et la clé générique `soilMoisture` sans profondeur disparaît du payload. Il continue d'investiguer les capteurs muets (piste microcode).

Notre webhook ne connaît aujourd'hui ni la normalisation `_0cm → 5 cm` ni cette disparition. Sans filet, la bascule crée une coupure dans les courbes juste avant la démo.

## Constat vérifié en base (sondes Deviat)

- b26s001 : humidité à **0,05 m** du 5 au 11 août (80 relevés), puis plus rien à 0,05 m ; depuis le 16 août à 18 h, des relevés à **0 m** (nouvelle étiquette `_0cm`) et à 0,30 m.
- b26s002 : humidité à 0,05 m jusqu'au 11 août, puis uniquement 0,15 m — le capteur superficiel ne transmet plus (cohérent avec l'investigation d'Olivier).
- 238 relevés b26s002 et 4 b26s001 en humidité **sans profondeur** : ce flux s'arrête maintenant côté Brad.
- `soil_capacitance` (645 relevés) s'arrête également, comme annoncé.

## 1. Normaliser les profondeurs à la réception

- `_0cm` et `_5cm` sont lus comme **0,05 m** : la courbe « 5 cm » redevient continue du 5 août à aujourd'hui, quelle que soit l'étiquette envoyée.
- Toute autre profondeur reste enregistrée telle quelle — rien n'est jeté.
- Le journal des livraisons trace « profondeur normalisée 0 cm → 5 cm ».
- Migration de données : les relevés de sol déjà stockés à `profondeur_m = 0` passent à `0,05`, pour raccorder les 5 relevés du 16 août à l'historique.

## 2. Survivre à la disparition de la clé générique

- La règle de dédoublonnage « plat vs profondeur » reste en place mais devient inoffensive : plus aucune clé plate n'arrivera.
- Les relevés historiques sans profondeur ne sont ni supprimés ni fusionnés : ils gardent leur étiquette « profondeur non précisée » et sortent naturellement des courbes récentes.
- La capacitance devient une série close : affichée comme telle (« série arrêtée le 16 août ») plutôt que comme une sonde en panne.

## 3. Grille de lecture par modèle de sonde

- Le modèle (`5/15`, `5/30`) donne les profondeurs attendues.
- Une profondeur attendue sans donnée s'affiche en tuile grisée « — · non transmise » au lieu de disparaître : le trou à 5 cm de b26s002 devient visible et explicable en démo, et les deux sondes se lisent sur la même grille.
- Dès qu'Olivier remet le capteur superficiel en ligne, la tuile se remplit seule.

## Détails techniques

- `supabase/functions/iot-webhook-brad/index.ts` : table de normalisation (`0cm|5cm → 0.05`), trace dans `_lfdv.normalized`.
- Migration : `update iot_mesures set profondeur_m = 0.05 where profondeur_m = 0 and grandeur like 'soil_%'`.
- `src/lib/iot/grandeurs.ts` : profondeurs attendues dérivées du nom/modèle de sonde, repli sur les profondeurs observées.
- `src/components/iot/HourMesuresWidget.tsx`, `SensorObservatory.tsx`, `SensorDrawer.tsx` : fusion mesures reçues × grille attendue, rendu « non transmise » et mention « série arrêtée » pour la capacitance.
- Aucun changement de schéma ni de RLS.
