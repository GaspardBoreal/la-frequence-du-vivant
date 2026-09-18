# Rendre « ISEG » (et les pages oubliées) trouvables dans la recherche

## Le constat, vérifié

Le catalogue de recherche contient 49 pages. Aucune ne concerne l'ISEG : ni la page
`/formations/isegcom-bordeaux` (qui existe bien et parle de l'ISEGCOM Bordeaux, des MBA et
des 13 projets d'élèves), ni aucun mot-clé « iseg ». Le moteur cherche correctement — il
n'a simplement rien à trouver.

Plus largement, le site publie environ 88 adresses publiques alors que 49 seulement sont
recensées : une bonne partie des pages récentes (formations, VDTP, guides, pages partenaires,
entretiens, robot, etc.) ne sont donc pas trouvables non plus.

## Ce qui change pour le visiteur

- Taper « iseg », « isegcom », « formation », « bordeaux », « MBA », « prompt », « étudiants »
  amène la page de la formation ISEGCOM Bordeaux.
- Les pages publiques aujourd'hui absentes du catalogue deviennent trouvables, classées dans
  le bon univers.
- Recherche sans accent et avec une petite faute de frappe : déjà géré par le moteur.

## Ce que je fais

1. **Ajout de la page ISEG** au catalogue : adresse `/formations/isegcom-bordeaux`, titre
   « Formation IA Générative × Impact — ISEGCOM Bordeaux », sous-titre mentionnant Laurent
   Tripied et les MBA, univers « La Fréquence du Vivant », mots-clés : iseg, isegcom, école,
   formation, Bordeaux, MBA, communication, étudiants, prompt, intelligence artificielle,
   science participative, projets.
2. **Recensement complet** : comparaison des adresses publiques réellement servies par le site
   avec le catalogue, puis ajout d'une ligne par page manquante (titre, sous-titre, univers,
   mots-clés utiles, priorité modérée). Les espaces privés, l'administration, la connexion et
   les adresses à paramètre restent exclus.
3. **Enrichissement des mots-clés** des pages existantes qui manquent visiblement de noms
   propres (écoles, partenaires, lieux, personnes).

Tout reste ensuite modifiable depuis Outils → « Moteur de recherche du site ».

## Détails techniques

- Une seule migration d'insertion dans `site_pages` :
  `INSERT ... ON CONFLICT (path) DO UPDATE` sur title/subtitle/univers/keywords.
  Aucun changement de schéma, de RLS ni de grants.
- Le moteur (`src/lib/search/siteSearch.ts`) reste inchangé : le score mots-clés + la
  tolérance à une faute couvrent déjà « iseg ».
- Les adresses sont dérivées des routes déclarées dans `src/App.tsx` (routes statiques
  publiques uniquement), pas inventées.
