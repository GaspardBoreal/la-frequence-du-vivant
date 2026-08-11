# Où en est l'intégration BRAD, et comment la contrôler à l'œil

## État réel constaté (données du jour)

| Sonde | N° série | Mesures totales | Dont reçues par webhook | Dernière mesure |
|---|---|---|---|---|
| Sonde Potager d'Été | b26s002 | 29 | 6 | 11/08 16 h 22 (Paris) |
| Sonde Potager d'Hiver | b26s001 | 157 | 0 | 11/08 09 h 01 |
| Sonde Verger | b26s003 | 123 | 0 | 11/08 09 h 15 |

Le registre des livraisons ne contient **qu'un seul envoi**, celui du test signé (`test-1786458128`, signature valide, 6 mesures, sonde b26s002). Tout le reste vient de l'import CSV historique.

Conclusion : la chaîne technique fonctionne de bout en bout (signature HMAC vérifiée, mesures normalisées, horodatage, fiche capteur mise à jour), mais **BRAD n'émet pas encore vers notre URL** : aucune livraison spontanée n'est arrivée depuis le test. Il reste une action côté fournisseur — déclarer l'URL du webhook et la clé partagée pour les trois numéros de série.

## Ce qui manque pour contrôler visuellement

Aujourd'hui, pour savoir si « ça remonte », il faut ouvrir la fiche d'une sonde et interpréter des dates. Il n'existe aucun endroit qui dise, d'un coup d'œil : *ça vit / ça s'est tu / c'est refusé*.

## Ce que je propose de construire

**Un « Poste de contrôle télémétrie » dans `/admin/iot`**, en trois blocs, plus un rappel léger côté propriété.

1. **Bandeau « En direct »**
   - Pastille pulsante verte dès qu'une mesure arrive (abonnement temps réel sur les mesures) ; le compteur « dernière réception il y a X » se met à jour tout seul, sans recharger la page.
   - Trois compteurs : livraisons acceptées (24 h), signatures refusées (24 h), sondes silencieuses.

2. **Journal des livraisons, lisible**
   - Liste antéchronologique : heure de Paris, sonde, canal (webhook / import CSV), nombre de mesures, état de signature, message d'erreur éventuel.
   - Filtre par sonde et par état ; ligne dépliable montrant la charge utile brute reçue, pour lever tout doute sur ce que BRAD envoie vraiment.

3. **Frise de vitalité par sonde**
   - Une bande de 48 h par sonde, une encoche par réception : on voit instantanément le rythme réel (toutes les heures ? deux fois par jour ? plus rien depuis ce matin ?).
   - Distinction visuelle nette entre les points issus du webhook et ceux issus de l'import historique, pour ne plus confondre données vivantes et données rejouées.

4. **Bouton « Tester la remontée »**
   - Envoie une livraison signée factice sur la sonde choisie, puis affiche le résultat en clair (reçue / signature refusée / sonde inconnue). Les mesures de test sont marquées comme telles pour ne pas polluer les courbes.

5. **Rappel dans « Capteurs et sondes » (espace propriété)**
   - Sur chaque carte de sonde : « Dernier signal il y a X » déjà présent, complété par une micro-frise 24 h et une pastille « en direct » quand une mesure arrive pendant la consultation.

## Détail technique

- Lecture seule côté base pour les blocs 1 à 3 : agrégations sur `iot_webhook_deliveries` et `iot_mesures`, plus un abonnement temps réel (à activer sur ces deux tables) pour le rafraîchissement sans rechargement.
- Marquage des livraisons de test : champ `source`/`delivery_id` préfixé, filtré dans les courbes de la fiche capteur.
- Le bouton de test appelle la fonction `iot-webhook-brad` avec une signature HMAC calculée côté serveur (clé jamais exposée au navigateur) — via une petite fonction dédiée réservée aux admins.
- Aucune modification des données existantes, aucun changement d'URL publique.

## Action hors application

Pour que le flux devienne réel, il faut transmettre à BRAD TECHNOLOGY l'URL du webhook et la clé de signature, et faire déclarer les trois numéros de série (b26s001, b26s002, b26s003). Je peux préparer la fiche de raccordement à leur envoyer si vous le souhaitez.
