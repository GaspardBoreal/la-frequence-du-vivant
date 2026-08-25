# Animation du hero : la descente dans le sol

Le visuel actuel (`ListenVisual`) est statique : trois couches de terre, une sonde fixe, quatre anneaux qui pulsent. Il devient une séquence de sondage en boucle, calme et précise, lisible en 12 secondes.

## Le récit visuel (boucle continue, ~12 s)

1. **Repos** : surface, deux plantes jeunes, sonde posée au sol.
2. **Descente -15 cm** : la sonde plonge jusqu'au premier palier, un trait de cote apparait à gauche (`-15 cm`), les anneaux d'écoute partent de la pointe et non plus de la surface.
3. **Traces du vivant** : à chaque palier, quelques signes très symboliques s'allument en fondu autour de la pointe puis s'estompent : un fil mycélien qui se ramifie, un arc de lombric, deux ou trois points de micro-faune, une radicelle. Un vocabulaire différent par profondeur (racines fines et mycélium à -15, lombric et agrégats à -30, radicelles profondes et minéral à -60).
4. **-30 cm puis -60 cm** : même geste, palier plus lent, lumière plus sourde en descendant.
5. **Remontée** douce, les cotes s'effacent, la boucle repart.

Pendant tout ce temps, **les deux plantes poussent sur leur propre horloge** : cycles de durées différentes (par ex. 9 s et 14 s), décalés, jamais alignés avec les paliers de la sonde. Une plante monte pendant que l'autre marque un palier : le végétal et la mesure ne battent pas au même rythme, ce qui est exactement le propos.

## Parti pris graphique

- Palette existante uniquement (vert sombre, terres, ambre, crème) : aucune couleur nouvelle.
- Traits fins, formes symboliques, jamais illustratives ni « cartoon ».
- Les cotes de profondeur en petites capitales espacées, alignées sur un filet fin à gauche, dans le style typographique de la page.
- Les strates gagnent un très léger grain / dégradé pour la profondeur, sans bruit visuel.
- Anneaux d'écoute repositionnés dynamiquement à la pointe de la sonde.

## Accessibilité et impression

- `prefers-reduced-motion` : tout se fige sur l'état -30 cm, les trois cotes visibles, plantes adultes, aucune animation.
- Impression PDF : même état figé (la règle print existante neutralise déjà les animations, elle sera étendue aux nouveaux éléments) pour que la page 1 du PDF montre un visuel complet et lisible.

## Détails techniques

- `src/pages/PartnersSoilAcoustics.tsx` : `ListenVisual` réécrit. SVG `520x400` conservé, structuré en groupes nommés (`sa-probe`, `sa-depth`, `sa-traces--15/30/60`, `sa-plant--a`, `sa-plant--b`). Aucun état React, aucune dépendance ajoutée : tout en CSS.
- `src/styles/soil-acoustics.css` : nouveaux `@keyframes` (descente de la sonde, apparition des cotes, fondu des traces, croissance des deux plantes via `transform: scaleY` sur origine basse), durées et délais distincts par plante. Bloc `prefers-reduced-motion` et bloc `@media print` mis à jour.
- Aucun autre fichier touché, contenu FR/EN inchangé.
