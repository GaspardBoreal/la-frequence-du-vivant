

## Plan : Mécanique poétique "Libérer pour invoquer"

### Concept

Quand une vignette est libérée (dépinnée), elle "offre sa place" en invoquant immédiatement une nouvelle apparition. C'est un cycle de renouvellement : libérer un souvenir en fait naître un autre.

---

### 1. Nouveau callback `onRelease`

Ajouter une prop `onRelease` à toutes les apparitions, appelée quand l'utilisateur dépinne.

**Fichiers** : Tous les `*Apparition.tsx`

```typescript
interface BirdApparitionProps {
  bird: RandomBird;
  onExpire: () => void;
  onFocus?: () => void;
  onRelease?: () => void;  // NOUVEAU
  ttl: number;
}
```

**Modification de `handleClick`** :
```typescript
const handleClick = () => {
  onFocus?.();
  const wasPinned = isPinned;
  setIsPinned(!isPinned);
  
  // Si on libere (etait pinned, ne l'est plus)
  if (wasPinned) {
    onRelease?.();
  }
};
```

---

### 2. Gestion dans DordoniaChoirView

**Fichier** : `src/components/dordonia/DordoniaChoirView.tsx`

Creer une fonction `invokeRandomApparition` qui choisit aleatoirement un type et declenche son fetch :

```typescript
const invokeRandomApparition = useCallback(() => {
  const types: ApparitionType[] = ['bird', 'species', 'fragment', 'voice', 'moral'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  switch (randomType) {
    case 'bird': fetchAndAddBird(); break;
    case 'species': fetchAndAddSpecies(); break;
    case 'fragment': 
    case 'moral': fetchAndAddText(); break;
    case 'voice': fetchAndAddAudio(); break;
  }
}, [fetchAndAddBird, fetchAndAddSpecies, fetchAndAddText, fetchAndAddAudio]);
```

**Option elegante : invoquer le meme type**

Pour une coherence poetique, liberer un oiseau fait apparaitre un autre oiseau :

```typescript
const invokeApparitionOfType = useCallback((type: ApparitionType) => {
  switch (type) {
    case 'bird': fetchAndAddBird(); break;
    case 'species': fetchAndAddSpecies(); break;
    case 'fragment': 
    case 'moral': fetchAndAddText(); break;
    case 'voice': fetchAndAddAudio(); break;
  }
}, [fetchAndAddBird, fetchAndAddSpecies, fetchAndAddText, fetchAndAddAudio]);
```

---

### 3. Integration dans renderApparition

Modifier le rendu pour passer `onRelease` :

```typescript
const renderApparition = (apparition: Apparition) => {
  const commonProps = {
    key: apparition.id,
    ttl: apparition.ttl,
    onExpire: () => removeApparition(apparition.id),
    onFocus: () => bringToFront(apparition.id),
    onRelease: () => invokeApparitionOfType(apparition.type), // ICI
  };
  
  // ... switch case pour chaque type
};
```

---

### 4. Feedback visuel de liberation

Ajouter une animation subtile quand on libere, avant l'arrivee de la nouvelle :

```typescript
// Dans handleClick des apparitions
if (wasPinned) {
  // Petit delai poetique avant d'invoquer
  setTimeout(() => {
    onRelease?.();
  }, 400); // 400ms pour laisser l'animation de "liberation" se jouer
}
```

---

### 5. Texte et animation du bouton "Liberer"

Modifier le texte pour suggerer l'action :

```tsx
{isPinned && (
  <motion.p 
    className="mt-2 text-xs text-cyan-400/40 text-center cursor-pointer"
    whileHover={{ scale: 1.05, color: 'rgba(34, 211, 238, 0.6)' }}
  >
    ✧ Liberer pour invoquer
  </motion.p>
)}
```

---

### Resume des modifications

| Fichier | Modification |
|---------|--------------|
| `DordoniaChoirView.tsx` | Ajouter `invokeApparitionOfType`, passer `onRelease` |
| `BirdApparition.tsx` | Ajouter prop `onRelease`, appeler dans `handleClick` |
| `VoiceApparition.tsx` | Idem |
| `FragmentApparition.tsx` | Idem |
| `SpeciesApparition.tsx` | Idem |
| `MoralApparition.tsx` | Idem |

---

### Resultat attendu

1. L'utilisateur fixe une vignette (Northern Shoveler)
2. Il clique sur "Liberer pour invoquer"
3. Apres 400ms d'animation de liberation, une nouvelle vignette du meme type (oiseau) apparait ailleurs sur l'ecran
4. La vignette liberee reprend son timer d'expiration normal

C'est un cycle poetique : chaque liberation engendre une nouvelle apparition, comme une conversation entre le spectateur et le vivarium.

