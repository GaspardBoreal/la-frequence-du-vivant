

## Corrections de la carte "Empreintes passées"

### Problème 1 : Marche manquante sur la carte

La requête SQL confirme que **"La transhumance de Mouton Village"** a `latitude = NULL` et `longitude = NULL` en base. Le composant `PastEventsMap` filtre les événements sans coordonnées (`filter(e => e.latitude != null && e.longitude != null)`), ce qui est correct. Il faut donc **ajouter les coordonnées GPS** de cet événement en base.

- Vouillé (Vienne) : ~46.5436, 0.1673 (point de départ du trajet)

Action : **migration SQL** pour mettre à jour latitude/longitude de l'événement `a9782d7f-04df-4a38-a9b5-a772239ba06a`.

### Problème 2 : Couleurs des marqueurs incohérentes avec les badges

Les couleurs des `CircleMarker` utilisent `EVENT_TYPE_COLORS` (emerald, violet, amber) mais visuellement sur la carte sombre, elles ne sont pas immédiatement reconnaissables. Il faut ajouter une **légende** sous la carte pour associer chaque couleur à son type.

### Modifications

**1. Migration SQL** — Mettre à jour les coordonnées de la Transhumance :
```sql
UPDATE marche_events 
SET latitude = 46.5436, longitude = 0.1673
WHERE id = 'a9782d7f-04df-4a38-a9b5-a772239ba06a';
```

**2. `src/components/community/tabs/MarchesTab.tsx`** — Ajouter une légende sous la carte :
- 3 pastilles colorées avec le label du type (Agroécologique / Éco poétique / Éco tourisme)
- Utiliser `getMarcheEventTypeMeta` pour les icônes et labels
- Utiliser `EVENT_TYPE_COLORS` pour les pastilles
- Style compact : `flex gap-3 text-[10px] text-muted-foreground mt-2`

```text
[●] Agroécologique  [●] Éco poétique  [●] Éco tourisme
```

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Créer | Migration SQL — UPDATE coordonnées Transhumance |
| Modifier | `src/components/community/tabs/MarchesTab.tsx` — légende sous la carte |

