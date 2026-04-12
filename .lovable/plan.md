

## Amélioration visuelle des marqueurs GPS — Différenciation marche vs photos

### Problème actuel

Le marqueur du point de la marche (doré `#fbbf24`) et les marqueurs photos utilisent tous des `CircleMarker` avec des couleurs internes qui peuvent se confondre visuellement, surtout le jaune-doré de la marche avec l'orange des photos à distance moyenne.

### Proposition de design

**Point de la marche** — Marqueur distinctif "cible" :
- Cercle plus grand (`radius: 12`) avec remplissage **blanc pur `#ffffff`** et bordure épaisse **émeraude foncé `#065f46`** (weight: 4)
- Ce blanc contraste fortement avec tous les fonds de carte et ne se confond avec aucune couleur de distance
- L'étoile ⭐ dans la légende reste cohérente

**Points photos** — Inchangés dans leur logique mais clarifiés :
- Remplissage = couleur distance (vert `#10b981` / ambre `#f59e0b` / rouge `#ef4444`)
- Bordure = couleur unique par photo (palette existante)
- Radius reste à 7

**Légende repositionnée** — Intégrée entre la carte et le toggle de style, dans un bandeau glassmorphism compact :

```text
┌──────────────────────────────────────┐
│  [        CARTE LEAFLET           ]  │
├──────────────────────────────────────┤
│  ◎ Point marche  ● <200m  ● 200m-1km  ● >1km  │
├──────────────────────────────────────┤
│  [Géo]  [Sat]  [Relief]             │
└──────────────────────────────────────┘
```

- La légende utilise un fond `bg-white/5 backdrop-blur` avec `rounded-lg` et `py-1.5 px-3`
- Le point marche utilise un cercle blanc cerné d'émeraude (via un petit SVG inline ou un span stylé)
- Les points de distance utilisent des cercles colorés correspondants

### Fichier modifié

| Fichier | Modification |
|---------|-------------|
| `src/components/community/contributions/GpsMapView.tsx` | Changer le marqueur marche (blanc/émeraude), refondre la légende en bandeau glassmorphism positionné entre carte et toggle |

### Détail des changements

1. **Marqueur marche** (ligne ~130-138) : `fillColor: '#ffffff'`, `color: '#065f46'`, `weight: 4`, `radius: 12`
2. **Légende** (ligne ~260-266) : remplacer par un bandeau glassmorphism avec des indicateurs visuels SVG/span alignés, incluant le cercle blanc-émeraude pour "Point marche"
3. **Toggle styles** reste en dessous, inchangé

