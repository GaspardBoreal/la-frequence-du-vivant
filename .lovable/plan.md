## Constat

Dans le drawer Espèce (Synthèse → Simulateur → fiche espèce), la carte `<RichMap>` affiche bien le tracé de la marche en arrière-plan — mais **les pastilles numérotées 1-2-3-4 des étapes de marche se superposent aux marqueurs émeraude pulsants** de l'espèce (cf. capture). Visuellement, ça parasite la lecture de "où est l'espèce".

Par ailleurs, l'utilisateur veut pouvoir **piloter cette visibilité depuis la carte elle-même** (UX en place plutôt que prop figée), et ce contrôle doit être **réutilisable** pour profiter aussi à l'onglet Carte si besoin.

`RichMap` expose déjà la prop `marcheRoute.renderMarkers` (booléen). Il manque :
1. un défaut adapté au cas "drawer espèce" (markers OFF, trace ON),
2. un **toggle UI** discret sur la carte pour montrer/masquer ces étapes à la volée.

## Proposition (UX élégante + design system)

### 1. Nouveau micro-contrôle `<MarcheRouteToggle>` mutualisé

Petit bouton glassmorphism cohérent avec `MapStyleToggle` et `ZoomControls` (même look : `bg-black/50 backdrop-blur-xl`, bordure `white/15`, accent émeraude actif). Icône `Footprints` (lucide). Position par défaut sous le `MapStyleToggle` (top-right), empilable.

États :
- **ON** : pastilles numérotées + flèches directionnelles visibles, opacité 1
- **OFF** : seules la polyline reste, à opacité réduite (≈ 0.55) — la marche devient un "fantôme contextuel"

Tooltip : "Afficher / masquer les étapes de la marche".

### 2. Intégration dans `<RichMap>`

Ajout d'une option `controls.marcheRouteVisibility?: boolean` (défaut `false`). Quand activée ET qu'une `marcheRoute` est fournie, `RichMap` :
- gère l'état interne `markersVisible` (initialisé via `marcheRoute.renderMarkers ?? true`)
- rend `<MarcheRouteToggle>` à côté de `MapStyleToggle`
- pilote `renderMarkers` et applique automatiquement `opacity = markersVisible ? (marcheRoute.opacity ?? 1) : 0.4` sur la polyline (via `MarcheRouteLayer`) pour que le "OFF" devienne visuellement plus discret sans disparaître complètement

Avantages :
- Aucun consommateur n'a besoin de gérer l'état lui-même
- Le contrôle reste dans la lib `maps/`, donc dispo aussi pour `ExplorationCarteTab` plus tard si besoin
- `marcheRoute.renderMarkers` reste exploitable comme **valeur initiale** côté drawer (markers OFF par défaut)

### 3. Réglage par défaut dans `SpeciesGpsDrawer`

```tsx
marcheRoute={{
  steps: marcheRouteSteps,
  renderMarkers: false,   // markers cachés par défaut dans le drawer
  opacity: 0.55,
}}
controls={{
  zoom: true, style: true, geolocate: true,
  cadastre: true, weather: true,
  marcheRouteVisibility: true,  // toggle visible
}}
```

Résultat dans le drawer : par défaut, **seul le tracé fantôme** est visible derrière les marqueurs espèce. L'utilisateur peut révéler les étapes 1-2-3-4 en un clic si besoin de localiser précisément l'observation par rapport au parcours.

### 4. Légende dynamique sous la carte

Adapter la phrase actuelle ("Tracé de la marche en arrière-plan.") pour refléter l'état :
- markers OFF → "Tracé de la marche en arrière-plan."
- markers ON → "Tracé et étapes de la marche affichés."

(Implémenté via `onMarcheVisibilityChange?: (visible: boolean) => void` exposé par `RichMap` — escape hatch propre, n'impose rien aux autres consommateurs.)

## Fichiers touchés

- **CRÉÉ** `src/components/maps/controls/MarcheRouteToggle.tsx`
- **ÉDITÉ** `src/components/maps/RichMap.tsx` — état interne `markersVisible`, branchement du toggle, propagation opacity
- **ÉDITÉ** `src/components/maps/index.ts` — export du nouveau contrôle
- **ÉDITÉ** `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx` — défaut markers OFF, activation du toggle, légende dynamique

## Hors-scope

- Pas de modif de `MarcheRouteLayer` au-delà de prop opacity déjà existante
- Pas d'activation du toggle dans `ExplorationCarteTab` (le menu Carte garde son comportement actuel) — le contrôle est dispo, à activer sur demande dans une prochaine itération si besoin
- Aucun changement DB / logique métier
