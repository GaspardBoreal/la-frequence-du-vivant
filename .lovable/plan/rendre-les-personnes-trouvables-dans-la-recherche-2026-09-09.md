# Rendre les personnes trouvables dans la recherche

## Le constat

Le catalogue de recherche contient aujourd'hui 32 pages, dont une seule entrée pour les
entretiens : la page d'accueil « Les entretiens ». Les entretiens individuels (Gaspard Boréal,
Laurent Tripied, Laurence Karki, Victor Boixeda, bziiit/PiloTerra) n'y figurent pas, et aucun
nom de personne n'est présent dans les mots-clés. Chercher « karki », « tripied » ou
« boixeda » ne peut donc rien renvoyer : le moteur cherche bien, mais il n'y a rien à trouver.

## Ce qui change pour le visiteur

- Taper un nom (karki, tripied, boixeda, boréal, bziiit, piloterra) affiche l'entretien
  correspondant, dans le groupe « La Fréquence du Vivant ».
- Chaque entretien publié devient une page trouvable à part entière, avec son titre, la
  personne, son rôle, et des mots-clés utiles (nom, prénom, fonction, sujets abordés :
  marches du vivant, fréquence jardin, open source, biodiversité, communauté, ambassadrice…).
- Les recherches par prénom seul, par nom seul, sans accent et avec une petite faute de
  frappe fonctionnent (la tolérance existe déjà, il lui manquait la matière).

## Ce que je fais

1. Ajout au catalogue des entretiens publiés, une ligne par entretien : adresse
   `/entretiens/<slug>`, titre de l'entretien, sous-titre « Nom — rôle », univers
   « La Fréquence du Vivant », mots-clés nom/prénom/fonction/thèmes, priorité modérée.
2. Enrichissement des mots-clés de la page `/entretiens` avec les noms des personnes, pour
   qu'elle remonte aussi comme porte d'entrée.
3. Passage de relecture du reste du catalogue : ajout des noms propres et des synonymes
   manquants sur les pages existantes qui en manquent visiblement (personnes, lieux, marques).

Tout reste modifiable ensuite depuis Outils → « Moteur de recherche du site » : je pose la
matière initiale, vous corrigez au fil des retours.

## Détails techniques

- Une migration d'insertion dans `site_pages` (INSERT ... ON CONFLICT (path) DO UPDATE sur
  title/subtitle/keywords), sans changement de schéma ni de politique RLS.
- La source de vérité des entretiens est `src/content/entretiens/index.ts` (slug, personne,
  rôle, chapô) : les lignes insérées sont dérivées de ce fichier, statut `published`
  uniquement — les entretiens « à paraître » ne sont pas indexés.
- Aucun changement du moteur (`src/lib/search/siteSearch.ts`) : la pondération mots-clés
  et la tolérance à une faute couvrent déjà les recherches par nom.
