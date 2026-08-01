## Diagnostic (vérifié en base)

Vous avez **68 calques** sur ce jardin alors qu'il n'en faut que 6. La table `propriete_calques` contient, pour la propriété Deviat :

| Nom | Nb de calques | Objets rattachés |
|---|---|---|
| Annotations | 13 | 8 |
| Existant / Sol & eau / Structures / Plantations / Circulations | 11 chacun | 0 |

**Cause** : à l'ouverture de l'Atelier, un effet crée les 6 calques par défaut si la liste est vide. Cet effet se redéclenche à chaque ouverture/remontage avant que les données ne soient chargées, donc il re-sème les 6 calques — 11 fois de suite ici. Il n'existe aucune contrainte d'unicité `(propriete_id, nom)` en base pour l'empêcher.

**Renommage** : il est possible aujourd'hui, mais uniquement par double-clic sur le nom — aucune icône crayon n'est affichée (contrairement aux emplacements), donc l'affordance est invisible.

## Ce que je propose

### 1. Arrêter l'hémorragie (base + code)
- Migration : dédupliquer `propriete_calques` — garder le plus ancien calque par `(propriete_id, nom)`, réaffecter les objets des doublons vers celui conservé, supprimer les doublons vides. Ajouter un index unique `(propriete_id, lower(nom))`.
- Code : le semis des calques par défaut n'est déclenché qu'une fois le chargement terminé (`loading === false`) et via un verrou par propriété, plus jamais sur un état "liste vide" transitoire.

### 2. Rendre chaque calque lisible
- Ajouter à chaque ligne une **icône métier + pastille de couleur** (Existant, Sol & eau, Structures, Plantations, Circulations, Annotations) et un compteur d'objets déjà présent mis en valeur.
- Sous-titre discret d'une ligne rappelant à quoi sert le calque (« Ce qui existe déjà : arbres, murs, bâti », « Mare, noue, citerne, arrosage », etc.).
- Les calques **vides sont repliés** par défaut sous un dépliant « 4 calques vides » pour ne montrer que ce qui porte du contenu.

### 3. Rendre la gestion évidente
- Icône **crayon « Renommer »** visible au survol de chaque calque (comme pour les emplacements), en plus du double-clic.
- Suppression protégée : si le calque contient des objets, une confirmation propose de les déplacer vers un autre calque plutôt que de les perdre.
- Bouton **« Ranger les calques »** dans l'en-tête : fusionne les doublons de même nom restants et remet l'ordre métier par défaut.

## Détails techniques
- Migration SQL de dédup + `CREATE UNIQUE INDEX` sur `propriete_calques (propriete_id, lower(nom))`.
- `PaletteStudio.tsx` : le `seededRef` devient une clé par `proprieteId` et attend `loading === false` de `useProprieteCalques`.
- `usePropertyCalques.ts` : exposer `loading` déjà présent + une action `mergeDuplicates`.
- `LayersPanel.tsx` : métadonnées de calque (icône/couleur/description) issues d'un nouveau `src/lib/calqueMeta.ts`, section repliable pour les calques vides, bouton crayon, dialogue de suppression.
