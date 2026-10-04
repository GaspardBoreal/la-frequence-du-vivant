# Filtre par date dans la vue Marche

## Objectif
Dans Mon espace → exploration → onglet Marches (fiche d'une marche, bloc « Inventaire collecté »), ajouter le même choix de période que dans Biodiversité → Taxons observés, présenté dans un bandeau élégant et compact.

## Ce que verra l'utilisateur
- Un bandeau unique fusionné avec l'en-tête « Inventaire collecté » :
  - à gauche : « Inventaire collecté · 186 espèces (rayon 50 m) » ;
  - à droite : une pastille « Période : Tout » ouvrant la liste (Aujourd'hui, 7 derniers jours, 30 derniers jours, Mois dernier, Trimestre dernier, 6 derniers mois, Année en cours, 12 mois glissants, Tout, Période personnalisée…) ;
  - « Période personnalisée » ouvre un calendrier double (du / au) dans la même pastille.
- Quand une période est active : le compteur devient « 42 espèces sur 186 · 30 derniers jours », une petite croix « Réinitialiser » apparaît, et la grille, les onglets Faune/Flore, les compteurs Marcheurs / iNaturalist suivent le filtre.
- Indicateur discret « Date terrain » (date réelle d'observation) comme dans Taxons observés.
- Mobile first : sur petit écran, la pastille passe sous le titre en pleine largeur ; puces arrondies, couleurs émeraude du thème, aucune surcharge.
- Le choix reste propre à la marche consultée (revient à « Tout » au changement de marche).

## Règles de filtrage
- Une espèce est conservée si au moins une de ses observations (marcheurs ou iNaturalist) a une date terrain dans la période ; son nombre d'observations et sa dernière date sont recalculés sur la période.
- Les espèces sans date restent visibles uniquement sur « Tout ».
- Le rayon canonique de la marche continue de s'appliquer avant le filtre de date.

## Détails techniques
- Réutiliser `resolvePeriodRange` et le type `EvolutionPeriod` (`useBiodiversityEvolution`) ; extraire la liste d'options de `VivantPeriodFilter` en constante partagée pour éviter une troisième copie.
- Nouveau composant `MarchePeriodBar` (Popover + Calendar shadcn, `pointer-events-auto`), tokens sémantiques uniquement.
- Dans `MarcheDetailModal.tsx` : état `period`/`customRange`, filtrage de `filteredLive` par dates d'attribution (`attributions[].date` / `observationDate`), remplacement de l'en-tête « Inventaire collecté » par le bandeau fusionné ; `SpeciesExplorer` reçoit la liste filtrée (aucun changement interne).
- Aucun changement de base de données.
