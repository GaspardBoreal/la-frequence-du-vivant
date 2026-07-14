## Problème

Sur la page publique `/m/:slug`, la vue **Cadastre** affiche bien la tuile Etalab, mais les **parcelles** ne s'affichent pas (pas de contours cliquables, pas de popup INSEE/section/n°) comme dans Mon Espace → Carte → Cadastre.

**Cause racine** dans `src/components/maps/RichMap.tsx` :
```ts
{controls.cadastre && mapStyle === 'cadastre' && cadastrePoints.length > 0 && (
  <CadastreLayer points={cadastrePoints} enabled />
)}
```
et
```ts
const cadastrePoints = useMemo(() => {
  if (!marcheRoute) return [];
  return marcheRoute.steps…
}, [marcheRoute]);
```

Sur la page publique :
1. `controls={{ zoom: true, style: true, geolocate: false }}` — `cadastre` est absent donc `false` par défaut → `<CadastreLayer>` jamais monté.
2. Aucun `marcheRoute` n'est passé → `cadastrePoints` est vide de toute façon.

Résultat : seule la tuile fond cadastre s'affiche, sans le composant `CadastreLayer` qui fetch les parcelles autour des points et gère leur rendu/interaction (comme sur `ExplorationCarteTab`).

## Correctif (frontend, factorisation, aucune nouvelle logique)

### 1. `src/components/maps/RichMap.tsx`
- Étendre `cadastrePoints` avec un **fallback** : si `marcheRoute` est absent ou vide, utiliser `center` comme point unique (`[{ id: 'center', lat: center[0], lng: center[1] }]`). Cela garantit que la couche cadastre a toujours au moins un point pivot pour charger les parcelles autour de la vue, quel que soit le contexte d'appel.
- Assouplir la garde de rendu : `{controls.cadastre && mapStyle === 'cadastre' && cadastrePoints.length > 0 && (…)}` — la garde reste identique, seul l'input est enrichi.

### 2. `src/pages/PublicEventPage.tsx`
- Passer `controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}` à `<RichMap>` de la section carte pour activer le toggle Cadastre et le `CadastreLayer` associé.
- Ne rien changer d'autre : `event.latitude` / `event.longitude` servent déjà de `center`, ils alimenteront le fallback ci-dessus.

## Détail technique

- `CadastreLayer` (déjà réutilisé par `ExplorationCarteTab`) prend en charge : fetch des parcelles autour de chaque `point`, rendu polygonal, popup INSEE/section/numéro, styles adaptés au fond `cadastre`. Aucun changement à ce composant.
- Aucune prop `previewGeometry` / `tapMode` : la page publique reste read-only, pas de création de marche ni de saisie GPS.
- Pas d'impact backend / RLS : `CadastreLayer` interroge l'API Etalab publique (via `cadastre-proxy` déjà en place).

## Résultat attendu

Vue publique `/m/:slug` → onglet Cadastre : les parcelles apparaissent en surimpression comme dans Mon Espace, cliquables, avec les popups d'infos parcellaires standard.
