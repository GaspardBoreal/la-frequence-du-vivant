
# Carnets de Terrain -- Galerie des Marches et Fiches Ambassadeur

## Concept et Naming

Le nom retenu pour les fiches individuelles est **"Carnet de Terrain"** (au singulier pour chaque fiche). La galerie s'intitule **"Carnets de Terrain"**. Ce nom evoque l'authenticite du travail de terrain, la dimension scientifique (carnet de notes) et poetique (carnet de voyage) -- parfait pour inspirer ambassadeurs et marcheurs.

## Les 3 marches emblematiques selectionnees

Basees sur la richesse des donnees (photos, audio, biodiversite, recits) :

1. **"Confluence Dore et Dogne, la ou tout commence"** -- Mont-Dore, Puy-de-Dome (27 photos, 5 audios, 250 especes) -- La marche la plus complete, un sommet geopoetique en Auvergne
2. **"Archeologie d'un Non-Pont"** -- Beynac-et-Cazenac, Dordogne (13 photos, 2 audios, 264 especes) -- Un titre enigmatique, un territoire iconique de la vallee de la Dordogne
3. **"Contempler le genie humain face a la puissance de la Dordogne"** -- Bort-les-Orgues, Correze (12 photos, 2 audios, 232 especes) -- La rencontre entre l'infrastructure humaine et la force du vivant

## Architecture technique

### Nouveaux fichiers a creer

**1. `src/pages/CarnetsDeTerrainGalerie.tsx`** -- Page galerie
- Route : `/marches-du-vivant/carnets-de-terrain`
- Design : grille immersive de cartes avec filtres (region, saison, richesse biodiversite)
- Chaque carte montre : photo de couverture, nom poetique, lieu, date, badges (especes, photos, audio)
- Filtres : par region (chips), par saison (printemps/ete/automne/hiver), tri par richesse ou date
- Utilise le hook `useFeaturedMarches` enrichi pour charger les donnees
- Style : fond vert degrade profond (coherent avec l'identite La Frequence du Vivant), cards en glassmorphisme blanc semi-transparent

**2. `src/pages/CarnetDeTerrain.tsx`** -- Page fiche individuelle
- Route : `/marches-du-vivant/carnets-de-terrain/:slug`
- Design editorial en sections verticales inspirees du format "Trame Ambassadeur"

**3. `src/components/carnets/CarnetTerrainCard.tsx`** -- Composant carte pour la galerie
- Photo de couverture avec overlay gradient
- Nom poetique de la marche en typographie Crimson
- Lieu (ville + departement) avec icone MapPin
- Badges : nombre d'especes, photos, audio
- Region en chip colore
- Effet hover avec scale subtil et elevation

**4. `src/components/carnets/CarnetTerrainFilters.tsx`** -- Barre de filtres
- Chips de regions cliquables
- Filtre saison (4 boutons icones)
- Tri : "Plus riches" / "Plus recentes"

**5. `src/components/carnets/CarnetTerrainHero.tsx`** -- Hero de la galerie
- Titre "Carnets de Terrain" avec typographie Crimson
- Sous-titre geopoetique
- Compteurs animes (nombre total de marches, especes, photos)

### Fichiers a modifier

**6. `src/App.tsx`** -- Ajout des 2 nouvelles routes
```
/marches-du-vivant/carnets-de-terrain  --> CarnetsDeTerrainGalerie
/marches-du-vivant/carnets-de-terrain/:slug  --> CarnetDeTerrain
```

**7. `src/hooks/useFeaturedMarches.ts`** -- Extension optionnelle
- Ajouter un parametre `includeAll` pour retourner toutes les marches avec donnees (pas seulement le top N)

## Design de la Fiche "Carnet de Terrain" (page individuelle)

Structure verticale inspiree de la Trame Ambassadeur :

### Section 1 -- Hero immersif
- Photo de couverture plein ecran (ou demi-ecran) avec overlay gradient vert sombre
- Titre poetique (nom_marche) en blanc, grand, typographie Crimson
- Lieu + date + badges (especes, photos, audio) superposes sur l'image
- Bouton retour vers la galerie

### Section 2 -- "Le Territoire" (contexte geographique)
- Mini-carte Leaflet centree sur les coordonnees
- Region, departement, coordonnees
- Badge biodiversite (nombre d'especes)
- Descriptif court si disponible

### Section 3 -- "La Trame" (protocole Ambassadeur adapte)
- Timeline verticale en 4 temps (09h-12h) reprenant la structure Accordage / Marche des Capteurs / Eclosion Geopoetique / Banquet des Retours
- Adaptation du contenu au contexte specifique de la marche (paysage, saison)
- 5 suggestions de Kigo adaptes au lieu et a la saison de la marche

### Section 4 -- "Les Traces" (galerie photo + audio)
- Grille masonry des photos de la marche
- Lecteurs audio integres si des fichiers audio existent
- Lien vers la page de detail existante (`/marche/:slug`)

### Section 5 -- "Les Especes" (biodiversite)
- Compteurs animes : total especes, oiseaux, plantes, champignons
- Visualisation simple (barres horizontales ou cercles)

### Section 6 -- CTA Ambassadeur
- "Reproduisez cette marche dans votre territoire"
- Lien vers la page B2C (`/marches-du-vivant/explorer`)
- Lien vers le formulaire de contact B2B

## Design de la Galerie

### Layout
- Header hero avec titre + compteurs
- Barre de filtres sticky sous le hero
- Grille responsive : 1 col mobile, 2 cols tablette, 3 cols desktop
- Cards avec ratio 4:3 pour la photo, contenu en dessous
- Infinite scroll ou pagination douce

### Filtres disponibles
- **Region** : chips extraites dynamiquement des donnees (Nouvelle-Aquitaine, Auvergne-Rhone-Alpes, Bretagne, Corse...)
- **Saison** : Printemps (mars-mai), Ete (juin-aout), Automne (sept-nov), Hiver (dec-fev) -- calcule depuis la date
- **Tri** : "Plus riches en donnees" (score de completude) / "Plus recentes"
- **Recherche textuelle** : filtre sur nom_marche + ville

### Style visuel (DA geopoetique)
- Fond : degrade du vert foret profond (#0c2a1a) vers emeraude (#134e3a) -- coherent avec le print
- Cards : glassmorphisme (fond blanc a 8% opacite, bordure emeraude subtile, backdrop-blur)
- Typographie : Crimson Text pour les titres, sans-serif pour le corps
- Accents : emeraude (#10b981), ambre (#f59e0b) pour les highlights, blanc casse (#f0f7f4)
- Ornements botaniques SVG en filigrane (reutilisation du composant BotanicalLeaf)
- Animations : fade-up au scroll (framer-motion), scale subtil au hover sur les cards

## Contraintes et coherence

- Reutilisation maximale des composants existants (BotanicalLeaf, SectionDivider, Footer, SEOHead)
- Reutilisation du hook `useFeaturedMarches` enrichi et du `createSlug` existant
- Navigation coherente : lien depuis le hub `/marches-du-vivant` et depuis la page B2C `/marches-du-vivant/explorer`
- Les fiches individuelles pointent vers les pages de detail existantes (`/marche/:slug`) pour les contenus approfondis
- Responsive mobile-first
- SEO : balises meta dynamiques par fiche
