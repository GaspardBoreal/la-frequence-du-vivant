

## Corriger la cohérence des données entre Synthèse et Taxons

### Probleme identifie

Les compteurs de la Synthese utilisent les colonnes resumees de la base (`birds_count`, `plants_count`, `fungi_count`, `others_count`) qui sont fausses :
- DB dit : 0 Faune, 15 Flore, 0 Champignons, 0 Autre, 30 total
- Donnees reelles (`species_data`) : **15 Animalia (17 obs), 15 Plantae (19 obs), 0 Fungi, 0 Autre = 30 especes**

L'onglet Taxons lit correctement `species_data`, d'ou l'incoherence.

### Solution

Modifier `EventBiodiversityTab.tsx` pour calculer les stats de Synthese **a partir de `species_data`** (la source de verite), au lieu des colonnes resumees.

### Fichier modifie
`src/components/community/EventBiodiversityTab.tsx`

### Detail technique
- Dans le `useMemo` qui calcule `stats` (lignes 92-102), remplacer l'agregation des colonnes `birds_count`/`plants_count`/`fungi_count`/`others_count` par un parcours de `species_data` qui compte les especes par `kingdom` :
  - `Animalia` → Faune
  - `Plantae` → Flore
  - `Fungi` → Champignons
  - tout le reste → Autre
- Le `total` sera la somme des 4 categories (nombre d'especes uniques, dedupliquees par `scientificName`)
- Cette logique est identique a celle deja utilisee par l'onglet Taxons, garantissant la coherence parfaite entre les deux vues

### Resultat attendu
- Synthese affichera : **30 Especes totales · 15 Faune · 15 Flore · 0 Champignons · 0 Autre**
- Taxons → Faune affichera 15 especes (17 observations au total)
- Taxons → Flore affichera 15 especes (19 observations au total)
- Les deux onglets seront parfaitement alignes

