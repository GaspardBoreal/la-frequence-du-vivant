
## Plan : Système anti-doublons élégant pour le Chœur d'apparitions

### Diagnostic

Le problème est double :
1. `fetchRandomText()` peut retourner le même texte si la sélection aléatoire tombe deux fois sur le même index
2. `addApparition()` ne vérifie pas si le contenu est déjà présent à l'écran

### Solution : Filtrage à deux niveaux

---

### Niveau 1 : Exclusion côté fetch (useRandomExplorationData)

Ajouter un paramètre optionnel `excludeIds` aux fonctions de fetch pour exclure les items déjà affichés.

**Fichier** : `src/hooks/useRandomExplorationData.ts`

```typescript
const fetchRandomText = useCallback(async (excludeIds: string[] = []): Promise<RandomText | null> => {
  // ...fetch textes...
  
  // Filtrer les textes déjà affichés
  const availableTextes = textes.filter(t => !excludeIds.includes(t.id));
  
  if (availableTextes.length === 0) {
    // Fallback: utiliser tous les textes si tous sont exclus
    const randomText = textes[Math.floor(Math.random() * textes.length)];
    // ...
  }
  
  const randomText = availableTextes[Math.floor(Math.random() * availableTextes.length)];
  // ...
}, []);
```

Appliquer la même logique pour `fetchRandomBird`, `fetchRandomSpecies`, et `fetchRandomAudio`.

---

### Niveau 2 : Vérification côté addApparition (DordoniaChoirView)

Avant d'ajouter une apparition, vérifier si un contenu avec le même ID source existe déjà.

**Fichier** : `src/components/dordonia/DordoniaChoirView.tsx`

```typescript
const addApparition = useCallback((type: ApparitionType, content: any) => {
  if (!content) return;
  
  // Extraire l'ID source du contenu
  const contentId = content.id;
  
  // Vérifier si ce contenu est déjà affiché
  setApparitions(prev => {
    const isDuplicate = prev.some(a => {
      const existingId = (a.content as any).id;
      return existingId === contentId;
    });
    
    if (isDuplicate) {
      console.log(`Apparition ignorée (doublon): ${contentId}`);
      return prev; // Ne pas ajouter
    }
    
    // ... logique d'ajout existante
  });
}, []);
```

---

### Niveau 3 : Passer les IDs exclus aux fetchers

Modifier les fetchers pour passer automatiquement les IDs actuellement visibles.

```typescript
const fetchAndAddText = useCallback(async () => {
  // Récupérer les IDs des fragments/morals déjà affichés
  const excludeIds = apparitions
    .filter(a => a.type === 'fragment' || a.type === 'moral')
    .map(a => (a.content as RandomText).id);
  
  const text = await fetchRandomText(excludeIds);
  if (text) {
    const textType = getApparitionTypeFromTextType(text.typeTexte);
    addApparition(textType === 'haiku' ? 'fragment' : textType, text);
  }
}, [fetchRandomText, addApparition, apparitions]);
```

---

### Résumé des modifications

| Fichier | Modification |
|---------|--------------|
| `useRandomExplorationData.ts` | Ajouter `excludeIds` optionnel à toutes les fonctions fetch |
| `DordoniaChoirView.tsx` | Vérifier les doublons dans `addApparition` + passer `excludeIds` aux fetchers |

### Approche recommandée

Je propose la **combinaison des niveaux 2 et 3** :
- Niveau 2 comme sécurité (si le fetch échoue à exclure)
- Niveau 3 pour une sélection plus intelligente (éviter de tirer au sort dans un pool contenant des doublons potentiels)

### Comportement attendu

1. L'utilisateur invoque un fragment
2. Le système récupère les IDs des fragments déjà visibles : `["abc123"]`
3. `fetchRandomText(["abc123"])` exclut ce texte de la sélection
4. Si par hasard le même ID est retourné, `addApparition` le bloque
5. Plus de doublons visuels possibles
