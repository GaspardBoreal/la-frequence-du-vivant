# Sondes Brad — remise à niveau avant la démo

Les réponses d'Olivier sont vérifiables dans les livraisons reçues : voici ce qu'elles montrent et ce qu'on corrige côté Fréquence Jardin.

## Constat vérifié

1. **Station météo b26w002 refusée.** Toutes ses livraisons (encore à 17h43) sont signées et valides, mais rejetées avec « Capteur inconnu : b26w002 » → elle n'existe pas dans la table des capteurs. Le payload arrive bien (`event: weather_station.telemetry.updated`, mesures température + humidité, plot « Potager d'Hiver »).
2. **Mesures de sol par profondeur perdues.** Brad envoie `soilMoisture_15cm`, `soilTemperature_30cm`, etc. Notre lecteur de clés ne reconnaît pas le tiret bas : ces clés sont **silencieusement ignorées**. C'est exactement pourquoi les deux sondes n'affichent pas les mêmes indicateurs : Potager d'Été a une clé `soilMoisture` « à plat » (donc affichée), Potager d'Hiver n'en avait pas pendant plusieurs heures — seulement les variantes par profondeur, jetées.
3. **Le fameux 450 %.** En base, l'humidité de sol « sans profondeur » monte jusqu'à **455 %** (241 relevés), alors que les mesures par profondeur restent entre 0 et 35 %. Ce sont d'anciennes valeurs, avant la correction annoncée par Brad. Aucun garde-fou ne les a bloquées.
4. **Capacitance retirée** par Brad : on a 645 relevés historiques `soil_capacitance` qui vont s'arrêter net.
5. **Nouveauté utile** : chaque mesure porte désormais une clé `interpretation` (« Confort hydrique », « Point de flétrissement », « Canicule »…) qu'on n'exploite pas encore.

## Ce qu'on fait

### 1. Accepter la station météo (bloquant démo)
Enregistrer `b26w002` comme capteur de type station météo, rattaché à Jardin Monde Deviat, positionné près du Potager d'Hiver. Ses relevés (température, humidité, et plus tard pluie/pression/vent) rejoignent la console au même titre que les sondes de sol, avec une icône et un libellé « Station météo ».

### 2. Lire correctement les profondeurs
Le webhook reconnaîtra `soilMoisture_15cm`, `soilTemperature_30cm`, `soilMoisture15`, avec ou sans tiret bas. Règle anti-doublon : quand une grandeur existe à la fois « à plat » et par profondeur, on ne garde que les versions par profondeur. Résultat : les deux sondes exposent enfin les mêmes indicateurs, l'une à 0/30 cm, l'autre à 15 cm.

### 3. Garde-fou de plausibilité
Toute valeur hors bornes physiques (humidité hors 0–100 %, température hors -40/+80 °C, UV hors 0–20…) est refusée à l'entrée, tracée dans le journal des livraisons comme « valeur aberrante », et **jamais** écrite en base. Puis nettoyage : les relevés d'humidité de sol > 100 % déjà stockés sont archivés hors des courbes pour que le graphe redevienne lisible.

### 4. Répondre 422 au lieu de 404
Sur capteur inconnu, le webhook renverra **422 Unprocessable Entity** (avec le numéro de série en clair) — 404 restera réservé à « endpoint inexistant », comme Olivier le demande. Idem pour un payload invalide.

### 5. Afficher les interprétations Brad
L'interprétation fournie par la sonde s'affiche en sous-titre des tuiles de mesure (widget horaire, carte, observatoire), en complément — pas en remplacement — de nos propres verdicts agronomiques. Elle est aussi transmise à l'IA de jardin comme signal de terrain.

### 6. Journal des livraisons lisible pour la démo
Ajout, dans le journal admin IoT, d'une ligne de synthèse par livraison : capteur, nombre de mesures retenues, mesures ignorées et motif (clé inconnue, valeur aberrante, capteur non enregistré). C'est la preuve de bonne foi à montrer demain.

## Détails techniques

- `supabase/functions/iot-webhook-brad/index.ts` : regex `^([a-zA-Z]+)_?(\d+)(cm)?$`, dédoublonnage plat/profondeur, table de bornes de plausibilité, codes retour 422, stockage de `interpretation` dans `raw` + colonne dédiée `interpretation text` sur `iot_mesures`.
- Migration : ajout de `interpretation` sur `iot_mesures`, colonne `rejected boolean default false` (ou table `iot_mesures_rejetees`) pour l'archivage des valeurs aberrantes, insertion du capteur `b26w002` (type station météo créé si absent), GRANTs conservés.
- Front : `src/lib/iot/grandeurs.ts` (métadonnées station météo + affichage interprétation), `HourMesuresWidget.tsx`, `SensorObservatory.tsx`, `SensorsMapTab.tsx`, journal des livraisons dans `AdminIot`.
- Aucune modification du secret HMAC ni de l'URL du webhook : rien à changer côté Brad hormis ce qu'Olivier a déjà fait.

## Message de retour à Olivier (à envoyer après mise en place)
Confirmation que b26w002 est enregistré, que les clés `_XXcm` sont désormais consommées, que le 404 devient 422, et demande de confirmation sur les grandeurs attendues de la station (pluie, pression, vent, rayonnement) pour préparer les affichages.
