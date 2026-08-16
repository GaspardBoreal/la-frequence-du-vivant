# Profondeurs de sol — se rendre insensible au correctif Brad

Olivier confirme : `_0cm` = 5 cm, et « 5/15 » / « 5/30 » sont bien des combinaisons de profondeurs. Il bascule b26s001 en `_5cm` et regarde b26s002 sous 30–45 min.

Attendre 45 min n'est pas nécessaire pour avancer : le webhook doit accepter **les deux étiquettes** de toute façon, sinon la bascule d'Olivier cassera la lecture juste avant la démo. On pose le filet maintenant, et sa correction arrive dans un système déjà prêt.

## 1. Normalisation des profondeurs (à faire tout de suite)

- `_0cm` et `_5cm` sont lus comme **0,05 m** : la bascule d'Olivier devient un non-événement, et l'historique déjà stocké à 0 m reste lisible sous la même étiquette « 5 cm ».
- Toute profondeur inconnue reste enregistrée telle quelle — rien n'est jeté.
- Le journal des livraisons trace « profondeur normalisée 0 cm → 5 cm » pour garder la traçabilité.
- Migration légère : les relevés de sol existants à `profondeur_m = 0` passent à `0.05` (uniquement pour les sondes Brad), pour que les courbes 5 cm soient continues avant/après le correctif.

## 2. Grille de lecture attendue par modèle

- Le modèle de la sonde (`5/15`, `5/30`) donne les profondeurs attendues.
- Une profondeur attendue sans donnée s'affiche en tuile grisée « — · non transmise » au lieu de disparaître : la sonde d'Été montre clairement son trou à 5 cm, et les deux sondes se lisent enfin sur la même grille.
- Dès qu'Olivier remet le capteur superficiel de b26s002 en ligne, la tuile se remplit toute seule, sans nouvelle intervention.

## 3. Ce qu'on attend d'Olivier (les 45 min)

Rien de bloquant : seulement la réponse sur b26s002 (capteur superficiel absent du payload ou capteur muet). On vérifiera à réception que la trame contient bien `soilMoisture_5cm` / `soilTemperature_5cm`, et la démo affichera 5 cm et 15 cm côte à côte.

## Détails techniques

- `supabase/functions/iot-webhook-brad/index.ts` : table de normalisation des profondeurs (`0cm|5cm → 0.05`), trace dans `_lfdv.normalized`.
- Migration de données : `update iot_mesures set profondeur_m = 0.05 where profondeur_m = 0 and grandeur like 'soil_%'`.
- `src/lib/iot/grandeurs.ts` : profondeurs attendues dérivées du nom de sonde, avec repli sur les profondeurs observées.
- `src/components/iot/HourMesuresWidget.tsx` et `SensorObservatory.tsx` : fusion mesures reçues × grille attendue, rendu « non transmise ».
- Aucun changement de schéma ni de RLS.
