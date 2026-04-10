

## Suivi GPS en temps réel — Mode "Approche"

### Constat actuel

La géolocalisation utilise `getCurrentPosition` (appel unique). L'utilisateur doit re-cliquer manuellement pour rafraîchir sa position — impossible de suivre son déplacement en continu vers un point.

### Proposition UX

**Un mode "Suivi" activable par appui long (ou double-tap) sur le bouton Crosshair existant.**

```text
┌─────────────────────────────────────────┐
│  Tap simple  → comportement actuel      │
│               (position unique + panel)  │
│                                          │
│  Appui long  → active le suivi continu  │
│  (ou 2nd tap   le bouton pulse en bleu, │
│   quand déjà   watchPosition démarre)   │
│   localisé)                              │
│                                          │
│  Tap en mode → désactive le suivi,      │
│  suivi actif   revient au mode statique │
└─────────────────────────────────────────┘
```

**Indicateurs visuels en mode suivi :**

1. **Bouton Crosshair** : anneau pulsant bleu continu (distingué du pulse léger actuel)
2. **Barre de proximité compacte** : remplace le DistancePanel lourd par un bandeau minimaliste en bas montrant uniquement le point le plus proche + distance, mis à jour en temps réel
3. **Cercle de précision** : le rayon du `Circle` autour du point bleu reflète `coords.accuracy` en temps réel
4. **Feedback haptique** (si supporté) : vibration légère quand on passe sous 100m du point cible

```text
┌──────────────────────────────────┐
│         Carte Leaflet            │
│                                  │
│     ● ← point bleu animé        │
│     ╎                            │
│     ╎  ligne pointillée          │
│     ╎                            │
│     📍 Point 03                  │
│                                  │
│                          [◎]     │  ← bouton avec anneau pulsant
│  ┌────────────────────────────┐  │
│  │ → Point 03 Peupliers  127m│  │  ← bandeau compact temps réel
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Modifications techniques

| Fichier | Action |
|---------|--------|
| `ExplorationCarteTab.tsx` | Remplacer `getCurrentPosition` par `watchPosition` en mode suivi, stocker le `watchId` dans un ref, cleanup au unmount |
| `ExplorationCarteTab.tsx` | Ajouter état `isTracking` (boolean) pour distinguer position unique vs suivi continu |
| `ExplorationCarteTab.tsx` | Modifier `GeolocateButton` : anneau animé quand `isTracking`, logique tap/long-press |
| `ExplorationCarteTab.tsx` | Ajouter composant `ProximityBanner` compact (1 ligne, point le plus proche + distance live) affiché en mode suivi à la place du DistancePanel complet |
| `ExplorationCarteTab.tsx` | Mettre à jour `UserLocationMarker` pour utiliser `coords.accuracy` dans le rayon du Circle |
| `ExplorationCarteTab.tsx` | Ajouter `navigator.vibrate(50)` quand distance < 100m (avec guard `'vibrate' in navigator`) |

### Détails d'implémentation

- **watchPosition** avec `{ enableHighAccuracy: true, maximumAge: 2000 }` — mise à jour ~1-2s
- **Cleanup** : `navigator.geolocation.clearWatch(watchId)` dans le return du useEffect et au unmount
- **ProximityBanner** : bandeau glassmorphism noir/blur, une seule ligne : icône directionnelle + nom du point + distance en temps réel avec transition CSS sur le nombre
- **Transition douce** : le DistancePanel complet reste accessible via tap sur le bandeau compact
- **Économie batterie** : le suivi se coupe automatiquement après 10 min d'inactivité (pas d'interaction carte)

