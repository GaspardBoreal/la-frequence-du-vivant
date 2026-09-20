# Supprimer ou recommencer une forme, sans accident

## Ce qui existe aujourd'hui (vérifié)

- Un ouvrage se supprime depuis sa fiche (bouton « Supprimer »)… **mais sans confirmation** : un clic et c'est parti, sans retour possible.
- Un ouvrage ne peut pas être « redessiné » : seul l'emplacement (zone) propose « Redessiner ».
- Pendant la transformation (Mode Atelier), la fiche est rangée en onglet : **impossible de supprimer ou recommencer sans quitter le mode**.
- Un tracé en cours qui ne plaît pas n'a pas de geste « recommencer » : il faut valider puis revenir.

## Ce que je propose

### 1. « Supprimer » devient un geste en deux temps
Dans la fiche de l'ouvrage comme de l'emplacement, le bouton « Supprimer » ouvre une petite confirmation locale (pas de page entière) :
- « Supprimer “Potager” ? Cette forme et ses photos seront retirées du plan. Les analyses de sol et chantiers restent. »
- Deux choix : **Garder** / **Supprimer** (rouge discret).

### 2. « Redessiner » pour les ouvrages aussi
Même traitement que pour les emplacements : bouton **Redessiner** dans la fiche. Le plan arme l'outil de tracé correspondant au type de l'ouvrage (massif → massif, potager → potager…) ; au tracé terminé, la nouvelle forme **remplace** l'ancienne (même ouvrage, mêmes photos et réglages conservés) au lieu d'en créer un deuxième.

### 3. Dans le Mode Atelier (transformation) : « ⋯ › Supprimer cette forme »
Le plot du bas gagne, dans le rang « ⋯ », une entrée **Supprimer cette forme** (avec la même confirmation qu'au point 1). Plus besoin de quitter la transformation pour se débarrasser d'une forme ratée. L'abandon (Échap) reste le geste « je garde l'ancienne forme ».

### 4. Pendant un tracé : « Recommencer »
Le bandeau de tracé (« Tracez votre massif… ») gagne un bouton **Recommencer** qui vide le tracé en cours et repart à zéro, en plus de « Annuler » qui quitte.

## Détails techniques

- `ObjectInspector.tsx` / `ZoneInspector.tsx` : confirmation inline (état local) avant d'appeler `onDelete` ; ajout de la prop `onRedraw` côté ouvrage.
- `PaletteStudio.tsx` : `handleObjetRedraw(objet)` — arme `setTool(TOOL_BY_KEY[objet.outil_key])` en mode « remplacement » mémorisant l'id ; dans `handleDrawFinish`, si remplacement : `upsertObjet({ id, geometry })` au lieu de créer ; passe `onRedraw` à l'inspecteur. Suppression pendant transform : `objetTransform.cancel()` puis `deleteObjet`.
- `ObjetTransformBar.tsx` / `ZoneTransformBar.tsx` : entrée « Supprimer cette forme » dans le rang « ⋯ » (prop `onDeleteObjet` optionnelle), avec confirmation inline.
- Bandeau de tracé existant : ajout du bouton « Recommencer » (réinitialise l'état de dessin de l'outil actif).
- Aucune migration, aucun changement de droits ni de logique de sauvegarde ; `delete_propriete_objet` (RPC existante) reste la seule voie de suppression.
