## Problème

Dans `J'identifie → Carte des révélations`, la popup d'un point affiche `w.commonName || w.scientificName` — soit le nom brut venu d'iNaturalist, donc souvent en anglais (« Cuckooflower »).

Juste au-dessus, le bandeau « Ce que la Fréquence du Vivant sait déjà » passe par le résolveur FR centralisé (`useFrenchSpeciesNamesAuto` / `<SpeciesName />`), d'où « Cardamine des prés ».

## Correction

Dans `src/components/propriete/identify/blocks/RevealMapBlock.tsx` :

1. Appeler `useFrenchSpeciesNamesAuto` une seule fois au niveau du composant, avec la liste dédupliquée `{ scientificName, commonName }` issue de `waypoints` (pas des points filtrés, pour éviter de relancer une requête à chaque changement de filtre).
2. Dans la popup, remplacer `w.commonName || w.scientificName` par le `displayName` renvoyé par la map du hook, avec repli sur `commonName` puis `scientificName` (aucun blanc possible). Le nom scientifique en italique reste inchangé dessous.
3. Ne pas utiliser `<SpeciesName />` ici : le contenu de la popup Leaflet est stylé en inline styles compacts ; on réutilise le même hook (même source de vérité, même cache React Query) sans changer le rendu visuel.

Aucun changement de données, de comptage, de filtre ni de carte : uniquement l'affichage du libellé.