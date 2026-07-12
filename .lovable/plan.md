## Objectif

Enrichir la popup carte des points "Partenaires Sol Vivant" pour reprendre le langage visuel du bandeau droit (Copie 1) — bandeau lime, label "PARTENAIRE SOL VIVANT", nom en gros, adresse avec pin, catégories en badges lime, CTA "Voir la fiche →".

## Changement

**Fichier modifié :** `src/components/carte-mdv/views/MapView.tsx`

Remplacer la `<Popup>` actuelle des `CircleMarker` Sol Vivant (lignes 216-230) par une carte structurée façon mini-fiche :

```
┌─────────────────────────────┐
│ [Bandeau lime #84cc16]      │
│  PARTENAIRE SOL VIVANT      │  ← label uppercase blanc semi-opaque
│  Le Chou et la Fleur        │  ← nom gras blanc, plus grand
│  📍 9e Rang                 │  ← adresse (street_address) si présente
├─────────────────────────────┤
│ [badge lime] Maraîchers…    │  ← catégories (jusqu'à 2)
│                             │
│ Voir la fiche →             │  ← bouton pleine largeur, ouvre le Sheet
└─────────────────────────────┘
```

Détails :
- Popup sans padding par défaut (`className="carte-mdv-sv-popup"` + override CSS inline / wrapper `p-0`) — largeur ~260px.
- Bandeau : `bg-lime-500 text-white px-4 py-3`, mêmes tokens que `SolVivantPointSheet` pour cohérence.
- Adresse : rendue seulement si `p.street_address` (déjà exposé dans `SolVivantPoint`).
- Catégories : utiliser `p.categories` (array déjà chargé) plutôt que le seul `p.category` — max 2 badges + " +N" si plus.
- CTA : bouton compact `w-full` sur fond crème, texte lime foncé, ouvre le Sheet via `setSelectedSvId(p.id)` (comportement actuel conservé).
- Le clic direct sur le CircleMarker continue d'ouvrir le Sheet en parallèle ; la popup reste une prévisualisation rapide.

Aucune modification backend, aucun autre composant touché.
