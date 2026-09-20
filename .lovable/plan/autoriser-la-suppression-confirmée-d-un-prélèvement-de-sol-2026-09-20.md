# Autoriser la suppression confirmée d’un prélèvement de sol

## Diagnostic vérifié

- **Maison sous Blossac contient actuellement trois prélèvements : A, C et F.** A et C portent les observations en cours ; F ne contient qu’une position GPS.
- Le bouton de suppression de F est volontairement désactivé par la règle actuelle qui impose **au moins 3 prélèvements**. C’est pourquoi la fenêtre de confirmation ne s’ouvre pas.
- La suppression confirmée existe déjà et le garde-fou de la base accepte déjà une suppression explicitement demandée. Le blocage se situe donc dans la limite affichée et appliquée par l’écran.
- L’historique montre plusieurs ajouts et retraits récents de points B, D, E et F. La suppression de F doit être enregistrée immédiatement et les erreurs ne doivent plus être silencieuses.

## Correction

1. Passer le minimum autorisé de **3 à 2 prélèvements** dans la règle commune du registre.
2. Mettre à jour les libellés afin d’afficher « 2 à 10 échantillons représentatifs » partout.
3. Activer la croix de suppression lorsque trois points sont présents ; un clic ouvre la fenêtre existante demandant confirmation et précisant les données supprimées.
4. Après confirmation, retirer F de la carte et de toutes les lectures du sol, puis enregistrer explicitement la nouvelle liste A + C.
5. Afficher une erreur claire si cet enregistrement échoue et restaurer F à l’écran, au lieu de masquer l’échec.
6. Conserver l’action « Annuler » après une suppression réussie.
7. Stabiliser le retrait du marqueur Leaflet afin d’éviter l’erreur `_leaflet_pos` observée pendant les changements rapides de points ou de vue.

## Vérifications

- Ouvrir Maison sous Blossac → Analyse avec A, C et F.
- Cliquer sur la croix de F, annuler une première fois, puis confirmer.
- Vérifier que seuls A et C restent après l’enregistrement et après rechargement de la page.
- Vérifier qu’à deux prélèvements les croix sont désactivées, sans empêcher les modifications de A et C.
- Vérifier la carte en vue normale et plein écran, sans écran blanc ni erreur Leaflet.

## Périmètre

La refonte de `/jardin/demarrer` reste en attente juste après ce correctif prioritaire ; aucune donnée de Maison sous Blossac ne sera supprimée automatiquement pendant la mise en place.
