

## Corriger le suivi GPS temps réel (notamment en conditions TGV)

### Probleme identifie

Dans `startTracking()`, le `watchPosition` est configure avec `{ enableHighAccuracy: true, maximumAge: 2000 }` sans `timeout`. En TGV :
- Le GPS a du mal a obtenir un fix precis (carrosserie metallique, vitesse)
- Sans `timeout`, le navigateur peut attendre indefiniment un fix haute precision
- L'erreur callback appelle silencieusement `stopTracking()` — l'utilisateur ne sait pas que le suivi a echoue
- `maximumAge: 2000` rejette des positions de plus de 2s, ce qui est trop strict en mouvement rapide

### Modifications — `ExplorationCarteTab.tsx`

**1. Ajouter un fallback basse precision**

```typescript
const id = navigator.geolocation.watchPosition(
  (pos) => {
    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
    setUserAccuracy(pos.coords.accuracy);
  },
  (err) => {
    // Ne pas couper le suivi sur timeout — retenter
    if (err.code === err.TIMEOUT) {
      console.warn('GPS timeout, en attente du prochain fix...');
      return;
    }
    // Erreur fatale (permission refusee, indisponible)
    console.error('Geolocation error:', err.message);
    stopTracking();
  },
  { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
);
```

**2. Augmenter `maximumAge` a 5000ms** — accepter des positions legerement plus anciennes plutot que de n'avoir rien

**3. Ajouter `timeout: 15000`** — forcer un retour (succes ou erreur) apres 15s au lieu d'attendre indefiniment

**4. Ne pas couper le suivi sur erreur TIMEOUT** — seules les erreurs `PERMISSION_DENIED` et `POSITION_UNAVAILABLE` arretent le suivi

**5. Ajouter un toast d'information quand le suivi est coupe par erreur** — pour que l'utilisateur sache ce qui s'est passe

### Resultat

Le suivi restera actif meme quand le GPS met du temps a fournir un fix (tunnel, TGV). L'utilisateur verra son point bleu avancer des que le navigateur obtient une position, meme de moindre precision.

