## Générateur de fonds d'écran — Matériel Pédagogique

Ajouter une section **"Studio Fonds d'Écran"** dans `/materiel-pedagogique` : un générateur de wallpapers en mosaïque poétique multi-espèces, avec sélection guidée en 3 étapes, rendu multi-format, téléchargement 1-clic, galerie communautaire, et traçabilité en base.

### Parcours utilisateur (3 étapes)

```text
Étape 1 — THÈME               Étape 2 — PORTÉE              Étape 3 — ANGLE
┌─────────────────┐           ┌─────────────────┐           ┌──────────────────┐
│ Fréquence Vivant│           │ Tous événements │           │ Catégorie:       │
│ Marches Vivant  │           │ Un événement ▼  │           │  Espèce vedette  │
└─────────────────┘           └─────────────────┘           │  Paysage         │
                                                            │  Mosaïque marcheurs│
                                                            │  Empreinte territoire│
                                                            │ Ambiance:        │
                                                            │  Aube/Jour/Crép./Nuit│
                                                            └──────────────────┘
                                                                    ↓
                                                          [Générer 4 propositions]
```

Puis grille de 4 wallpapers proposés → clic → prévisualisation grand format multi-résolution → téléchargement + partage + tuto installation.

### Composition visuelle (mosaïque poétique)

Chaque wallpaper = **collage organique 3-5 photos** sur fond dégradé sage/ambre (`#1a3c2a → #87a878 → #e8c07a → #faf8f5`), avec :
- Photo centrale héroïque (60% surface)
- 2-4 photos satellites en formes organiques (cercles/blobs) avec ombres douces
- **Signature bas** : wordmark (Fréquence ou Marches) + nom événement + date + commune + coords GPS en `font-crimson` italique
- **QR code discret** coin bas-droite (100px) → page publique événement/espèce
- **Grain papier** subtil sur toute la surface pour la texture "Papier Crème"

### Formats générés
- Desktop 16:9 → 1920×1080, 2560×1440, 3840×2160
- Ultra-wide 21:9 → 3440×1440
- Mobile 9:19.5 → 1170×2532
- Tablette 4:3 → 2048×1536

Rendu côté client via `<canvas>` (haute résolution, pas de coût serveur).

### Sources de photos (déjà en base)
- `marche_photos` (photos officielles événement)
- `marcheur_medias` (photos marcheurs, filtrées `is_public=true` + curation)
- `species_thumb_cache` + `marcheur_observations` (espèces observées, meilleure photo curée)
- `explorations.cover_image_url` + `marche_events`

Sélection intelligente : privilégier photos avec GPS proche, meilleure qualité, diversité taxonomique.

### Installation "1-clic" par OS
Dialog tutoriel adaptatif selon `navigator.userAgent` :
- **Windows** : "Téléchargé → Clic droit → Choisir comme arrière-plan du bureau"
- **macOS** : "Téléchargé → Clic droit → Définir comme fond d'écran"
- **iOS** : "Photos → Partager → Utiliser en fond d'écran"
- **Android** : "Galerie → Menu → Définir comme fond d'écran"

Avec micro-illustrations SVG animées par étape.

### Galerie communautaire publique
- Sous la section génération : "Fonds créés par la communauté" (12 derniers)
- Compteur téléchargements par wallpaper
- Partage LinkedIn/Instagram/WhatsApp pré-rempli avec lien retour vers `/materiel-pedagogique#studio-fonds-ecran`

### Accès
- **Génération** : ouvert au public (booster viralité SEO/GEO)
- **Galerie communautaire** : publique en lecture
- **Compteur téléchargements** : incrémenté anonymement

### Design intégré à la page
Nouvelle section entre "Constellation" et citation de clôture :
- Bandeau intro poétique (font-crimson, badge sage/ambre)
- Wizard 3 étapes en cards glassmorphism
- Grille 4 propositions avec hover reveal + shimmer
- Preview modal plein écran avec sélecteur résolution
- Galerie horizontal scroll

## Détails techniques

### Fichiers créés
- `src/components/wallpaper-studio/WallpaperStudio.tsx` — section wrapper + wizard state
- `src/components/wallpaper-studio/steps/ThemeStep.tsx` — 2 cartes thème
- `src/components/wallpaper-studio/steps/ScopeStep.tsx` — tous vs événement + combobox
- `src/components/wallpaper-studio/steps/AngleStep.tsx` — catégorie + ambiance
- `src/components/wallpaper-studio/WallpaperPreviewGrid.tsx` — 4 propositions
- `src/components/wallpaper-studio/WallpaperPreviewModal.tsx` — plein écran + sélecteur résolution + boutons DL/share
- `src/components/wallpaper-studio/InstallTutorialDialog.tsx` — tutos par OS avec détection UA
- `src/components/wallpaper-studio/CommunityGallery.tsx` — galerie 12 derniers
- `src/components/wallpaper-studio/renderer/wallpaperCanvas.ts` — moteur canvas (mosaïque, gradient, texte, QR, grain)
- `src/components/wallpaper-studio/renderer/photoPicker.ts` — sélection intelligente photos
- `src/hooks/useWallpaperEvents.ts` — fetch events pour combobox
- `src/hooks/useWallpaperGeneration.ts` — orchestre pick + render
- `src/hooks/useCommunityWallpapers.ts` — fetch galerie
- `src/pages/MaterielPedagogique.tsx` — insertion nouvelle section

### Base de données (nouvelle table)

```sql
CREATE TABLE public.wallpaper_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  theme text NOT NULL,             -- 'frequence' | 'marches'
  scope text NOT NULL,             -- 'all' | 'event'
  event_id uuid REFERENCES marche_events(id) ON DELETE SET NULL,
  category text NOT NULL,          -- 'species' | 'landscape' | 'walkers' | 'territory'
  ambiance text NOT NULL,          -- 'dawn' | 'day' | 'dusk' | 'night'
  photo_ids jsonb NOT NULL,        -- ids sources utilisées
  species_names text[],
  resolution text NOT NULL,        -- '1920x1080' etc.
  storage_path text,               -- si sauvegardé pour galerie
  is_public boolean DEFAULT true,
  download_count int DEFAULT 0,
  share_count int DEFAULT 0,
  event_name_snapshot text,
  event_date_snapshot date,
  event_commune_snapshot text,
  event_gps_snapshot jsonb
);

GRANT SELECT ON public.wallpaper_generations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.wallpaper_generations TO authenticated;
GRANT ALL ON public.wallpaper_generations TO service_role;

ALTER TABLE public.wallpaper_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read gallery" ON public.wallpaper_generations
  FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "auth insert own" ON public.wallpaper_generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "anon insert anonymous" ON public.wallpaper_generations
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "increment counters" ON public.wallpaper_generations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
```

+ RPC `increment_wallpaper_download(uuid)` et `increment_wallpaper_share(uuid)` en SECURITY DEFINER pour compteurs.

+ Storage bucket public `wallpapers` pour les rendus sauvegardés en galerie.

### Rendu Canvas
- Un seul render haute résolution 3840×2160, puis re-scale via `canvas.toBlob()` pour autres formats
- Layout mosaïque : algorithme placement organique déterministe (seed = wallpaper_id) pour reproductibilité
- QR code via `qrcode` npm
- Grain papier via noise procedural léger
- Polices web déjà chargées (Crimson Text, Libre Baskerville)

### QR code
Cible :
- Portée événement → `/m/{slug}`
- Angle espèce → `/m/{slug}#species-{scientific_name}`
- Sinon → `/marches-du-vivant`

### Sélection photos
Fonction `pickPhotos({eventId, category, ambiance, count: 5})` :
1. Query prioritaire selon catégorie (marche_photos > marcheur_medias curés > species)
2. Filtre ambiance via champ `taken_at` heure (dawn=5-8h, day=8-18h, dusk=18-21h, night=21-5h) — fallback souple si peu de données
3. Diversité : évite doublons taxonomiques
4. Fallback iNaturalist si pas assez de photos locales

### Non prévu
- Pas d'IA générative d'image (uniquement composition de vraies photos)
- Pas d'upload utilisateur (source = base uniquement)
- Pas de personnalisation typo/couleurs (charte fixe = identité forte)