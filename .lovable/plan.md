

# Evolution du naming de la card B2C sur /marches-du-vivant

## Diagnostic strategique

Les 3 cards du hub ont un probleme d'asymetrie :

```text
Card 1 : "Pour les Entreprises et Collectivites"  -> AUDIENCE
Card 2 : "Explorez & Collectez"                   -> ACTION (probleme)
Card 3 : "L'Association"                           -> ENTITE
```

"Explorez & Collectez" decrit ce qu'on fait, pas a qui on s'adresse. Un visiteur grand public ne se reconnait pas. Il faut creer une **identite** — comme Strava dit "athlete", pas "courez et enregistrez".

## Proposition : "Devenez Marcheur du Vivant"

La formulation la plus strategique est **"Devenez Marcheur du Vivant"** pour plusieurs raisons :

1. **Identite aspirationnelle** : on ne propose pas une activite, on propose un statut. Le visiteur se projette dans un role
2. **Coherence de marque** : "Marcheur du Vivant" ancre le nom de l'association dans l'identite individuelle — chaque participant PORTE le nom du projet
3. **Verbe "Devenez"** : imperatif doux qui cree de l'urgence et de l'inclusion. Plus fort que "Pour les citoyens" (passif) ou "Rejoignez" (generique)
4. **Viralite** : "Je suis Marcheur du Vivant" se dit, se partage, se met en bio Instagram. "J'explore et collecte" ne se dit pas

"Explorez & Collectez" descend dans la description comme explication de ce que fait un Marcheur du Vivant.

### Structure finale des 3 cards

```text
Card 1 : "Pour les Entreprises et Collectivites"  -> AUDIENCE B2B
Card 2 : "Devenez Marcheur du Vivant"             -> IDENTITE B2C
Card 3 : "L'Association"                           -> ENTITE / GOUVERNANCE
```

### Detail de la card B2C modifiee

- **Titre** : "Devenez Marcheur du Vivant"
- **Badges** : `Gratuit` (en vert — levier psychologique fort), `Gamifie`, `Zones Blanches`
- **Description** : "Explorez les zones blanches, gagnez des points, montez dans le classement. Chaque kilometre parcouru enrichit la connaissance du vivant."
- **CTA** : "Rejoindre l'aventure" (au lieu de "Decouvrir le defi" — plus engageant, moins distant)

Le badge "Classement" est remplace par "Gratuit" : c'est un declencheur d'action bien plus puissant. Le classement est un mecanisme interne, pas un argument d'acquisition.

## Modifications techniques

### Fichier unique : `src/pages/MarchesDuVivant.tsx`

Modifications sur la card B2C (lignes 144-182) :

1. **Titre** : "Explorez & Collectez" -> "Devenez Marcheur du Vivant"
2. **Badge 1** : "Gamifie" -> "Gratuit" (couleur emerald/vert pour signaler l'accessibilite)
3. **Badge 2** : "Classement" -> "Gamifie" (conserve, decale en position 2)
4. **Badge 3** : "Zones Blanches" -> inchange
5. **Description** : Reformulee pour integrer "Explorez & Collectez" comme action
6. **CTA** : "Decouvrir le defi" -> "Rejoindre l'aventure"

Aucun autre fichier impacte.

