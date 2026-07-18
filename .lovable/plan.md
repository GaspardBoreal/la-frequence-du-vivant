## Améliorations Studio Fonds d'Écran

### 1. Nouvelle étape "Règne du vivant" (entre marche et ambiance)

Ajouter une **étape 3 dédiée** dans le wizard (`WallpaperStudio.tsx`) permettant de choisir le règne d'espèces mis en avant :

- **Tout le vivant** (défaut, comportement actuel)
- **Flore** (plantes, arbres, fleurs)
- **Faune ailée** (oiseaux, papillons, insectes volants)
- **Petite faune** (insectes, arthropodes, reptiles, amphibiens)
- **Champignons & lichens**

**Impact code** :
- `photoPicker.ts` → `fetchSpeciesPhotos()` filtre sur `iconic_taxon` / `kingdom` du `species_data` selon le règne choisi ; fallback vers pool général si moins de 3 photos trouvées pour ce règne.
- `WallpaperStudio.tsx` → nouvelle prop `kingdom` passée à `pickPhotos`, nouvelle étape UI (chips visuels avec pictos).
- `wallpaperCanvas.ts` → transmis en signature/sous-titre optionnel ("Faune ailée · Deviat").
- Table `wallpaper_generations` → nouvelle colonne `kingdom text` (migration).

Les 4 variantes (Editorial / Organic / Diptyque / Constellation) restent générées ; seule la source photo est filtrée.

### 2. Option "Appel à la communauté" discret et design

Nouvelle **case à cocher** dans l'étape finale (avant "Générer 4 propositions") :

> ☐ Inclure un appel discret « Rejoignez la communauté des Marcheurs du Vivant »

**Rendu canvas** (`wallpaperCanvas.ts`) :
- Bandeau ultra-fin en bas du wallpaper, à côté ou au-dessus du QR code
- Typo Crimson italique en doré transparent (`rgba(212, 168, 83, 0.75)`)
- Texte : « Rejoignez la communauté des Marcheurs du Vivant »
- Sous-ligne fine (`la-frequence-du-vivant.com`) en Inter light
- Positionnement adaptatif selon variante (Editorial : bas gauche ; Organic/Constellation : bas centre ; Diptyque : sous la colonne texte)
- QR code redirige vers `/marches-du-vivant/connexion?tab=register` quand l'option est activée (au lieu de l'URL par défaut)

**Impact code** :
- `WallpaperStudio.tsx` → state `includeCta: boolean`, checkbox stylée (switch shadcn)
- `wallpaperCanvas.ts` → paramètre `ctaEnabled` dans `renderWallpaper()` + fonction `drawCommunityCta()`
- `WallpaperPreviewModal.tsx` → propage `ctaEnabled` au rendu HD et stocke dans DB
- Migration : colonne `cta_enabled boolean default false`

### Détails techniques

- Filtrage règne : mapping `iconic_taxon` iNat → règne UI (Aves + Insecta+ailés → "Faune ailée", Plantae → "Flore", Fungi → "Champignons", etc.)
- Si le règne choisi n'a pas assez de photos pour l'event/marche sélectionné : afficher un toast "Peu d'observations Faune ailée sur cette marche, complétées par le pool général"
- Le CTA ne s'affiche jamais par-dessus une photo (zone réservée dans le layout de chaque variante)
