

## Le bouton GPS existe bien — et améliorations demandées

### Situation actuelle

Le bouton 🎯 (Crosshair) **existe déjà** dans la barre d'action, juste à droite du toggle "Immersion / Fiche", quand vous êtes en mode **Fiche**. C'est un petit bouton gris très discret (`bg-white/5 text-white/40`) — il est facile de le rater.

### Ce qui sera modifié

**1. Rendre le bouton GPS plus visible**

- Ajouter un label textuel "GPS" à côté de l'icône 🎯 pour qu'il soit identifiable
- Légère amélioration du contraste : `text-white/50` au lieu de `text-white/40`

**2. Afficher "GPS photo non disponible" sous les photos sans GPS**

Dans `ContributionItem.tsx`, la condition actuelle (ligne 162) n'affiche rien si `hasGps` est false. Modification :

- Si `gpsDistance` est fourni (= le check GPS a été lancé) ET `hasGps === false` → afficher discrètement `📍 GPS non disponible` en `text-white/20 text-[9px]`
- Si `gpsDistance` est null (= check pas encore lancé) → rien affiché (comportement actuel)

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/community/MarcheDetailModal.tsx` | Ajouter label "GPS" au bouton Crosshair |
| `src/components/community/contributions/ContributionItem.tsx` | Ajouter fallback "GPS non disponible" quand `gpsDistance` est fourni mais `hasGps === false` |

