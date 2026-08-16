# Lisibilité de la liste « Sondes du parc »

## Ce que veut dire ce « 0 % » aujourd'hui

Vérification en base : c'est le **niveau de batterie** (`iot_capteurs.battery_pct`). Les trois sondes de sol (b26s001, b26s002, b26s003) ont la valeur `0`, la station météo (b26w002) a la valeur vide — d'où la ligne sans pourcentage. Brad envoie donc un `0` par défaut au lieu de ne rien envoyer : ce n'est pas une batterie vide, c'est une **batterie non transmise**.

Le problème d'affichage : un pourcentage nu, sans étiquette, se lit comme un taux d'humidité ou de fiabilité, et « 0 % » laisse croire à une panne imminente.

## Ce que je propose

Remplacer la ligne de droite par une lecture en trois temps, du plus parlant au plus technique :

1. **Une pastille d'état** en tête de ligne, couleur + mot :
   - **En ligne** — vue il y a moins de 2 h
   - **En veille** — vue dans la journée mais au-delà de 2 h
   - **Silencieuse** — au-delà du seuil d'alerte de la sonde
   - **Jamais vue** — aucune remontée
2. **Le lieu et la fraîcheur** en clair : `Jardin Monde DEVIAT · vue il y a 19 min`.
3. **La batterie seulement quand elle a du sens** : `Batterie 62 %`. Si la valeur est absente ou vaut `0` pour un modèle qui ne remonte pas cette donnée, afficher `Batterie non transmise` en gris atténué — jamais « 0 % » nu.

Ajout d'une légende discrète sous la liste rappelant la signification des trois états, dans le même ton sobre que le reste de la console.

## Détails techniques

- Fichier : `src/components/iot/console/IotPartnerHome.tsx` (liste « Sondes du parc »).
- Nouveau petit utilitaire de statut (seuils : 2 h pour « en veille », `silence_alert_hours` pour « silencieuse ») placé à côté du composant, réutilisable ensuite par `admin/iot`.
- Règle batterie : `battery_pct == null || battery_pct === 0` → libellé « Batterie non transmise ». Aucune modification du webhook ni de la base ; c'est purement de l'affichage.
- Si la même ligne « 0 % » apparaît dans la console admin IoT, appliquer le même rendu pour rester cohérent.
