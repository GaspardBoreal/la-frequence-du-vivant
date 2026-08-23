# Import autonome des lots ZIP avec choix du type associé

## Diagnostic du ZIP « Jardin de ville en bacs » (vérifié)

- Manifeste valide : `garden_type.id = jardin_de_ville_en_bacs`, 8 exemples complets (sous-titre, intention, mots-clés, profil IA, texte alternatif) + `image_spec`.
- 16 images WebP calibrées : 8 grands formats + 8 vignettes.

```text
1 Balcon nourricier compact        5 Oasis fleurie pour pollinisateurs
2 Terrasse conviviale grands bacs  6 Jardin vertical gain de place
3 Cour ombragée en pots            7 Bacs faciles et accessibles
4 Toit-terrasse sobre résilient    8 Mini-verger urbain en pots
```

## Le problème à corriger

- Le type « Jardin de ville en bacs » existe déjà en base (slug `ville_bacs`, position 3, 0 exemple) mais son `stable_id` est vide.
- Le moteur d'import cherche par `stable_id` puis par slug `jardin_de_ville_en_bacs` / `de_ville_en_bacs` : aucun ne correspond à `ville_bacs` → **il créerait un doublon** en fin de liste.
- Aujourd'hui, chaque nouveau lot exige donc un passage par le chat pour rattacher le type en SQL. C'est ce verrou qu'on fait sauter.

## Évolution fonctionnelle : import 100 % autonome

Le flux « Choisir un ZIP » devient un assistant en deux temps, entièrement dans l'écran Admin → Onboarding :

### 1. Analyse du ZIP (avant toute écriture)
- Dès la sélection du fichier, le ZIP est lu et le manifeste validé (moteur existant).
- Une carte de confirmation affiche : type détecté (libellé + identifiant), nombre d'exemples, nombre d'images.
- **Aucune écriture en base à ce stade.**

### 2. Choix du type associé
Une liste de choix claire :
- **Rattacher à un type existant** : menu déroulant des types du catalogue (ceux sans exemples en premier, avec mention du slug et du nombre d'exemples). Si le manifeste correspond déjà à un type (par identifiant stable ou slug), il est **présélectionné automatiquement**.
- **Créer un nouveau type** : comportement actuel (titre = libellé du manifeste, position en fin de liste).

Filet de sécurité : si le type choisi porte déjà l'identifiant stable d'un **autre** lot, un avertissement orange s'affiche avant validation (« ce type est déjà rattaché au lot X »).

### 3. Import
- Bouton « Lancer l'import » → déroulé existant (upload des images telles quelles, upsert des exemples par identifiant stable, rapport détaillé).
- En mode rattachement : le type choisi reçoit `stable_id`, `baseline`, `locale`, `climate_scope`, `image_spec`, `generation_logic` du manifeste ; son slug, sa position, son titre et sa couverture existante sont conservés. Aucune URL publique ne change.
- Relançable sans doublon, comme aujourd'hui.

## Application immédiate au lot « Jardin de ville en bacs »

Une fois la fonctionnalité en place : **Admin → Onboarding → « Choisir un ZIP »** → sélectionner le ZIP → choisir « Jardin de ville en bacs (ville_bacs) » dans le déroulant → Lancer. Aucune requête SQL, aucun passage par le chat. Le rapport devra afficher : type **mis à jour** (pas créé), 8 exemples insérés, 16/16 images téléversées.

## Détails techniques

- `src/lib/onboarding/importGardenLot.ts` :
  - nouvelle fonction `analyzeGardenLot(file)` : parse + valide le manifeste, cherche le type correspondant, liste les types candidats — sans rien écrire ;
  - `importGardenLot(file, { targetTypeId }, onProgress)` : nouveau paramètre optionnel ; si fourni, le rattachement se fait sur ce type précis (sinon logique actuelle inchangée).
- `src/components/onboarding/LotImportCard.tsx` : passe d'un flux direct à un assistant 2 étapes (analyse → choix du type → import) avec l'état local ; rapport final identique.
- Aucune migration SQL, aucun changement de schéma, aucune régression pour les lots déjà rattachés (Jardin nourricier, Verger et prairie : le bon type sera présélectionné automatiquement).
