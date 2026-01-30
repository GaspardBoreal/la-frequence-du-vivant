

# Correction de l'affichage des icones de simulation responsive

## Probleme identifie

Les boutons de selection d'appareil (Desktop/Tablette/Mobile) dans la barre d'en-tete du Livre Vivant ne sont pas esthetiquement integres au design. Le probleme visible dans les captures :
- Les icones sont dans des boutons standards qui ne respectent pas le theme de couleurs
- Le contraste et l'etat actif ne sont pas clairement visibles
- L'espacement et les proportions ne sont pas harmonieux

## Solution proposee

Remplacer les boutons standards par un **toggle group** elegant qui s'integre au colorScheme du livre, avec :
- Un fond subtil pour le groupe entier
- Un indicateur anime pour l'element actif (comme dans TraverseesHub)
- Des icones bien proportionnees avec tooltips explicatifs
- Une transition fluide entre les etats

## Design visuel cible

```text
┌─────────────────────────────────────┐
│   ┌─────┐ ┌─────┐ ┌─────┐          │
│   │ 🖥️ │ │ 📱 │ │ 📲 │   ×       │
│   └──┬──┘ └─────┘ └─────┘          │
│      └─ indicateur anime ─┘         │
└─────────────────────────────────────┘
```

## Modifications techniques

### Fichier a modifier

**`src/components/admin/livre-vivant/LivreVivantViewer.tsx`**

Remplacer les lignes 152-170 (le bloc des boutons d'appareil) par :

```typescript
{/* Device preview toggles - Design elegant */}
<div 
  className="flex items-center gap-1 rounded-lg p-1"
  style={{ 
    backgroundColor: colorScheme.secondary + '15',
    border: `1px solid ${colorScheme.secondary}20`
  }}
>
  {(Object.entries(DEVICE_SIZES) as [DevicePreview, typeof deviceSize][]).map(([key, value]) => {
    const Icon = key === 'desktop' ? Monitor : key === 'tablet' ? Tablet : Smartphone;
    const isActive = devicePreview === key;
    
    return (
      <button
        key={key}
        onClick={() => setDevicePreview(key)}
        className="relative flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200"
        style={{
          color: isActive ? colorScheme.primary : colorScheme.secondary,
          backgroundColor: isActive ? colorScheme.background : 'transparent',
          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
        }}
        title={value.label}
      >
        <Icon className="h-4 w-4" />
        
        {/* Indicateur anime sous l'icone active */}
        {isActive && (
          <motion.div
            layoutId="device-indicator"
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
            style={{ backgroundColor: colorScheme.accent }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    );
  })}
</div>
```

## Ameliorations apportees

1. **Integration visuelle** : Le groupe utilise le `colorScheme` du livre pour le fond et les couleurs
2. **Etat actif clair** : L'icone active a un fond distinct + une barre indicatrice animee
3. **Transitions fluides** : Animation `layoutId` de Framer Motion pour l'indicateur
4. **Proportions harmonieuses** : Tailles legerement augmentees (h-8 w-8) pour meilleur confort
5. **Tooltips preserves** : L'attribut `title` affiche le nom de l'appareil au survol

## Resultat attendu

Le toggle group s'integrera parfaitement au theme du Livre Vivant, avec un indicateur anime sous l'icone selectionnee, comme le selecteur de modes dans TraverseesHub.

