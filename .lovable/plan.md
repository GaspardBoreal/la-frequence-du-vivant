

# Aligner les 4 roles dans la page /marches-du-vivant/association

## Contexte

La page `/marches-du-vivant/explorer` definit deja les 4 roles officiels (Marcheur, Eclaireur, Ambassadeur, Sentinelle). La page `/marches-du-vivant/association` affiche encore l'ancien parcours a 3 niveaux (Marcheur, Ambassadeur, Animateur). Il faut les aligner.

## Modifications

### `src/pages/MarchesDuVivantAssociation.tsx`

1. **Remplacer le tableau `parcoursAmbassadeur`** (lignes 83-100) par 4 entrees alignees sur les roles de la page explorer, avec icones et couleurs distinctes :

| # | Role | Description | Prerequis | Icone | Couleur |
|---|------|-------------|-----------|-------|---------|
| 1 | Marcheur | Participez a une premiere marche et decouvrez l'ecoute active du territoire | Aucun | Footprints | emerald |
| 2 | Eclaireur | Explorez les zones blanches de biodiversite et devenez le premier temoin de ces territoires oublies | 5 zones blanches explorees | Eye | teal |
| 3 | Ambassadeur | Formez-vous a l'animation de groupes, aux outils de reconnaissance d'especes et a la transmission | Formation 1 jour + 3 marches animees | Heart | sky |
| 4 | Sentinelle | Devenez referent territorial, formez les futurs ambassadeurs et ancrez les Marches dans votre region | Certification + 5 animations supervisees | Shield | amber |

2. **Adapter le rendu des vignettes** (lignes 311-346) :
   - Ajouter l'icone au-dessus du numero dans chaque carte
   - Appliquer la couleur specifique a chaque role (bordure et icone)
   - Passer la grille a `md:grid-cols-4` au lieu de `md:flex-row` pour accueillir 4 cartes proprement
   - Conserver les fleches entre les etapes

3. **Mettre a jour le titre de section** : "Devenir Ambassadeur" → "Quatre roles a incarner" pour refleter le nouveau parcours complet

4. **Imports** : ajouter `Footprints`, `Eye`, `Heart`, `Shield` depuis lucide-react

