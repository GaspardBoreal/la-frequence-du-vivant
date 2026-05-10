# Métadonnées photo dans le lightbox — option élégante & discrète

## Idée UX

Ajouter dans le footer du `MediaLightbox` une petite **icône `Info` (ⓘ)** à côté du chip d'attribution. Au tap/clic, un **panneau glassmorphism** glisse depuis le bas (mobile) ou apparaît en popover ancré à l'icône (desktop), affichant les métadonnées techniques de la photo.

Caractéristiques :
- **Discret par défaut** : juste une icône 16px, opacité 60%, devient 100% au hover.
- **Masqué si aucune métadonnée** : si `metadata` est vide → pas d'icône du tout (zéro pollution visuelle).
- **Lecture seule** : pas d'édition, simple consultation.
- **Tap-outside / Escape** pour fermer.

## Contenu du panneau

Affiché de manière sobre, ligne par ligne, avec icônes Lucide (12-14px, opacité 60%) :

```text
📍 Coordonnées GPS
   45.415217, -0.004056              [Copier] [Voir sur la carte ↗]

🕐 Prise de vue
   8 avril 2026 · 18:06

📐 Dimensions          1920 × 1440 px       (si présent)
💾 Taille              2.4 Mo               (taille_octets)
🌐 Visibilité          Public / Privé
📅 Ajoutée le          10 mai 2026
```

- **Copier** : copie `lat, lng` dans le presse-papier (toast confirm).
- **Voir sur la carte ↗** : ouvre `https://www.openstreetmap.org/?mlat=...&mlon=...#map=18/...` dans un nouvel onglet.
- Si pas de GPS → bloc GPS remplacé par une mention discrète "Aucune coordonnée GPS dans cette photo".

## Détails techniques

### 1. Étendre `LightboxItem` (`src/components/community/contributions/MediaLightbox.tsx`)

Ajouter champs optionnels :
```ts
metadata?: {
  gps?: { latitude: number; longitude: number };
  date_taken?: string;
  width?: number;
  height?: number;
} | null;
sizeBytes?: number | null;
```

### 2. Nouveau composant `MediaMetadataPanel.tsx` (à côté de `MediaLightbox.tsx`)

- Reçoit `item: LightboxItem`.
- Mobile (`< md`) : Sheet bottom (Radix `Sheet` côté `bottom`) avec backdrop semi-transparent.
- Desktop (`>= md`) : `Popover` Radix ancré au bouton `Info`, aligné à droite.
- Fond `bg-white/8 backdrop-blur-xl` + `ring-1 ring-white/15`, padding sobre, typo `text-xs/text-sm` blanc opacité graduelle.
- Boutons "Copier" et "Voir sur la carte" en variantes `ghost` discrètes.

### 3. Bouton trigger dans le footer du lightbox

À côté du chip d'attribution, ajouter (uniquement si `item.metadata` non vide) :
```tsx
<button aria-label="Métadonnées" className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition">
  <Info className="w-4 h-4" />
</button>
```

### 4. Propager les métadonnées depuis les hooks consommateurs

Identifier les call-sites qui construisent les `LightboxItem[]` (probablement `useExplorationAllMedia`, `useMarcheurContributions`, et la galerie de la `MarcheDetailModal`) et y ajouter le mapping :
```ts
metadata: row.metadata ?? null,
sizeBytes: row.taille_octets ?? null,
```

Aucun changement de DB, aucun changement de RLS — les colonnes `metadata` et `taille_octets` sont déjà sélectionnées (à vérifier ; sinon ajouter au `select`).

### 5. Pas de changement de design tokens

Réutilise les classes existantes (`text-white/70`, `bg-white/10`, etc.) déjà utilisées dans le lightbox, cohérent avec le style sombre overlay.

## Validation

- Ouvrir une photo avec GPS → icône ⓘ visible → panneau affiche coords cliquables.
- Ouvrir une photo sans metadata → aucune icône.
- Tester mobile (sheet bottom) + desktop (popover).
- Tester "Copier" + "Voir sur la carte".

## Hors scope

- Pas d'édition des métadonnées.
- Pas de re-extraction EXIF côté client.
- Pas de changement sur les autres lightbox (PartagePublic, etc.) — uniquement `MediaLightbox.tsx`.
