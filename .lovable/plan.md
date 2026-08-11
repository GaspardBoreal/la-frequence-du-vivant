# Capteurs & sondes — intégration IoT (Brad Technology)

Objectif : faire entrer les objets connectés dans l'application propriété, du catalogue
administrateur jusqu'à la carte du jardin, avec les 3 sondes de sol de « Jardin Monde DEVIAT »
opérationnelles et le webhook Brad branché.

## 1. Le socle de données

Cinq tables, toutes en unités du Système international à l'écriture.

| Table | Rôle |
| --- | --- |
| `iot_fournisseurs` | Nom, site web, pays, logo, notes. |
| `iot_types_capteurs` | Modèle (ex. « Sonde sol 5/15 »), fournisseur, famille (sol / météo / pluviométrie), profondeurs, grandeurs mesurées attendues. |
| `iot_capteurs` | Un capteur physique : numéro de série, nom donné par le jardinier, type, propriété, GPS (lat/lng), état, dernière communication, batterie, RSSI/SNR, `open_data` (booléen, préparé pour la suite). |
| `iot_mesures` | Mesure horodatée : capteur, grandeur normalisée, valeur en unité SI, profondeur en mètres, source (`webhook` / `import_csv` / `test`), payload brut conservé. |
| `iot_webhook_deliveries` | Journal des livraisons Brad : identifiant de livraison, signature valide ou non, capteur reconnu, nombre de mesures écrites, erreur éventuelle. |

Normalisation à l'entrée : température → °C, humidité → fraction en % (conservée telle quelle,
unité `%`), pression hPa → Pa, luminosité → lux, capacitance mV → V, UV → index.
Un dictionnaire unique des grandeurs sert d'ancrage : `soil_moisture`, `soil_temperature`,
`air_temperature`, `air_humidity`, `dew_point`, `pressure`, `luminosity`, `uv_index`, `infrared`.
Accès : lecture pour les personnes rattachées à la propriété, écriture réservée aux
gestionnaires et à la fonction serveur.

## 2. Le webhook Brad

Fonction serveur `iot-webhook-brad`, publique (Brad ne peut pas s'authentifier), qui :

1. vérifie la signature HMAC-SHA256 de l'en-tête `X-Brad-Signature` contre le secret stocké
   (`BRAD_WEBHOOK_SECRET`), rejette sinon ;
2. déduplique sur `X-Brad-Delivery` ;
3. retrouve le capteur par son numéro de série (`b26s001`, `b26s002`, `b26s003`) ;
4. convertit chaque mesure en unité SI et l'insère dans `iot_mesures` ;
5. met à jour batterie, RSSI/SNR et « dernière communication » du capteur ;
6. journalise systématiquement la livraison, réussie ou non.

Un bouton **Tester** dans la fiche capteur rejoue un payload d'exemple signé, pour vérifier
la chaîne complète sans attendre une émission réelle.

## 3. Administration — `/admin/iot`

Deux onglets sobres, dans la ligne graphique admin existante :

- **Fournisseurs** : ajout, modification, suppression (nom, site web, pays).
- **Types de capteurs** : rattachés à un fournisseur, avec les grandeurs mesurées et
  les profondeurs, plus le nombre de capteurs déployés.

Entrée ajoutée dans le hub Outils admin.

## 4. Fiche propriété — déclarer et surveiller

Dans l'espace propriété :

- Ajout, paramétrage, modification, suppression des capteurs (type, numéro de série, nom,
  GPS, seuils d'alerte).
- **Tableau de bord de monitoring** : une pastille par capteur — vert (a parlé récemment),
  ambre (silence prolongé ou batterie < 25 %), rouge (muet au-delà du seuil ou batterie
  critique) — avec l'âge du dernier message et le niveau de liaison radio.
- **Alertes** : journal des incidents en base, bandeau d'état en tête de section, et
  résumé quotidien par email aux gestionnaires de la propriété (tâche planifiée).

## 5. Nouveau volet « Capteurs et sondes »

Ajouté dans le menu de l'application propriété **entre Atelier du jardin et Clinique du
jardin**, encadré d'un filet vert au-dessus et au-dessous pour marquer une sous-section
à part entière.

Contenu :

- bandeau de santé du parc (n capteurs, n en alerte, dernière mesure reçue) ;
- une carte par capteur, avec ses **dernières mesures rendues selon son type** :
  courbes d'humidité par profondeur pour une sonde de sol, température/hygrométrie de
  l'air, luminosité et UV ;
- lecture simple sous chaque courbe : « le sol se ressuie », « réserve en baisse depuis
  3 jours », « pas d'eau reçue depuis X jours » ;
- bouton **Demander à l'IA de Jardin**, qui joint le contexte du capteur (type, profondeurs,
  10 derniers jours agrégés, sol et cortège de la zone) à la conversation existante.

## 6. Atelier du jardin — vue de fond « Capteurs et sondes »

Nouvelle vue de fond, au même rang que « Prélèvements de sol » et « État sanitaire » :

- pastille vivante par capteur : couleur = santé, halo doux pulsant tant qu'il émet ;
- **dock « À situer »** listant les capteurs sans GPS ; un clic sur le plan les pose ;
- pastille glissable ensuite, écriture chirurgicale des seules coordonnées — exactement
  le geste déjà connu pour les prélèvements de sol ;
- infobulle au survol : nom, dernière mesure clé, âge, batterie.

## 7. Mise en service immédiate (le lot des 2 h)

1. Fournisseur **BRAD TECHNOLOGY** — https://www.brad.ag/fr — France.
2. Trois types : **Sonde sol 5/15**, **Sonde sol 5/30**, **Sonde sol 30/60**.
3. Trois capteurs rattachés à « Jardin Monde DEVIAT » :
   `b26s001` (Potager d'Hiver, 5/30), `b26s002` (Potager d'Été, 5/15),
   `b26s003` (Verger, 30/60).
4. Import de l'historique des trois fichiers CSV (4 → 11 août) dans `iot_mesures`,
   source `import_csv`, avec profondeur portée par chaque colonne.
5. Secret webhook enregistré, URL d'écoute à coller dans le back-office Brad.
6. Positionnement GPS des trois sondes depuis la vue de fond, à faire ensemble une fois
   l'écran livré (le dock « À situer » les présentera d'emblée).

## 8. Préparé pour l'Open Data (livré plus tard)

Champ `open_data` sur le capteur et sur la propriété, unités SI dès l'écriture, dictionnaire
de grandeurs stable : l'endpoint public et l'outil MCP de lecture pourront s'y brancher
sans reprise de schéma.

## Détails techniques

- Migrations Supabase : 5 tables + `GRANT` + RLS calquée sur `can_access_propriete`,
  déclencheur `updated_at`, index `(capteur_id, mesuré_le desc)` et `(grandeur, profondeur)`.
- Fonction serveur `iot-webhook-brad` (Deno), vérification HMAC en temps constant,
  `verify_jwt = false`, secret `BRAD_WEBHOOK_SECRET`.
- Fonction planifiée `iot-alertes-quotidiennes` (pg_cron) → email via l'envoi existant.
- Front : `src/lib/iot/units.ts` (normalisation SI), `src/lib/iot/health.ts` (règles de
  santé), hooks `useIotCapteurs` / `useIotMesures` / `useIotHealth`, composants
  `src/components/propriete/iot/*`, couche carte `IotLayer.tsx` + `IotDock.tsx` réutilisant
  les primitives de `SoilSamplesLayer`, entrée de vue de fond dans `LayersPanel.tsx`.
- Import CSV historique via requêtes d'insertion (script unique, non rejouable en double
  grâce à une contrainte d'unicité `(capteur_id, grandeur, profondeur, mesuré_le)`).
