# Recherche « contient » dans l'onglet Relier (Veille bziiit)

## Constat
Dans Admin → Veille → Veille bziiit → Relier, les deux choix se font via des listes déroulantes (`Select`) sans recherche :
- « Choisir un jardin ou une exploration » (mode Par destination)
- « Choisir un article récent » (mode Par article)

Avec de nombreux jardins et explorations, retrouver une entrée au défilement est pénible, surtout sur mobile.

## Solution proposée
Remplacer les deux `Select` par un sélecteur avec recherche « contient », réutilisant le pattern déjà présent dans le projet (Herbier du moment, Mes tags) :

1. **Composant partagé `SearchableSelect`** (dans `src/components/admin/veille/` ou `src/components/ui/`) :
   - Bouton déclencheur affichant la valeur choisie (ou le placeholder), avec icône loupe.
   - Ouverture en **Popover sur desktop, Drawer par le bas sur mobile** (via `useIsMobile`), cohérent avec `MyTagsFilterPicker`.
   - Champ de recherche en tête : filtre « contient » insensible à la casse et aux accents (normalisation NFD, comme ailleurs dans le projet) sur le nom **et** le sous-titre (commune / type).
   - Liste des résultats avec icône 🌿 jardin / 👣 exploration, nom en gras, sous-titre discret.
   - État vide : « Aucun jardin ni exploration ne contient « … » ».
   - Bouton ✕ pour effacer la sélection.

2. **Application dans `VeilleBziiit.tsx` (Relier)** :
   - Mode « Par jardin / exploration » : recherche sur `targets` (nom + sousTitre).
   - Mode « Par article » : recherche « contient » dans le titre des articles récents (60 jours).
   - La sélection retenue reste affichée dans le bouton ; la recherche se réinitialise à chaque ouverture.

3. **Aucun changement** de logique de rapprochement (scores, liens, lettres) : uniquement le contrôle de sélection.

## Vérification
- Build OK.
- Test visuel : taper « monde » retrouve « Jardin Monde DEVIAT » ; taper une commune retrouve les jardins/explorations associés ; accents ignorés (« foret » trouve « Forêt … »).
