
# Plan : Afficher les vraies Parties dans l'aperçu EPUB

## Problème Identifié

Dans l'onglet **"Partie"** de l'aperçu EPUB, les valeurs sont codées en dur :
- **"I"** au lieu du vrai numéro romain (ex: "I", "II", "III")
- **"MOUVEMENT PREMIER"** au lieu du vrai titre (ex: "LE CONTRE-COURANT")
- **"La descente vers l'embouchure"** au lieu du vrai sous-titre (ex: "L'Observation")

Or, les textes contiennent déjà les métadonnées correctes (`partie_numero_romain`, `partie_titre`, `partie_sous_titre`) — il suffit de les extraire et de les afficher.

## Solution

Modifier le composant `EpubPreview.tsx` pour :

1. **Extraire les parties uniques** depuis les textes filtrés
2. **Afficher la première partie trouvée** dans l'aperçu (ou permettre de naviguer entre les parties)
3. **Afficher un placeholder** uniquement si aucune partie n'est assignée

## Détail de l'Implémentation

### Fichier à modifier

`src/components/admin/EpubPreview.tsx`

### Logique à ajouter

Ajouter un `useMemo` pour extraire les parties uniques depuis les textes :

```text
const uniqueParties = useMemo(() => {
  const partiesMap = new Map();
  
  textes.forEach(texte => {
    if (texte.partie_id && texte.partie_numero_romain && texte.partie_titre) {
      if (!partiesMap.has(texte.partie_id)) {
        partiesMap.set(texte.partie_id, {
          numeroRomain: texte.partie_numero_romain,
          titre: texte.partie_titre,
          sousTitre: texte.partie_sous_titre,
          ordre: texte.partie_ordre ?? 999
        });
      }
    }
  });
  
  // Trier par ordre et retourner un tableau
  return Array.from(partiesMap.values())
    .sort((a, b) => a.ordre - b.ordre);
}, [textes]);

// Partie à afficher dans l'aperçu (la première trouvée)
const previewPartie = uniqueParties[0] || null;
```

### Modification de l'UI (lignes 106-137)

Remplacer les valeurs statiques par les données dynamiques :

```text
Avant :
  I                           → valeur fixe
  MOUVEMENT PREMIER           → valeur fixe
  La descente vers l'embouchure → valeur fixe

Après :
  {previewPartie?.numeroRomain || 'I'}
  {previewPartie?.titre || 'PARTIE'}
  {previewPartie?.sousTitre || ''}
```

### Amélioration UX (bonus)

- **Navigation entre parties** : Ajouter des boutons ◀ ▶ pour prévisualiser chaque partie si plusieurs existent
- **Indicateur de nombre** : Afficher "1/3" si 3 parties sont présentes
- **Fallback élégant** : Si aucune partie n'est assignée aux textes, afficher un message "Aucune partie assignée" avec un style discret

### Résultat attendu

| Avant | Après |
|-------|-------|
| I | I |
| MOUVEMENT PREMIER | LE CONTRE-COURANT |
| La descente vers l'embouchure | L'Observation |

Avec les filtres actuels (49 textes, exploration Dordogne), l'aperçu affichera les vraies parties :
- **I. LE CONTRE-COURANT** — L'Observation
- **II. L'HÉSITATION DU MODÈLE** — La Friction
- **III. LE DROIT AU SILENCE** — Le Nouveau Pacte

## Schéma de l'aperçu amélioré

```text
┌─────────────────────────────────────────┐
│  Couverture | [Partie] | Texte | Visuel │
├─────────────────────────────────────────┤
│                                         │
│               ◀  I  ▶                   │
│                                         │
│        LE CONTRE-COURANT                │
│                                         │
│           L'Observation                 │
│                                         │
│         ───────────────────             │
│                                         │
│              [1/3 parties]              │
│                                         │
└─────────────────────────────────────────┘
```

## Section Technique

### Modifications précises

| Fichier | Modification |
|---------|--------------|
| `src/components/admin/EpubPreview.tsx` | Ajout du `useMemo` pour extraire les parties + remplacement des valeurs hardcodées lignes 116, 122, 128 |

### État ajouté (optionnel pour navigation)

```typescript
const [currentPartieIndex, setCurrentPartieIndex] = useState(0);
const previewPartie = uniqueParties[currentPartieIndex] || null;
```

### Aucune dépendance nouvelle

Le code utilise uniquement les données déjà présentes dans `textes: TexteExport[]`.

## Validation

1. Aller sur `/admin/exportations`
2. Sélectionner l'exploration Dordogne
3. Cliquer sur l'onglet **"Partie"** dans l'aperçu
4. Vérifier que "LE CONTRE-COURANT" s'affiche (et non "MOUVEMENT PREMIER")
5. Naviguer entre les parties avec les boutons ◀ ▶
