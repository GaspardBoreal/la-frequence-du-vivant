# Ordre de lecture identique d'une sonde à l'autre

Aujourd'hui les vignettes du widget « heure ouverte » suivent l'ordre d'arrivée des lignes en base : la Sonde Potager d'Été commence par l'humidité du sol, celle d'Hiver par l'indice UV. La comparaison œil à œil devient pénible.

## Ce que voit l'utilisateur

- Les grandeurs s'affichent toujours dans le même ordre canonique, quelle que soit la sonde, la trame ou le fournisseur :
  sol (humidité, température, capacitance) → air (température, humidité, point de rosée, pression) → ciel (luminosité, infrarouge, indice UV, pluviométrie, vent) → sonde (tension batterie).
- À grandeur identique, tri par profondeur croissante (5 cm avant 30 cm).
- Une grandeur inconnue du référentiel se range en fin de liste, par ordre alphabétique — rien ne disparaît jamais.
- Effet direct sur la copie d'écran : « Humidité du sol / Capacitance / Température de l'air / Humidité de l'air / Luminosité / Indice UV » se lisent à la même place sur les deux sondes ; les cases manquantes d'une sonde restent simplement absentes, mais l'alignement de lecture est conservé.

## Détails techniques

- `src/lib/iot/grandeurs.ts` : l'objet `GRANDEURS` est déjà déclaré dans l'ordre voulu. On expose `GRANDEUR_ORDER = Object.keys(GRANDEURS)` et un comparateur `compareGrandeurs(a, b)` (index dans l'ordre, `Infinity` si absent, puis label alphabétique, puis profondeur).
- `src/components/iot/HourMesuresWidget.tsx` : trier `current[1]` avec ce comparateur avant le rendu de la grille.
- Même comparateur appliqué partout où une liste de grandeurs est rendue pour rester cohérent : `SensorDrawer`, `SensorObservatory` et les vignettes de mesures du jardin (vérification et application au cas par cas).
- Aucun changement de données, de requête ni de RLS : c'est un tri d'affichage.
