# Import du lot « Verger et prairie » (8 exemples)

Même traitement que le lot « Jardin nourricier » : le ZIP est la source de vérité, l'import se fait via l'écran admin existant, sans aucune modification de code.

## Contenu du ZIP (vérifié)

- Manifeste `exemples-verger-et-prairie.json` valide : type `verger_et_prairie` + 8 exemples complets (sous-titre, phrase d'intention, mots-clés, profil IA, texte alternatif) + `image_spec` + `generation_logic`.
- 16 images WebP calibrées : 8 grands formats 1536×1024 + 8 vignettes 360×240.

```text
1 Verger familial gourmand      5 Verger-forêt comestible
2 Pré-verger pâturé             6 Verger méditerranéen sobre
3 Verger conservatoire          7 Clairière fruitière conviviale
4 Prairie fleurie mellifère     8 Micro-verger facile
```

## État actuel de la base (vérifié)

- Le type « Verger et prairie » existe déjà (slug `verger_prairie`, position 2) mais son `stable_id` est vide.
- Il n'a aucun exemple rattaché.
- Le moteur d'import cherche le type par `stable_id` = `verger_et_prairie` : sans rattachement préalable, il créerait un doublon « Verger et prairie » en fin de liste.

## Étapes

### 1. Rattacher le type existant (mise à jour de donnée)

Mise à jour de la ligne existante `verger_prairie` : `stable_id = 'verger_et_prairie'`, avec `baseline`, `locale` et `climate_scope` issus du manifeste. Le slug `verger_prairie` est conservé tel quel (aucune URL publique ne change). Aucune migration de schéma : toutes les colonnes existent déjà depuis le lot « Jardin nourricier ».

### 2. Import du ZIP par un administrateur

Dans **Admin → Onboarding → « Choisir un ZIP »**, sélectionner `frequence-jardin-verger-et-prairie.zip`. Le moteur existant (`importGardenLot`) :

- rattache le lot au type existant (grâce à l'étape 1), sans créer de doublon ;
- téléverse les 16 images telles quelles dans le bucket public `onboarding-gallery`, sous `garden-types/verger_et_prairie/grands/…` et `…/vignettes/…` ;
- insère les 8 exemples (titre, sous-titre, intention, mots-clés, profil IA, texte alternatif, positions 1 à 8, publiés) ;
- met à jour la couverture du type avec le grand format de l'exemple 1 si le type n'a pas encore d'image ;
- affiche le rapport détaillé (exemples insérés, images téléversées, erreurs éventuelles).

L'import est relançable sans doublon (upsert par identifiant stable).

### 3. Vérification

- Galerie publique `/jardin/demarrer` : le style « Verger et prairie » affiche les 8 exemples avec vignettes, visionneuse plein écran et phrases d'intention.
- Admin → Onboarding : les 8 exemples sont éditables (champs enrichis déjà en place).

## Détails techniques

- Aucun code modifié : `src/lib/onboarding/importGardenLot.ts`, `LotImportCard.tsx`, la galerie et la visionneuse sont déjà génériques et couvrent ce lot.
- Étape 1 : requête de mise à jour de donnée (`UPDATE … SET stable_id = 'verger_et_prairie' … WHERE slug = 'verger_prairie'`), pas de `CREATE`/`ALTER`.
- Étape 2 exécutée dans le navigateur avec la session admin (droits storage + écriture sur les tables d'onboarding).
