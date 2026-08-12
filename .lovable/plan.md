# Rapport de test — réception des 3 sondes BRAD

Vérification faite directement en base ce 12/08/2026 à 11 h (Paris), sur les 72 dernières heures.

## Réponse à donner à BRAD : oui, on reçoit

| Sonde | N° série | Dernier signal | Livraisons 72 h | Mesures 24 h |
|---|---|---|---|---|
| Sonde Potager d'Été | b26s002 | 12/08 10 h 41 | 124 | 84 |
| Sonde Potager d'Hiver | b26s001 | 12/08 10 h 37 | 141 | 66 |
| Sonde Verger | b26s003 | 12/08 11 h 00 | 56 | 17 |

- Signature HMAC : **330 livraisons valides**, une seule refusée (leur essai avant réglage de la clé).
- Aucune erreur applicative sur les 3 vraies sondes ; horodatage, unités et fiche capteur à jour.
- Cadence actuelle : environ **une livraison toutes les 2 minutes par sonde**, jour et nuit — leur réduction de fréquence est bienvenue (une toutes les 15 à 30 min suffit largement).

## Trois anomalies à leur signaler

1. **Trois livraisons sur quatre arrivent vides** — 243 des 330 envois contiennent `"measures": {}`. Exemple reçu à 07 h 24 sur b26s001 : enveloppe complète (plot, probe, rssi) mais objet de mesures vide. Ce sont des envois inutiles ; c'est probablement le même relevé republié sans nouveau point.
2. **Batterie systématiquement à 0** — `batteryPercentage: 0` sur tous les envois des trois sondes, alors que le signal radio est bon (rssi −48 à −67). Champ manifestement non renseigné côté passerelle.
3. **Aucune humidité de sol par profondeur** — on ne reçoit que `soil_capacitance` en volts (0,397 à 0,457 V), sans profondeur associée. Les sondes sont pourtant des 5/15, 5/30 et 30/60 : il manque l'humidité volumique par horizon (ou, à défaut, la table de conversion tension → humidité). C'est la donnée agronomique clé pour le registre de sol.

Reçu et exploité aujourd'hui : température de l'air, humidité de l'air, luminosité, indice UV, capacitance de sol.

## Ce que je propose de faire côté application

1. **Filtrer les livraisons vides du journal** — les regrouper sous un état « reçue sans relevé » avec un compteur, au lieu de noyer le journal des livraisons. Elles restent consultables en dépliant.
2. **Marquer les sondes en « données partielles »** — pastille sur la fiche capteur quand aucune humidité de sol n'est arrivée depuis 24 h, avec la mention du champ manquant, pour ne pas lire un registre de sol incomplet sans le savoir.
3. **Ignorer la batterie tant qu'elle vaut 0** — afficher « non communiquée » plutôt qu'une jauge vide alarmante.
4. **Purger les 8 livraisons de leur sonde d'essai** (`test-probe-001`, capteur inconnu) du poste de contrôle, ou les ranger dans un onglet « essais fournisseur ».
5. **Fiche de retour à BRAD** — je rédige le message de confirmation avec les trois points ci-dessus et la cadence souhaitée.

### Détail technique

- Lecture seule pour l'analyse ; aucune donnée modifiée.
- Points 1 à 3 : affichage uniquement (`AdminIot`, `SensorDrawer`, `useIotTelemetry`), aucun changement de schéma.
- Point 4 : suppression ciblée des lignes `iot_webhook_deliveries` avec `serial_number = 'test-probe-001'`, ou simple filtre d'affichage si vous préférez tout conserver.
