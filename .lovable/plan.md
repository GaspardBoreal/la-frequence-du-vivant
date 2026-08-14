# Sonde météo BRAD : notre recommandation d'intégration

## Réponse courte à Olivier

**Une sonde de plein exercice.** La station météo doit avoir son propre numéro de série et envoyer ses propres trames, exactement comme les trois sondes de sol. Pas de météo greffée dans le payload des sondes de sol.

Trois raisons :

1. **Fréquences différentes.** Une station météo respire toutes les 10-15 minutes, une sonde de sol toutes les heures. Coller la météo au payload sol, c'est soit sur-échantillonner, soit perdre les pics de pluie et de vent — précisément ce qui explique un assèchement.
2. **Traçabilité de la source.** AccuWeather (modèle) et station maison (mesure) ne se valent pas scientifiquement. Un capteur distinct permet d'afficher honnêtement l'origine de la donnée ; une valeur noyée dans un payload sol devient indistincte.
3. **Croisement plus riche, pas moins.** Le croisement pluie/humidité de sol se fait déjà chez nous par horodatage — deux séries indépendantes se croisent parfaitement, et on gagne en plus la météo seule (bilan hydrique, gel, ETP).

**Ce qu'on accepte volontiers en complément** : un petit bloc `context` optionnel dans les trames sol (température et humidité d'air au moment du relevé, source indiquée). Utile comme repère de lecture, jamais comme série météo de référence.

## Ce que ça change côté BRAD (rien de lourd)

- Déclarer la station comme une sonde de plus, avec son `serialNumber`.
- Même webhook, même signature HMAC, même format `measures`.
- Clés attendues : `temperature`, `humidity`, `pressure`, `rainfall`, `luminosity`, `ultraviolet`, `dewPoint`, `windSpeed`, `windGust`, `windDirection`.
- Ajouter dans `probe` un champ `source` : `station` ou `accuweather`.

## Ce que nous ferons de notre côté

1. **Dictionnaire des grandeurs** : ajouter vent (rafale, direction) et compléter les libellés — `wind_speed` existe déjà, `wind_gust` et `wind_direction` manquent.
2. **Webhook `iot-webhook-brad`** : accepter les nouvelles clés, mémoriser la source (`station` / `accuweather` / `webhook`) sur chaque mesure, et absorber le bloc `context` optionnel s'il arrive.
3. **Catalogue** : nouvelle famille de type de capteur « station météo », avec sa fiche et sa pastille propre sur la carte des sondes.
4. **Fiche sonde météo** : cadran des conditions du moment (pluie du jour, cumul 7 j, températures min/max, vent, UV) plutôt que le verdict agronomique des sondes de sol.
5. **Croisement pluie / sol** : dans l'Observatoire, superposer la pluviométrie en barres derrière les courbes d'humidité de sol des sondes de la même propriété. C'est la lecture qu'attend un jardinier : « il a plu 8 mm, l'humidité à 15 cm est montée de 4 points, à 30 cm rien ».
6. **IA de Jardin** : nouveau contexte météo frugal (7 et 30 derniers jours agrégés) pour que les réponses tiennent compte de la pluie et de la chaleur réellement mesurées.

## Détails techniques

- Aucune migration de table : `iot_capteurs` / `iot_mesures` accueillent la station telle quelle. On ajoute seulement les nouvelles valeurs de `grandeur` et on renseigne `source`.
- La météo modèle (AccuWeather) sera marquée distinctement de la mesure station, pour ne jamais mélanger observé et prédit dans les graphes.
- Les seuils de confort restent définis dans `src/lib/iot/grandeurs.ts`.
- Zéro impact sur les trois sondes de sol existantes et sur les URL publiques.

## Message prêt à envoyer à BRAD

> Sonde de plein exercice, sans hésiter : même webhook, même signature, un `serialNumber` dédié et ses propres trames météo. Le croisement avec les sondes de sol se fait chez nous par horodatage, on ne perd rien et on gagne la finesse temporelle de la météo. Si tu veux, ajoute un champ `source` (`station` ou `accuweather`) dans le bloc `probe` pour qu'on distingue la mesure du modèle. Optionnellement, un petit bloc `context` (température/humidité d'air) dans les trames sol nous sert de repère de lecture — mais il ne remplace pas la station.
