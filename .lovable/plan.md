

## Vérification de cohérence GPS des photos — Mode Fiche

### Contexte

Les photos uploadées (admin et contributions marcheurs) contiennent parfois des coordonnées GPS dans leurs métadonnées EXIF. L'objectif est de comparer ces GPS avec le point de référence de la marche pour détecter les incohérences (photo prise loin du lieu).

### Contraintes identifiées

- **`exifr`** est déjà installé (extraction EXIF côté client depuis une URL ou un blob)
- Les photos admin (`marche_photos`) : metadata EXIF parfois stockée en base (champ `metadata.exif.latitude/longitude`), parfois vide
- Les photos marcheurs (`marcheur_medias`) : **aucune colonne metadata** → extraction temps réel obligatoire via `exifr.gps(url)`
- Chaque marche a `latitude` / `longitude` dans la table `marches`

### Ce qui sera fait

**1. Hook `usePhotoGpsCheck`**

Un hook React Query qui, pour une marche donnée :
- Récupère les coordonnées GPS de la marche (réutilise le pattern existant ligne 625)
- Pour chaque photo (admin + contributions), tente d'extraire le GPS via `exifr.gps(url)` (fetch + parse EXIF en mémoire)
- Calcule la distance en mètres (formule Haversine) entre le GPS photo et le point marche
- Retourne un tableau `{ photoId, nom, url, gpsPhoto, gpsMarche, distanceM, hasGps }`
- Lazy : ne se déclenche que sur clic du bouton (option `enabled: false` + `refetch()`)

**2. Bouton discret dans la barre d'action du mode Fiche**

- Icône `Crosshair` (lucide) + tooltip "Vérifier GPS"
- Style cohérent avec les boutons existants : petit, `bg-white/5`, `text-white/40`
- Visible **uniquement en mode Fiche**
- Au clic → lance l'extraction EXIF + affiche un Dialog/popup avec les résultats

**3. Popup résultats GPS**

Dialog compact mobile-first avec la liste des photos :
```text
┌─────────────────────────────────────────────┐
│  📍 Cohérence GPS — Étape "Parc Montplaisir"│
│  Point marche: 43.610, 3.877               │
├─────────────────────────────────────────────┤
│  📷 IMG_001.jpeg                            │
│  ✅ 45m — 📍photo  📍marche               │
│                                             │
│  📷 IMG_002.jpeg                            │
│  ⚠️ 2.3km — 📍photo  📍marche             │
│                                             │
│  📷 IMG_003.jpeg                            │
│  ❌ Pas de GPS                              │
└─────────────────────────────────────────────┘
```

- Distance < 200m → vert (✅)
- Distance 200m-1km → orange (⚠️)  
- Distance > 1km → rouge (🔴)
- Pas de GPS → gris (❌)
- Liens Google Maps : `https://maps.google.com/?q=lat,lng` pour photo ET pour marche

**4. Info GPS discrète sous chaque photo en mode Fiche**

Dans `ContributionItem` (mode fiche) et dans le rendu des photos admin, ajouter une ligne sous la date :
```text
  10 août 2025  🌐 Public
  📍 45m du point                    ← nouveau
```

- Texte `text-[9px]`, couleur selon distance (vert/orange/rouge)
- Lien cliquable vers Google Maps du GPS photo
- Si pas de GPS : rien affiché (pas de bruit visuel)

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/hooks/usePhotoGpsCheck.ts` | **Nouveau** — hook d'extraction EXIF GPS + calcul distance Haversine |
| `src/components/community/MarcheDetailModal.tsx` | Bouton GPS dans barre Fiche + Dialog résultats + passage des données GPS aux items |
| `src/components/community/contributions/ContributionItem.tsx` | Ajout prop optionnelle `gpsDistance` + affichage discret sous la date en mode fiche |

### Note technique importante

`exifr.gps(url)` fait un fetch partiel (range request) pour lire uniquement les tags GPS sans télécharger l'image entière. C'est performant même sur mobile. Cependant, les images stockées sur Supabase Storage doivent supporter les range requests (c'est le cas par défaut).

