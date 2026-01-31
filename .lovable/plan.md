
# Plan de Correction — Résoudre définitivement le crash "unsupported number"

## Objectif
Permettre l'export PDF de tous les textes, y compris les très longs (Constitution de Dordonia : ~12 000 caractères, Épilogue : ~8 000 caractères), en les répartissant automatiquement sur plusieurs pages.

---

## Diagnostic Final

Le crash `unsupported number: -1.3e+21` est causé par un texte très long (~12 000 caractères) injecté dans un seul élément `<Text>` à l'intérieur d'une `<Page>`. Le moteur Yoga ne peut pas calculer de coordonnées valides pour un bloc plus grand qu'une page.

| Texte problématique | Longueur | Type |
|---|---|---|
| Constitution de Dordonia | ~12 000 caractères | manifeste |
| Épilogue — Le Parlement de l'Estuaire | ~8 000 caractères | texte-libre |
| Entre Dor et Dogne : naissance d'un nom | ~4 800 caractères | texte-libre |

---

## Plan d'Action

### 1. Autoriser le wrapping naturel sur les pages de texte standard

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Problème actuel** : La structure `TextePage` encapsule le contenu dans des `<View>` rigides. Si le texte est très long, il ne peut pas s'écouler sur plusieurs pages.

**Solution** :
- S'assurer que `<Page wrap>` est activé (déjà le cas par défaut).
- Retirer tout `wrap={false}` implicite ou explicite sur le conteneur de texte.
- Vérifier que `styles.texteContent` et `styles.texteContainer` n'ont pas de contraintes bloquantes.

### 2. Segmenter les textes très longs en paragraphes distincts

**Fichier** : `src/utils/pdfPageComponents.tsx` (composant `TextePage`)

**Problème actuel** : Le contenu est rendu en un seul `<Text>` massif :
```tsx
<Text style={styles.texteContent as Style}>{content}</Text>
```

**Solution** : Découper le contenu par retours à la ligne et rendre chaque paragraphe dans un `<Text>` séparé. Cela permet à Yoga de calculer chaque bloc indépendamment et de le placer correctement page par page.

```tsx
// Découper le contenu en paragraphes
const paragraphs = content.split(/\n{2,}/).filter(Boolean);

// Rendre chaque paragraphe séparément
{paragraphs.map((para, idx) => (
  <Text key={idx} style={styles.texteContent as Style}>
    {para}
  </Text>
))}
```

### 3. Protéger le titre + premier paragraphe contre les orphelins

**Fichier** : `src/utils/pdfPageComponents.tsx` (composant `TextePage`)

Pour éviter que le titre se retrouve seul en bas de page, garder le titre et le premier paragraphe ensemble dans un bloc `wrap={false}`, puis laisser les paragraphes suivants couler librement.

```tsx
<View style={styles.texteContainer as Style}>
  {/* Garder titre + 1er paragraphe ensemble */}
  <View wrap={false}>
    <Text style={styles.texteTitle as Style}>{texte.titre}</Text>
    {paragraphs[0] && (
      <Text style={styles.texteContent as Style}>{paragraphs[0]}</Text>
    )}
  </View>
  
  {/* Le reste des paragraphes peut couler sur plusieurs pages */}
  {paragraphs.slice(1).map((para, idx) => (
    <Text key={idx} style={styles.texteContent as Style}>
      {para}
    </Text>
  ))}
  
  {/* Métadonnées optionnelles */}
  {options.includeMetadata && texte.type_texte && (
    <Text style={styles.texteMetadata as Style}>
      {texte.type_texte}
      {texte.marche_ville && ` · ${texte.marche_ville}`}
    </Text>
  )}
</View>
```

### 4. Appliquer la même logique aux Fables longues

**Fichier** : `src/utils/pdfPageComponents.tsx` (composant `FablePage`)

Les fables peuvent aussi être volumineuses (~3 900 caractères pour "La Grand-duc et l'Éolienne"). Appliquer la même stratégie de découpage par paragraphes.

### 5. Ajouter un style `texteContent` avec `flexShrink: 1`

**Fichier** : `src/utils/pdfStyleGenerator.ts`

Pour protéger contre les débordements horizontaux imprévus.

```tsx
texteContent: {
  // ... existing styles ...
  flexShrink: 1,
},
```

---

## Section Technique

### Pourquoi le crash se produit

1. Un texte de ~12 000 caractères est injecté dans un seul `<Text>`.
2. Ce bloc dépasse largement la hauteur d'une page A5 (~595 points disponibles après marges).
3. Le moteur Yoga tente de placer ce bloc "en entier" quelque part.
4. Les calculs de coordonnées produisent des valeurs invalides (ex: `-1.3e+21`).
5. La fonction `translate()` de pdfkit reçoit ce nombre et lève l'exception.

### Pourquoi la segmentation en paragraphes résout le problème

- Chaque `<Text>` devient un bloc indépendant de taille raisonnable.
- Yoga peut placer chaque paragraphe sur la page courante ou le pousser à la suivante.
- Aucun bloc individuel ne dépasse la hauteur de page.

---

## Fichiers à Modifier

| Fichier | Modifications |
|---|---|
| `src/utils/pdfPageComponents.tsx` | Refactorer `TextePage` et `FablePage` pour découper le contenu en paragraphes ; protéger titre + 1er paragraphe ensemble |
| `src/utils/pdfStyleGenerator.ts` | Ajouter `flexShrink: 1` à `texteContent` |

---

## Résultat Attendu

- Zéro crash "unsupported number"
- Les textes longs (manifestes, épilogues) se répartissent proprement sur plusieurs pages
- Le titre reste collé au premier paragraphe (pas d'orphelins)
- La pagination dynamique fonctionne jusqu'à la fin du document

---

## Critères de Validation

1. L'export PDF se génère sans erreur
2. Le texte "Constitution de Dordonia" (~12 000 caractères) s'affiche sur plusieurs pages
3. La numérotation monte jusqu'à la dernière page attendue
4. Aucune régression visuelle sur les haïkus/senryūs (qui restent courts et sur une page)
