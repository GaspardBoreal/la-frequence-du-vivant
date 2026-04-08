

## Intégrer les contributions marcheurs dans les galeries admin

### Diagnostic

Les galeries admin (Photos, Audio, Textes) ne consultent que les tables admin :
- `marche_photos` → 241 photos admin
- `marche_audio` → audios admin  
- `marche_textes` → textes admin

Les contributions des marcheurs sont stockées dans des tables séparées :
- `marcheur_medias` → **98 photos** utilisateurs (dont les 6 de DEVIAT Point 00)
- `marcheur_audio` → audios utilisateurs
- `marcheur_textes` → textes utilisateurs

La page exploration affiche les deux sources, mais l'admin ne montre que les données admin. C'est pourquoi "DEVIAT Point 00" montre 6 photos côté marcheur mais 0 côté admin.

### Solution

Enrichir chaque galerie admin pour qu'elle charge aussi les contributions marcheurs et les fusionne avec les données admin, avec un badge visuel distinguant la source (Admin / Contribution).

### Modifications

**1. `src/components/admin/PhotoGalleryAdmin.tsx`**

Dans le `useEffect` de chargement (ligne ~90), après le chargement des `marche_photos`, ajouter une requête sur `marcheur_medias` filtrée par `type_media = 'photo'` et les `marche_id` des marches filtrées. Fusionner les résultats dans le même tableau `photos` avec un champ `source: 'admin' | 'contribution'` pour distinguer visuellement.

Ajouter un badge "Contribution" (orange) vs "Admin" (vert) sur chaque carte photo.

**2. `src/components/admin/AudioGalleryAdmin.tsx`**

Même logique : charger `marcheur_audio` en plus de `marche_audio` pour les marches filtrées. Fusionner avec badge source.

**3. `src/components/admin/TextesLitterairesGalleryAdmin.tsx`**

Même logique : charger `marcheur_textes` en plus de `marche_textes` pour les marches filtrées. Fusionner avec badge source.

### Détails techniques

Requête supplémentaire pour les photos (exemple) :
```sql
SELECT id, url_fichier, titre, marche_id, created_at, user_id, is_public
FROM marcheur_medias
WHERE type_media = 'photo'
AND marche_id IN (liste des IDs filtrés)
```

Les objets contribution sont mappés vers le même format `PhotoWithMarche` avec un champ `source` additionnel. L'affichage est identique sauf le badge de source.

Un filtre optionnel "Source" (Toutes / Admin / Contributions) permet de filtrer par provenance.

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/components/admin/PhotoGalleryAdmin.tsx` |
| Modifier | `src/components/admin/AudioGalleryAdmin.tsx` |
| Modifier | `src/components/admin/TextesLitterairesGalleryAdmin.tsx` |

