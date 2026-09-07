# Un graphe vivant pour l'électricité par pays

Dans la section « Un repère commun aux quatre outils : d'où vient l'électricité »,
les sept valeurs (Suède 40,7 · France 56,0 · États-Unis 369,5 · Allemagne 381,0 ·
Chine 582,3 · Pologne 661,9 · Moyenne mondiale 475) sont aujourd'hui de simples
cartons de chiffres. On les remplace par un graphe qui fait sentir l'écart.

## Ce que le visiteur voit

- Des barres horizontales classées de la plus propre à la plus chargée, chacune
  proportionnelle à sa valeur, avec le nom du pays à gauche et le chiffre en
  chiffres alignés à droite.
- Un dégradé de teinte du vert profond (bas carbone) à l'ambre/rouge sobre
  (haut carbone), pris dans les couleurs du thème, jamais en dur.
- La **moyenne mondiale** matérialisée par un trait vertical en pointillés qui
  traverse tout le graphe, étiqueté « moyenne mondiale 475 » : on voit d'un coup
  qui est au-dessus, qui est en dessous.
- Animation d'entrée : les barres poussent de la gauche l'une après l'autre
  quand la section arrive à l'écran, et les chiffres montent jusqu'à leur valeur.
  Rien ne bouge si le visiteur a demandé moins d'animations.
- Au survol (ou à l'appui sur mobile) : la barre s'éclaircit et une phrase de
  lecture apparaît sous le graphe, du type « un même calcul émet 16 fois plus en
  Pologne qu'en Suède » — rapport calculé, jamais écrit à la main.
- Mobile d'abord : barres pleine largeur, hauteur confortable, aucun défilement
  horizontal ; la liste de cartons actuelle disparaît au profit du graphe.

La note de source et la phrase d'explication restent inchangées sous le graphe.

## Détails techniques

- Nouveau `src/components/ia-frugale/IntensiteCarboneChart.tsx` : SVG/flex
  calculé à partir de `PAYS` importé de `src/content/iaFrugale/outilsMesure.ts`
  (aucune valeur recopiée), tri par `ci`, largeur = `ci / max`.
- Apparition pilotée par `IntersectionObserver` + transition CSS sur `width`,
  décalage par index ; compteurs via l'`AnimatedCounter` existant s'il convient,
  sinon `requestAnimationFrame` local. `prefers-reduced-motion` coupe tout et
  affiche l'état final.
- Couleurs via tokens sémantiques du thème (variables HSL déjà définies pour la
  page, `--frugal-*` et tokens de base) — aucune couleur littérale.
- `src/pages/IaFrugaleOutils.tsx` : la `<ul>` des cartons pays est remplacée par
  `<IntensiteCarboneChart />` ; `SourceNote` conservé.
- Aucune dépendance nouvelle, pas de Recharts, pas de changement de données.

## Vérification

Page ouverte à 375 px et 1280 px, thèmes clair et sombre ; contrôle que chaque
barre correspond bien à la valeur affichée et que le repère mondial tombe au bon
endroit.
