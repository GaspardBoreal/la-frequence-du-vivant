# Observatoire : afficher réellement toute la période choisie

## Le problème

En 24 h, la sonde renvoie 390 relevés : tout tient, tout s'affiche. Dès 7 jours (et pire en 30 j, 90 j, 1 an), l'écran affiche exactement « 1000 relevés » — le plafond de lecture de la base. Les relevés sont lus du **plus ancien au plus récent**, donc les 1000 premiers correspondent au **début** de la période : les jours récents, dont aujourd'hui, sont purement absents des courbes. C'est pour ça que la fenêtre 30 jours s'arrête au 11/08 pour l'humidité du sol.

Le compteur figé à « 1000 relevés » sur toutes les périodes longues est la signature de ce plafond.

## Le correctif

Lire la plage par pages successives, en partant du **plus récent**, jusqu'à couvrir toute la période demandée :

- pagination par tranches de 1000 relevés, exactement comme le fait déjà la lecture des fenêtres glissantes de la console ;
- ordre décroissant à la lecture (le récent d'abord), puis remise en ordre chronologique avant l'affichage : si un plafond est atteint, ce sont les relevés les plus anciens qui manquent, jamais le jour en cours ;
- plafond de sécurité par sonde (de l'ordre de 20 000 relevés) pour rester frugal sur « 1 an » ;
- quand le plafond est atteint, une mention discrète sous le sélecteur de période : « lecture plafonnée — les relevés les plus anciens ne sont pas pris en compte », dans le même langage que la ligne de couverture déjà utilisée ailleurs.

Le correctif est au niveau de la lecture des mesures : il s'applique donc à **tous les types de capteurs** (sol, station météo, à venir) et à toutes les grandeurs, sans distinction.

## Vérification

Après correction, sur la sonde Potager d'Été : la fenêtre 7 jours doit se terminer au 19/08 (aujourd'hui) et non au 16/08, le compteur ne doit plus être bloqué sur 1000, et les courbes 30 j doivent couvrir jusqu'à maintenant. Contrôle identique sur la station météo b26w002.

## Détails techniques

- `src/hooks/iot/useIotTelemetry.ts` — `useMesureSeriesRange` : remplacer le `.limit(20000)` (inopérant, PostgREST coupe à 1000) par une boucle `.range(offset, offset + 999)` en `order('mesure_at', { ascending: false })`, arrêt quand une page est incomplète ou quand le plafond est atteint ; retour d'un objet `{ rows, truncated }` (rows re-triées en ascendant) plutôt qu'un tableau nu.
- `src/components/iot/SensorObservatory.tsx` : adapter au nouveau retour, afficher l'indicateur de troncature à côté du compteur « n relevés · n grandeurs ». Les exports CSV / Markdown bénéficient automatiquement des séries complètes.
- Vérifier les autres appelants de `useMesureSeriesRange` (`useIot.ts`, `SensorDrawer.tsx`) et les aligner sur la nouvelle forme de retour.
- Aucun changement de schéma, de RLS ni de collecte.
