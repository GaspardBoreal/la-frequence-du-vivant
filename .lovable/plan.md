## Plan de correction

1. **Remplacer la source de données espèces du template vignoble**
   - Ne plus alimenter “Ce que vous rencontrerez” avec `get_public_event_biodiversity`, qui renvoie actuellement 208 espèces hors filtre rayon.
   - Utiliser le pool unifié `useExplorationSpeciesPool(event.exploration_id)`, déjà aligné avec `get_exploration_species_count` et la vue Exploration → Biodiversité → Taxons observés.
   - Résultat attendu : le titre et le carrousel affichent les **38 espèces réelles dans le rayon d’observation**.

2. **Aligner les chiffres de la section “Le Domaine”**
   - Garder le compteur espèces sur `useExplorationSpeciesCount`.
   - Remplacer le compteur “Observations” par la somme des observations du pool filtré, au lieu du total public global qui inclut les espèces hors rayon.
   - Ajouter un état de chargement propre si le pool n’est pas encore disponible.

3. **Refaire les cartes espèces avec la même qualité visuelle que Taxons observés**
   - Construire les cartes à partir du pool unifié : nom scientifique, nom commun/français, groupe, nombre d’observations, image résolue.
   - Utiliser l’image `imageUrl` issue de la même cascade que l’app : photo marcheur prioritaire, puis photo iNat attribuée, puis photo iNat de référence.
   - Agrandir la photo dans la tuile pour supprimer l’effet “petite vignette perdue dans une grande carte”.

4. **Rendre les photos marcheurs visibles dans l’expérience vignoble**
   - Étendre `AlbumDomaineCarousel` pour intégrer aussi les photos de convivialité (`exploration_convivialite_photos`) en plus des `marcheur_medias` publics.
   - Dédupliquer les URLs et afficher une attribution marcheur quand disponible.
   - Résultat attendu : les **photos réelles prises par les marcheurs** apparaissent dans l’album du domaine.

5. **Garder le carrousel mais le rendre plus lisible**
   - Conserver le défilement par paquet de 4 sur desktop, 2 tablette, 1 mobile.
   - Garder les boutons visibles, avec compteur exact `04 / 38`, indicateurs et pause au survol.
   - Préserver l’effet “wahou” sans casser la sobriété : photo pleine tuile, léger zoom, voile doré discret, contraste amélioré.

## Fichiers concernés

- `src/components/vignoble/VignobleImmersion.tsx`
  - Source espèces corrigée vers `useExplorationSpeciesPool`.
  - Compteurs corrigés.
  - Album enrichi avec convivialité.
  - Cartes espèces agrandies et alignées sur le rendu Taxons observés.

## Vérification

- Vérifier la page `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26#pepites`.
- Confirmer visuellement :
  - “Ce que vous rencontrerez” affiche 38, pas 208.
  - Les cartes montrent des photos pleine largeur/hauteur.
  - L’album montre les photos réelles marcheurs + convivialité.