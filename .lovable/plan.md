# Filtre « Mes tags » — uniquement les tags de l'utilisateur connecté

## Constat
- **Taxons observés** : le bouton « Mes tags » existe déjà, mais sa liste lit tous les tags visibles. Pour un compte admin (le vôtre), les règles d'accès laissent voir les tags de **tous** les marcheurs, d'où des tags comme « planté_par_communauté_marcheur » qui ne sont pas les vôtres.
- **Atelier → Calques** : le filtre par tags existe seulement dans l'onglet **Vivant**. Rien sous « Observations du vivant » dans Calques.

## Ce qui change

### 1. Taxons observés (copie 1)
- La liste ne montre plus que **vos propres tags**, même pour un admin. Le compteur à côté de chaque tag est aussi limité à vos tags.
- Design mobile first pour le menu :
  - Sur téléphone, il s'ouvre en tiroir par le bas (pleine largeur, gros boutons). Sur ordinateur, il reste un menu déroulant.
  - Champ de recherche « Chercher un tag » si vous avez plus de 8 tags.
  - Mode **Au moins un / Tous / Sauf** en libellés clairs (au lieu de ET/OU/SAUF), avec une phrase d'aide d'une ligne.
  - Les tags actifs s'affichent en pastilles colorées sous la recherche, chacune avec une croix pour la retirer.
  - Message vide : « Vous n'avez pas encore créé de tag. Touchez l'étiquette sur une fiche espèce pour en ajouter. »

### 2. Atelier du jardin → Calques (copie 2)
- Sous « Observations du vivant », après « Date terrain », une ligne **« Mes tags »** du même style que le sélecteur de période.
- Elle ouvre le même menu que ci-dessus (tiroir sur téléphone), avec le nombre d'observations visibles sur la carte pour chaque tag.
- Le filtre est **le même** que dans l'onglet Vivant et l'Herbier du moment : choisir un tag ici met à jour la carte, l'onglet Vivant et la liste des espèces.
- Pastille compteur sur la ligne quand des tags sont actifs, et croix pour tout effacer.

## Détails techniques
- `useMarcheurTagSuggestions` et `useMyMarcheurTagsOverview` : ajouter `.eq('user_id', user.id)` (via `supabase.auth.getUser()`) ; la clé de cache inclut l'id utilisateur. Vérifier que la RPC `get_my_marcheur_tags_for_species` filtre bien sur `auth.uid()` (sinon migration pour l'ajouter).
- Extraire un composant partagé `MyTagsFilterPicker` (Popover sur desktop, Drawer sur mobile via `useIsMobile`), utilisé par `MarcheurTagsFilterBar` et par `LayersPanel`.
- `LayersPanel` reçoit `tagFacets`, `tagsLoading`, `vivantFilter.tags` et `onVivantFilterChange` déjà calculés dans `PaletteStudio` (pas de nouvel état).
- Couleurs via tokens du thème ; aucune modification de base hors éventuelle correction de la RPC.
