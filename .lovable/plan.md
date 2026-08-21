# Atlas vivant — corriger la lecture 48 h et l'unifier avec la fiche sonde

## Ce qui change à l'écran

1. **Plus de carte dans l'Accueil partenaire.** Le bloc carte + liste de pastilles de l'Atlas est retiré ; la carte reste uniquement dans l'onglet « Carte des sondes ». L'Atlas devient un bloc purement rythmique (indicateurs + frise), plus court et plus lisible en mobile.

2. **Titre** : « Atlas vivant · 48 h » devient « Atlas vivant ». Le sous-titre « Le rythme réel du parc » est conservé, et la fenêtre (48 h) reste indiquée par l'échelle sous la frise.

3. **Première réception** : la plus ancienne réception, calculée uniquement sur les sondes retenues dans la vue — sondes actives et en état « en service » (les sondes en maintenance ou retirées sont exclues du calcul comme de la frise).

4. **Régularité** : au lieu du nom de la sonde la plus bavarde, une valeur chiffrée — la moyenne, sur ces mêmes sondes, de l'intervalle moyen entre deux réceptions, exprimée en minutes (ex. « 62 min · moyenne de 3 sondes »). Si une seule réception, la sonde est ignorée dans la moyenne.

5. **Barregraphe qui couvre toute la largeur** : aujourd'hui la moitié gauche est vide alors que les données existent. Cause vérifiée : la lecture des réceptions est plafonnée à 1 000 lignes par la base, alors que 2 084 mesures existent sur les 48 dernières heures — seules les ~23 h les plus récentes remontent, d'où les barres tassées à droite. La lecture sera paginée pour couvrir réellement la fenêtre ; la frise se remplira donc de gauche à droite sur toute la largeur, sauf trou de données réel.

6. **Même code dans la fiche sonde** (« Vitalité · 48 h » de la pop-in capteur, du poste de contrôle et de la carte) : elle consomme la même lecture paginée, donc les mêmes 48 h complètes, avec la même dateline première/dernière réception et la même régularité en minutes pour la sonde concernée.

## Détails techniques

- `src/hooks/iot/useIotTelemetry.ts` — `useTelemetryPings` : boucle de pagination `.range()` en ordre décroissant (pages de 1 000, plafond de sécurité) jusqu'à couvrir la fenêtre, sur le modèle déjà utilisé par `useMesuresWindow`. Aucun changement de signature, donc tous les consommateurs (Accueil, poste de contrôle, carte, fiche sonde) en profitent.
- Nouveau module `src/lib/iot/vitality.ts` : fonctions pures partagées — `vitalityStats(timestamps)` (première, dernière, intervalle moyen en minutes, plus long silence, nombre de valeurs) et `averageRegularity(perSensorTimestamps)`. Utilisé par `VitalityAtlas` et par la fiche sonde pour garantir un calcul identique.
- `src/components/iot/console/VitalityAtlas.tsx` : suppression du bloc carte (`SafeMapContainer`, `CircleMarker`, `FitSensors`) et de la barre de pastilles ; filtre `capteurEtat(c) === 'service' && c.actif` appliqué aux sondes et aux pings ; titre et carte « Régularité » mis à jour. Le clic sur une heure conserve le widget d'heure ouverte, sans carte.
- `src/components/iot/SensorCardBody.tsx` : sous « Vitalité · 48 h », ajout de la même ligne première / dernière réception et régularité, via `vitalityStats`.
- `src/components/iot/VitalityStrip.tsx` : inchangé dans son principe (48 barres, gauche → droite). Les barres vides restent visibles en gris clair pour signaler un vrai silence.
- Aucun changement de schéma, de RLS ni d'URL.
