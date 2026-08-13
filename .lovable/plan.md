# Admin IoT — onglet « Carte des sondes » + Observatoire de données

Ajouter un troisième onglet dans `/admin/iot`, à côté de « Poste de contrôle » et « Catalogue » : une carte de terrain de toutes les sondes, toutes propriétés confondues, avec fiche détaillée au clic et accès à un observatoire graphique complet.

## 1. Onglet « Carte » — le territoire vivant des sondes

Carte plein cadre (Leaflet, via le `SafeMapContainer` déjà utilisé ailleurs), fond satellite/plan commutable.

- Une pastille par sonde, reprenant le langage visuel déjà en place dans le jardin : couleur = santé (verte qui pulse si elle respire, ambre si silencieuse, rouge si batterie basse), médaillon photo « en situation » si la sonde en possède une.
- Regroupement par propriété : léger halo et étiquette du nom de propriété, zoom automatique sur l'ensemble des sondes géolocalisées.
- Bandeau latéral gauche « Les sondes » : liste filtrable (propriété, fournisseur, famille, état), survol = pastille mise en valeur, clic = centrage et ouverture de la fiche.
- Encart d'alerte discret : sondes sans coordonnées GPS, avec lien direct vers la propriété pour aller les poser.
- Respiration en direct : quand une trame arrive (Realtime déjà branché sur `iot_mesures`), la pastille concernée émet une onde — la carte devient un cardiogramme du réseau.

## 2. Fiche sonde au clic

Panneau latéral (réutilise la logique de `SensorDrawer`, adapté au contexte admin multi-propriétés) :

- Identité : nom, numéro de série, modèle, fournisseur, propriété (lien vers l'espace jardin), emplacement, coordonnées.
- Santé : batterie, RSSI/SNR, dernier signal, seuils d'alerte.
- Dernières mesures par grandeur et profondeur, avec verdict agronomique existant.
- Bande photo « en situation ».
- Bouton « Voir tous les graphes » → ouvre l'Observatoire.

## 3. Observatoire de la sonde — tous les graphes

Vue plein écran dédiée à une sonde :

- Sélecteur de période : 24 h, 7 j, 30 j, 90 j, 1 an, plage personnalisée.
- Un graphe par grandeur (humidité, température, conductivité, pluviométrie, tension…), unités SI, courbes superposées par profondeur avec légende — la lecture « 5 cm contre 30 cm » devient immédiate.
- Curseur temporel synchronisé entre tous les graphes : on déplace la souris, toutes les valeurs du même instant s'affichent.
- Repères de lecture : bandes de confort agronomique (seuils de `grandeurs.ts`), min/max/moyenne de la période, nombre de relevés, trous de transmission matérialisés.
- Vitalité de transmission de la sonde sur la période (réutilise `VitalityStrip`).
- Export CSV des séries affichées + copie Markdown pour l'IA de Jardin.

## 4. Détails techniques

- Nouveau composant `src/components/iot/SensorsMapTab.tsx` (carte + liste + panneau) et `src/components/iot/SensorObservatory.tsx` (graphes).
- Nouveau hook dans `src/hooks/iot/useIotTelemetry.ts` : `useAllCapteursGeo()` — toutes les sondes avec `propriete:proprietes(id, nom)` jointe, et `useMesureSeriesRange(capteurId, from, to)` pour les périodes libres (le hook actuel `useMesureSeries` est figé à N jours).
- Réutilisation directe : `IotLayer` (pastilles), `useLatestMesures`, `useCapteurCovers`, `sensorHealth`/`HEALTH_COLOR`/`fmtMesure`, `VitalityStrip`.
- Graphes en Recharts (déjà dans le projet) avec tooltip partagé ; couleurs issues des tokens du design system, aucune couleur en dur.
- Ajout de l'onglet dans `src/pages/AdminIot.tsx` ; l'état (sonde sélectionnée, période) est synchronisé dans l'URL pour pouvoir partager un lien vers une sonde précise.
- Aucune modification de schéma de base : les tables `iot_capteurs`, `iot_mesures` et les RLS existantes suffisent.

## 5. Hors périmètre

Pas de repositionnement GPS depuis l'admin (la pose reste dans l'Atelier du jardin de chaque propriété) — sauf si vous le souhaitez, auquel cas j'ajoute le glisser-déposer ici aussi.
