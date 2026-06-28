## Objectif

Ajouter dans le panneau **Options carte** un interrupteur élégant pour afficher / masquer les **rayons d'observation** (les halos verts autour des points de marche). Affichage **ON par défaut**, mémorisé en local comme les autres préférences.

## Intégration UX (sans surcharge)

Une seule ligne ajoutée dans la section **AFFICHER**, juste après « Points intermédiaires » et avant « Stations météo » — placement logique car les rayons sont liés aux points de marche :

```text
AFFICHER
  ↻  Boucle fermée                     [toggle]
  ✨  Points intermédiaires             [toggle]
  ◎  Rayons d'observation              [toggle ON]   ← NOUVEAU
     500 m autour de chaque point
  ☀  Stations météo                    [OFF ▾]
```

- **Icône** : `Target` (lucide) dans une pastille émeraude assortie à la couleur des cercles sur la carte → lecture visuelle immédiate.
- **Label** : « Rayons d'observation ».
- **Description dynamique** :
  - ON → « Zone d'écoute de la biodiversité » (ou rayon résolu si unique, ex. « 500 m autour de chaque point »)
  - OFF → « Halos masqués (carte épurée) »
- Switch émeraude cohérent avec les deux toggles au-dessus, animation déjà gérée par `LayerRow` existant.
- **Badge compteur** du bouton Options : on **n'incrémente pas** quand le rayon est ON (état par défaut), seulement quand l'utilisateur l'a **masqué** — sinon le badge serait permanent.

## Mise en œuvre technique

### 1. `src/hooks/useMapLayers.ts`
- Ajouter `showObservationRadii: boolean` à `MapLayersState`, défaut **`true`**.
- Migration : si absent dans le localStorage existant → `true`.
- `activeCount` : `+ (layers.showObservationRadii ? 0 : 1)` (compte seulement si masqué = état non-défaut).

### 2. `src/components/community/exploration/MapOptionsMenu.tsx`
- Importer `Target` depuis `lucide-react`.
- Ajouter un `<LayerRow>` entre `Points intermédiaires` et `WeatherStationsRow` :
  ```tsx
  <LayerRow
    icon={<Target className="w-4 h-4" strokeWidth={2.5} />}
    iconClass="bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
    label="Rayons d'observation"
    description={layers.showObservationRadii
      ? "Zone d'écoute de la biodiversité"
      : 'Halos masqués (carte épurée)'}
    checked={layers.showObservationRadii}
    onCheckedChange={() => { haptic(); onToggleLayer('showObservationRadii'); }}
  />
  ```

### 3. `src/components/community/exploration/ExplorationCarteTab.tsx`
- Autour du bloc `{/* Radius circles per marche ... */}` (ligne ~929) : wrapper `{mapLayers.showObservationRadii && (...) }` pour conditionner le rendu de tous les `<Circle>` de rayons.
- Aucun autre changement (les cercles « halo de halo » conservent leur logique radius).

## Hors scope

- Pas de slider de rayon global (le rayon par marche reste géré ailleurs).
- Pas de modification des couleurs/opacité des cercles.
- Pas de logique métier touchée — uniquement la couche d'affichage.