
Objectif
- Ajouter un 5e pavé dans la section “Ce qui nous différencie” de `/marches-du-vivant` pour mettre en avant les 3 types de Marches du Vivant, en reprenant rigoureusement la même grammaire visuelle que les 4 pavés existants.

Ce que je vais modifier
1. Enrichir la liste des différenciateurs dans `src/pages/MarchesDuVivant.tsx`
- Ajouter un nouvel item au tableau actuellement mappé dans la section.
- Conserver exactement la même structure de carte :
  - icône dans pastille ronde
  - titre
  - description courte
  - mêmes espacements, bordures, fond et animation

2. Formuler le nouveau contenu de façon claire et compacte
- Titre orienté offre / pédagogie, par exemple autour de :
  - “3 types de marches”
  - ou “Formats pour tous les publics”
- Description courte expliquant que les Marches du Vivant se déclinent en :
  - éco poétique
  - éco tourisme
  - agroécologique
- Le texte insistera sur l’objectif de sensibilisation et d’implication de publics variés dans leur rapport au vivant, sans casser la densité éditoriale des 4 autres pavés.

3. Garder un rendu design et responsive
- Ajuster la grille pour accueillir 5 cartes proprement sur desktop.
- Préserver un empilement naturel sur mobile et tablette.
- Si nécessaire, élargir légèrement le conteneur de la section pour éviter des cartes trop serrées.

Approche design
- Même niveau visuel que les 4 autres pavés : pas de composant spécial, pas de mise en forme différente.
- Icône cohérente avec l’univers “marches / vivant / diversité des formats”.
- Couleur harmonisée avec la palette existante pour ne pas casser l’équilibre de la section.

Détail technique
- Fichier principal : `src/pages/MarchesDuVivant.tsx`
- Probables ajustements :
  - import d’une icône Lucide supplémentaire si besoin
  - ajout d’un 5e objet dans l’array de cartes
  - ajustement de `grid-cols` / largeur max du conteneur pour une présentation propre à 5 items

Résultat attendu
- La section conserve exactement le même style visuel.
- Un 5e pavé apparaît naturellement à côté des 4 existants.
- Il explique clairement qu’il existe trois types de Marches du Vivant : éco poétique, éco tourisme et agroécologique, pour sensibiliser et impliquer tous les publics.
