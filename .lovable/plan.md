

## Corriger la visibilité du bouton "Se désinscrire"

### Problème

La condition actuelle dans `MarcheCard` (ligne 78) est :
```ts
const canUnregister = !participation.validated_at && isFuture;
```

La participation DEVIAT a été validée par un admin (`validation_method: 'admin_retroactif'`), donc `validated_at` n'est pas null, et le bouton est masqué -- alors que la marche est demain.

### Correction

Changer la logique pour permettre la désinscription de toute marche **future**, indépendamment de `validated_at` :

```ts
const canUnregister = isFuture;
```

Si on veut être plus prudent (empêcher la désinscription le jour J après pointage QR), on peut utiliser :
```ts
const canUnregister = isFuture && participation.validation_method !== 'qr_code';
```

Cela permet la désinscription même si un admin a pré-validé, mais pas si le marcheur a scanné le QR code sur place.

### Fichier impacte

| Action | Fichier | Ligne |
|--------|---------|-------|
| Modifier | `src/components/community/CarnetVivant.tsx` | 78 |

Une seule ligne a changer.

