# Analyses : la station météo n'est pas silencieuse, ses mesures n'arrivent jamais à l'écran

## Le diagnostic (vérifié en base)

La Station météo a bien transmis : 55 relevés de température de l'air et 55 d'humidité de l'air sur les dernières 15 heures, tous valides (`rejected = false`, `source = webhook`), le dernier à 10:42 Paris. La frise horaire les affiche correctement (copie 1).

L'onglet Analyses affiche pourtant « Station silencieuse ». La cause n'est ni le profil de famille, ni le calcul du climat : c'est la **lecture des mesures qui est tronquée**.

L'API de données plafonne toute réponse à 1 000 lignes (`max_rows = 1000`). La requête de la fenêtre d'analyse demande 20 000 lignes, triées **du plus ancien au plus récent**, pour toutes les sondes à la fois. Sur 7 jours, il y a 3 642 relevés valides : seules les 1 000 **plus anciennes** arrivent — c'est-à-dire les journées du 10 au 12 août. La Station météo n'émettant que depuis le 16 août, aucune de ses lignes n'entre dans le lot. Elle apparaît donc muette.

Conséquence plus large, invisible mais grave : **toutes les analyses de sol des autres sondes sont calculées sur des données périmées et partielles** (verdict, budget d'eau, tapis d'humidité, fenêtres de plantation, degrés-jours). Les chiffres affichés ne décrivent pas la fenêtre annoncée.

## Ce qu'on corrige

1. **Lire toute la fenêtre, sonde par sonde.** La lecture des mesures se fait en pages successives de 1 000 lignes jusqu'à épuisement, par sonde, en parallèle — plus aucune troncature silencieuse, quelle que soit la cadence des sondes ou la fenêtre choisie (7 / 30 / 90 jours).

2. **Un garde-fou qui parle.** Si un plafond est malgré tout atteint (fenêtre très longue, flotte nombreuse), l'entête de l'onglet le dit : « lecture partielle : N relevés lus, les plus anciens ne sont pas pris en compte » — jamais un verdict présenté comme complet sur une donnée coupée.

3. **La couverture réelle affichée par sonde.** Chaque carte annonce la période effectivement lue (« du 16 août 20:15 au 17 août 10:42 · 110 relevés ») et non la fenêtre théorique. Une sonde installée depuis la veille ne peut pas prétendre parler de 7 jours.

4. **Distinguer « pas de donnée » de « donnée non lue ».** Le verdict « Station silencieuse » n'est prononcé que si la sonde n'a réellement rien transmis ; s'il manque des mesures pour cause de lecture incomplète, le message le dit autrement.

5. **Même correction partout où le plafond mord.** Les autres lectures de télémétrie limitées à 1 000 lignes sont revues pour trier du plus récent au plus ancien, afin qu'une troncature ne coupe jamais l'actualité.

## Détails techniques

- `src/hooks/iot/useIotTelemetry.ts` — `useMesuresWindow` : boucle de pagination `.range(offset, offset + 999)` par capteur (requêtes parallèles via `Promise.all`), arrêt quand une page renvoie moins de 1 000 lignes ou qu'un plafond de sécurité (25 000 lignes agrégées) est atteint ; retour `{ rows, truncated, perSensorSpan }`. Les deux autres requêtes `.limit(1000)` (lignes 267 et 287) passent en `order('mesure_at', { ascending: false })` puis ré-inversion en mémoire.
- `src/hooks/iot/useIotAnalyses.ts` — propage `truncated` et la couverture par sonde (`firstAt` / `lastAt` / `count`) issue des mesures effectivement lues.
- `src/lib/iot/analyses.ts` — `assessQuality` reçoit la couverture réelle ; `weatherVerdict` ne renvoie « Station silencieuse » que si `series` est vide **et** la lecture est complète, sinon un message « lecture incomplète ».
- `src/components/iot/analyses/AnalysesTab.tsx` — bandeau de troncature ; `ClimateCard.tsx` et `SimpleVerdictCard.tsx` — ligne de couverture (période lue + nombre de relevés).
- Aucune migration, aucune modification de RLS, aucune écriture de données.
