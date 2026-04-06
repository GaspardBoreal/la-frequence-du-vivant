

## Aligner les badges de type de marche dans l'onglet Marches sur le Carnet

### Problème

L'onglet **Marches** utilise encore `detectPillars` (analyse textuelle → "Biodiversité", "Bioacoustique", "Géopoétique") au lieu du champ `event_type` avec les vrais badges colorés du Carnet Vivant.

### Modifications

**1. `src/pages/MarchesDuVivantMonEspace.tsx`** — Ajouter `event_type` au select de la requête `upcoming-marche-events-mon-espace` :
```
.select('id, title, description, date_marche, lieu, event_type, exploration_id, explorations(name)')
```

**2. `src/components/community/tabs/MarchesTab.tsx`** :
- Ajouter `event_type` à l'interface `MarcheEvent`
- Supprimer la fonction `detectPillars` et ses imports (`Leaf`, `Music`, `PenLine`)
- Importer `getMarcheEventTypeMeta` depuis `@/lib/marcheEventTypes`
- Dans `EventCard`, remplacer le bloc badges `detectPillars` par le même rendu que le Carnet :
```tsx
const typeMeta = getMarcheEventTypeMeta(event.event_type);
// ...
{typeMeta && (
  <div className="flex flex-wrap gap-1.5">
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.badgeClassName}`}>
      <typeMeta.icon className="w-3 h-3" />
      {typeMeta.label}
    </span>
  </div>
)}
```

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/MarchesDuVivantMonEspace.tsx` (ajouter `event_type` au select) |
| Modifier | `src/components/community/tabs/MarchesTab.tsx` (supprimer `detectPillars`, utiliser `getMarcheEventTypeMeta`) |

