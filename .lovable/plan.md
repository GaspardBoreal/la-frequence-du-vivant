

# Incitation vers les Carnets de Terrain depuis la page Explorer

## Positionnement strategique

L'emplacement ideal est **entre la section "Vivez l'experience" (timeline) et le "Calendrier de lancement"** (entre les lignes 530 et 532 du fichier actuel).

**Pourquoi ici ?** Le lecteur vient de vivre mentalement une marche complete (Accordage, Capteurs, Eclosion, Banquet). Il est en immersion. C'est le moment parfait pour lui montrer que **d'autres l'ont deja fait** -- la preuve par l'image. Cela cree un effet de validation sociale juste avant le calendrier et le CTA d'inscription.

## Concept : "Les Traces de Ceux qui ont Marche"

Une section editoriale elegante avec :

- Un titre poetique : *"Ils ont marche. Voici leurs traces."*
- **2 a 3 cartes de Carnets de Terrain** (les plus riches en donnees, chargees dynamiquement via `useFeaturedMarches`)
- Un lien d'appel discret mais seduisant vers la galerie complete

## Design de la section

### Layout
- Fond subtil avec radial gradient emeraude tres leger (coherent avec le reste de la page)
- Ornement botanique en filigrane
- Titre en Crimson Text, sous-titre en italique
- Grille de 1 a 3 cartes responsive (1 col mobile, 2-3 cols desktop)
- Chaque carte reprend le style `CarnetTerrainCard` existant mais adapte au fond clair de la page Explorer (bordures stone au lieu de emeraude, fond blanc semi-transparent)

### Les cartes
- Photo de couverture avec overlay
- Nom poetique de la marche
- Lieu + badges (especes, photos, audio)
- Lien cliquable vers la fiche individuelle

### Lien vers la galerie
- Sous les cartes : un lien elegant centre
- Style : texte emeraude avec chevron, hover avec underline
- Texte : *"Decouvrir tous les carnets de terrain"* avec une fleche

## Modifications techniques

### Fichier unique : `src/pages/MarchesDuVivantExplorer.tsx`

1. Importer `useFeaturedMarches` et `Link` (deja importe)
2. Importer `CarnetTerrainCard` depuis `@/components/carnets/CarnetTerrainCard`
3. Importer les icones supplementaires necessaires (`BookOpen`)
4. Appeler `useFeaturedMarches(3)` pour charger les 3 marches les plus riches
5. Inserer une nouvelle section entre "Vivez l'experience" et le `SectionDivider` qui precede le Calendrier
6. La section contient : titre, sous-titre, grille de cartes, lien galerie
7. Gerer le cas de chargement (skeleton ou rien) et le cas vide (section masquee)

### Pas de nouveau fichier

Le composant `CarnetTerrainCard` existant sera reutilise tel quel. La section est ajoutee directement dans la page.

