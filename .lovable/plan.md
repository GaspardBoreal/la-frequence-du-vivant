## Ce que révèle l'analyse

« A · Emplacement A » n'est pas un résidu fantôme : c'est bien l'unique zone enregistrée en base pour Jardin Monde DEVIAT (géométrie valide, 78 points, non verrouillée). Le problème est purement d'interface :

- **Supprimer** existe déjà, mais l'action n'apparaît qu'après avoir cliqué sur la pastille, sous la carte, tout en bas du bloc — invisible dans l'usage réel.
- **Renommer** n'existe nulle part dans le bloc « Emplacements » (uniquement dans l'Atelier, via l'inspecteur d'objet).
- La fonction serveur de suppression est bien en place et sécurisée (`delete_propriete_zone`) : rien à corriger côté base.

## Ce que je propose

Transformer chaque pastille d'emplacement en véritable **jeton de gestion**, sans alourdir la barre.

**1. Menu contextuel sur la pastille**
Un chevron discret apparaît sur la pastille active (ou au survol). Il ouvre un petit panneau flottant :
- champ **Nom** éditable en direct (validation à la volée, Entrée pour confirmer)
- sélecteur de **couleur** (les 5 teintes de la charte)
- bascule **Visible / masqué** (œil)
- bascule **Verrouillé** (empêche déplacement/suppression accidentelle)
- surface calculée affichée en m²
- bouton **Supprimer** en rouge, en bas, avec confirmation en deux temps (« Supprimer ? · Confirmer / Annuler ») pour éviter la perte accidentelle

**2. Barre d'action toujours visible**
Quand un emplacement est sélectionné, la barre d'outils au-dessus de la carte affiche directement Renommer / Supprimer / Désélectionner — plus besoin de chercher sous la carte. L'ancienne barre du bas est retirée.

**3. Sécurité de contenu**
Avant suppression, si l'emplacement porte déjà une palette végétale, le message de confirmation le signale (« cet emplacement contient N espèces choisies ») pour que la suppression soit un choix conscient.

**4. Cohérence dans l'Atelier**
Les mêmes actions (renommer, couleur, visibilité, verrou, suppression) restent alignées sur le panneau de calques de l'Atelier, afin d'avoir un comportement identique dans les deux vues.

## Détails techniques

- Modifications concentrées sur `ZonesMapBlock.tsx` (nouveau sous-composant `ZoneChipMenu`) et branchement de `onPatchZone` / `onDeleteZone` déjà exposés par `TabPalette.tsx`.
- Renommage via le RPC existant `upsert_propriete_zone` (passage de `_zone_id`), suppression via `delete_propriete_zone`. Aucune migration de base nécessaire.
- Recalcul et sauvegarde de `surface_m2` si absent, pour l'affichage.
