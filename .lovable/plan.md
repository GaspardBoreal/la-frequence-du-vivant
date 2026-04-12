

## Outil GPS Photo — Localiser une photo sur la carte de l'exploration

### Concept

Un bouton discret (icone appareil photo + GPS) dans la barre d'outils de la carte permet de deposer une photo. Le systeme extrait les coordonnees EXIF, affiche un marqueur rouge sur la carte avec un popup riche, et propose de basculer la photo en contribution rattachee a une marche avec le selecteur de visibilite 3 etats.

### Flux utilisateur

```text
1. Tap bouton 📷📍 (coin bas-droit, pres du bouton geolocalisation)
2. Selecteur fichier natif (camera/galerie sur mobile, dossier sur PC)
3. Extraction EXIF via exifr (deja installe dans le projet)
4. Si GPS trouve :
   → Marqueur rouge semi-transparent sur la carte
   → Carte centree sur le point
   → Popup au clic : miniature, coordonnees, date de prise de vue
   → Bouton "Ajouter a une marche" dans le popup
5. Si pas de GPS :
   → Toast d'avertissement "Aucune donnee GPS dans cette photo"
   → Possibilite de positionner manuellement ? (non, on reste simple)
6. Bouton "Ajouter a une marche" :
   → Menu deroulant des marches de l'exploration
   → Selecteur 3 etats (Prive / Communaute / Monde)
   → Upload vers marcheur-uploads + insert marcheur_medias
   → Toast de confirmation
7. Le marqueur rouge disparait quand on ferme ou quand on uploade
```

### Design du marqueur photo

- Cercle rouge brique (#dc2626) semi-transparent, halo pulse doux
- Plus petit que le marqueur GPS bleu de geolocalisation
- Popup glassmorphism noir comme les popups existants
- Miniature de la photo (80px) + coordonnees + date EXIF
- Bouton CTA vert "Ajouter a une marche →"

### Design du bouton

- Position : bas-droite, au-dessus du bouton geolocalisation existant
- Style : cercle glassmorphism noir/blur comme les controles de zoom
- Icone : Camera + petit indicateur GPS (MapPin superpose en petit)
- Taille : 40x40px, meme langage visuel que GeolocateButton

### Fichiers impactes

| Fichier | Action |
|---------|--------|
| `ExplorationCarteTab.tsx` | Ajouter le bouton, le state photo, le marqueur rouge, le popup avec formulaire de rattachement |
| `usePhotoGpsCheck.ts` | Reutiliser `exifr.gps()` pour l'extraction (deja en place) |

### Details techniques

- Extraction GPS : `exifr.gps(file)` sur le blob File directement (pas besoin d'URL)
- Extraction date : `exifr.parse(file, ['DateTimeOriginal'])` pour afficher la date de prise de vue
- Upload : reutiliser le pattern existant de `marcheur-uploads` bucket + insert dans `marcheur_medias` avec `metadata` JSONB contenant lat/lng
- Le marqueur est un state local (`photoPoint`), pas de persistence en base
- Le selecteur de marche affiche la liste `marches` deja passee en props
- Le selecteur de visibilite reutilise la logique 3 etats deja implementee

### Pas de migration DB necessaire

Toute l'infrastructure existe deja : bucket `marcheur-uploads`, table `marcheur_medias` avec `metadata` JSONB, colonne `shared_to_web`.

