# Weenat : ouvrir la chaîne IoT à plusieurs fournisseurs

Aujourd'hui la chaîne IoT est bâtie autour de Brad : les mesures arrivent par un webhook signé que Brad appelle. Weenat fonctionne à l'inverse — c'est nous qui allons chercher la donnée, toutes les heures, avec une clé API. Le modèle de données (fournisseur → modèle de capteur → capteur posé sur une propriété) est déjà multi-fournisseurs : une propriété peut donc déjà porter des sondes Brad **et** Weenat. Ce qui manque, c'est la collecte Weenat, le vocabulaire de mesures qu'elle apporte (tension du sol, rayonnement), et une lecture qui distingue clairement les fabricants.

## 1. Les quatre capteurs Weenat au catalogue

| Capteur | Famille | Profondeurs | Ce qu'il mesure |
| --- | --- | --- | --- |
| **Station Météo Virtuelle (SMV)** | météo | — | Pluie, température et humidité de l'air, point de rosée, rayonnement, ETP, vent — recalculés au km² à partir des modèles et du réseau Weenat. Aucun matériel, posée sur les coordonnées de la parcelle. |
| **Tensiomètre Watermark (30 / 60 cm)** | sol | 0,30 et 0,60 m | Force de succion des racines (kPa) + température du sol. Posé par couple, c'est la recommandation de Maël pour les jardins : le meilleur rapport lecture / prix (330 €). |
| **Sonde capacitive 30 cm** | sol | 0,10 / 0,20 / 0,30 m | Teneur en eau volumique (%) et température par horizon de 10 cm — l'équivalent Weenat de la sonde Brad 5/15/30. |
| **Pyranomètre** | météo | — | Rayonnement solaire global (W/m²), pour relier lumière reçue, chaleur du sol et palette végétale. |

Ces quatre modèles sont créés dans **Admin › IoT** sous le fournisseur WEENAT (déjà existant), avec leurs grandeurs et profondeurs déclarées : tout le reste de l'application (jauges, verdicts, analyses, IA) s'appuie sur ce catalogue.

## 2. Nouvelles grandeurs lisibles

Le dictionnaire des grandeurs s'enrichit, toujours en unité de stockage explicite : tension du sol (kPa), rayonnement global (W/m²), rayonnement photosynthétique PAR (µmol/m²/s), évapotranspiration (mm), déficit de pression de vapeur (kPa), direction du vent (°). Chacune reçoit son libellé français, sa couleur, sa plage de lecture et son interprétation agronomique (par exemple : sous 30 kPa le sol est confortable, au-delà de 80 kPa la plante souffre).

## 3. Rattacher une propriété à un compte Weenat

Une propriété peut désormais déclarer une **intégration fournisseur** : clé API Weenat propre au jardin (par exemple `LFDV-CDF-DEVIAT` pour Jardin Monde DEVIAT), exploitation et parcelle associées. La clé est enregistrée dans une table réservée au service (jamais lisible par le navigateur, ni par un marcheur, ni par un propriétaire) et n'est utilisée que par la collecte côté serveur ; l'écran n'en montre que les quatre derniers caractères.

Depuis cette intégration, un bouton **« Découvrir les capteurs »** interroge Weenat, liste les appareils et parcelles disponibles, et permet de les rattacher en un clic à la propriété — le numéro de série, le modèle et la position GPS sont pré-remplis.

## 4. Collecte horaire et contrôle

Une nouvelle fonction serveur va chercher, toutes les heures, les mesures de chaque capteur Weenat rattaché à une propriété active, les convertit vers le vocabulaire interne et les enregistre comme les mesures Brad (mêmes bornes de plausibilité, même déduplication). Chaque passage laisse une trace dans le journal des livraisons, avec le même code couleur que Brad : la « Constellation des sept veilles », les alertes de silence et le verdict de fiabilité fonctionnent sans modification. Un bouton **« Relever maintenant »** permet de forcer une collecte, et l'import d'historique permet de rattraper les données depuis l'installation.

## 5. Lecture unifiée dans « Mon projet › Capteurs et sondes »

L'écran passe d'une liste plate à une lecture **par fabricant** : un bandeau de veille global inchangé, puis un bloc par fournisseur (logo, nombre de sondes, dernière réception). Ajouter, régler, déclarer en maintenance ou retirer une sonde fonctionne à l'identique quel que soit le fabricant ; le formulaire demande d'abord le fabricant, puis le modèle, et affiche l'identifiant attendu propre au fournisseur. La Station Météo Virtuelle est signalée comme telle (pas de batterie, pas de signal radio à surveiller) pour ne pas déclencher de fausses alertes.

Dans l'Atelier du jardin et la Carte des sondes, les pastilles portent la couleur du fabricant afin de lire d'un coup d'œil un déploiement mixte.

## 6. IA de Jardin

Le contexte transmis à l'IA passe de « les sondes » à « le dispositif de mesure de la propriété » : tous les capteurs, tous fabricants confondus, avec leur fabricant, leur emplacement et leurs dernières lectures. La météo locale de la SMV remplace la station Météo France la plus proche dès qu'elle est disponible, ce qui corrige directement le biais de recommandation évoqué avec Weenat.

## Détails techniques

- **Base** : nouvelle table `iot_propriete_integrations` (`propriete_id`, `fournisseur_id`, `api_key`, `external_farm_id`, `external_plot_id`, `actif`, horodatages) — aucun accès `anon`/`authenticated` en lecture sur la clé, accès `service_role` pour les fonctions, gestion par les administrateurs via RPC `SECURITY DEFINER` renvoyant la clé masquée. Ajout sur `iot_capteurs` de `external_id` et `external_kind` (`device` | `plot`), avec index unique par fournisseur.
- **API Weenat V3** : en-tête `Authorization: Weenat-Api-Key <clé>` ; `GET /v3/devices` et `GET /v3/plots` pour la découverte, `GET /v3/data/devices/{id}` et `GET /v3/data/plots/{id}` (SMV) pour les mesures, avec `timespan` horaire et fenêtre glissante à partir de `last_seen_at`.
- **Correspondance des métriques** : `T`→`air_temperature`, `U`→`air_humidity`, `RR`→`rainfall`, `T_DEW`→`dew_point`, `FF`/`DD`→`wind_speed`/`wind_direction`, `RG`→`solar_radiation`, `PAR`→`par`, `ETP`→`etp`, `VPD`→`vpd`, `HPOT-30/-60`→`soil_potential` avec profondeur, `U_CAPA-10/20/30`→`soil_moisture`, `T_CAPA-10/20/30`→`soil_temperature`.
- **Fonctions serveur** : `iot-weenat-discover` (découverte, admin authentifié), `iot-pull-weenat` (collecte, appelée par cron horaire `pg_cron` et par le bouton de relève), `iot-import-weenat-history` (rattrapage). Réutilisation des bornes de plausibilité et du journal `iot_webhook_deliveries` (`fournisseur = 'weenat'`, `event = 'pull'`).
- **Front** : `useIot.ts` (hooks intégrations + découverte), `SensorFormDialog.tsx` (fabricant → modèle → identifiant), `SensorsSection.tsx` (groupement par fabricant), `grandeurs.ts` (nouvelles grandeurs + seuils), `useIotChatProviders.ts` / `useProprieteChatProviders.ts` (contexte IA multi-fabricants), couleurs fabricant dans `IotLayer` et la carte des sondes.
- **Premier déploiement** : Jardin Monde DEVIAT — SMV `SMVF5848D` (45.41379, 0.00897) via la clé `LFDV-CDF-DEVIAT`, aux côtés des trois sondes Brad déjà en place.
