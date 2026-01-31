
# Plan de Correction Définitif — Crash PDF "unsupported number"

## Diagnostic Technique Approfondi

### Cause Racine Identifiée

Le crash `unsupported number: -1.3e+21` est causé par des blocs de texte trop volumineux qui dépassent les capacités du moteur Yoga de @react-pdf/renderer. L'analyse du contenu HTML révèle plusieurs problèmes cumulatifs :

| Problème | Impact |
|----------|--------|
| `sanitizeContentForPdf` ne gère pas `<h1>`, `<h2>`, `<ul>`, `<li>` | Ces balises ne génèrent pas de saut de ligne, produisant des blocs > 3000 caractères sans coupure |
| `splitIntoParagraphs` ne découpe pas les lignes très longues | Une "ligne" de 5000+ caractères reste intacte |
| `limitFirstParagraph` limite à 800 chars mais les paragraphes restants peuvent être massifs | Les `<Text>` suivants peuvent dépasser la hauteur de page |
| `wrap={false}` sur certains blocs | Même un paragraphe "normal" de 1500+ caractères dans un bloc unbreakable cause un crash |

### Données Concrètes

| Texte | Longueur | Structure HTML |
|-------|----------|----------------|
| Constitution de Dordonia | 21 638 car. | `<h1>`, `<h2>`, `<ul><li>`, `<p>` imbriqués |
| Épilogue — Le Parlement | 10 377 car. | `<div>` multiples |
| La Grand-duc et l'Éolienne | 5 476 car. | `<div>` multiples |

---

## Plan de Correction (3 Axes)

### Axe 1 : Améliorer sanitizeContentForPdf pour gérer TOUS les blocs HTML

**Fichier** : `src/utils/pdfExportUtils.ts`

**Modification** : Ajouter le traitement des balises `<h1>-<h6>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<pre>` pour insérer des sauts de ligne.

```typescript
// Ajouter saut de ligne AVANT les headings et listes
text = text.replace(/<(h[1-6]|ul|ol|li|blockquote|pre)\b[^>]*>/gi, '\n');

// Ajouter saut de ligne APRÈS les headings fermants (double saut pour sections)
text = text.replace(/<\/(h[1-6])>/gi, '\n\n');
text = text.replace(/<\/(ul|ol|li|blockquote|pre)>/gi, '\n');
```

### Axe 2 : Forcer le découpage agressif des blocs longs dans splitIntoParagraphs

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Modification** : Implémenter un découpage forcé (chunk) pour tout paragraphe > 1500 caractères :

```typescript
const MAX_PARAGRAPH_LENGTH = 1500; // ~1 page A5 max

const splitIntoParagraphs = (content: string): string[] => {
  // Étape 1 : Découper sur sauts de ligne
  const lines = content.split(/\n/).map(l => l.trim()).filter(Boolean);
  
  // Étape 2 : Pour les poèmes courts, garder ensemble
  if (lines.length <= 5 && content.length < 500) {
    return [lines.join('\n')];
  }
  
  // Étape 3 : Découpage intelligent avec chunking forcé
  const paragraphs: string[] = [];
  let currentGroup: string[] = [];
  let currentLength = 0;
  
  for (const line of lines) {
    // Si une seule ligne dépasse MAX, la découper elle-même
    if (line.length > MAX_PARAGRAPH_LENGTH) {
      // Flush current group
      if (currentGroup.length > 0) {
        paragraphs.push(currentGroup.join('\n'));
        currentGroup = [];
        currentLength = 0;
      }
      // Chunk la ligne longue par phrases ou mots
      paragraphs.push(...chunkLongText(line, MAX_PARAGRAPH_LENGTH));
    } else {
      // Ajouter au groupe si ça ne dépasse pas
      if (currentLength + line.length > MAX_PARAGRAPH_LENGTH) {
        paragraphs.push(currentGroup.join('\n'));
        currentGroup = [line];
        currentLength = line.length;
      } else {
        currentGroup.push(line);
        currentLength += line.length + 1;
      }
    }
  }
  
  if (currentGroup.length > 0) {
    paragraphs.push(currentGroup.join('\n'));
  }
  
  return paragraphs.length > 0 ? paragraphs : [content];
};

// Nouvelle fonction helper pour découper un texte très long
const chunkLongText = (text: string, maxLen: number): string[] => {
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > maxLen) {
    // Chercher un point de coupure naturel (., !, ?, puis espace)
    let cutPoint = remaining.slice(0, maxLen).lastIndexOf('. ');
    if (cutPoint < maxLen * 0.3) cutPoint = remaining.slice(0, maxLen).lastIndexOf('! ');
    if (cutPoint < maxLen * 0.3) cutPoint = remaining.slice(0, maxLen).lastIndexOf('? ');
    if (cutPoint < maxLen * 0.3) cutPoint = remaining.slice(0, maxLen).lastIndexOf(' ');
    if (cutPoint < maxLen * 0.3) cutPoint = maxLen; // Forcer la coupure
    
    chunks.push(remaining.slice(0, cutPoint + 1).trim());
    remaining = remaining.slice(cutPoint + 1).trim();
  }
  
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
};
```

### Axe 3 : Supprimer `wrap={false}` des blocs pouvant contenir du contenu long

**Fichier** : `src/utils/pdfPageComponents.tsx`

**Modifications** :

1. **TextePage (ligne 563)** : Retirer `wrap={false}` du bloc titre+premier paragraphe car même 800 caractères peuvent dépasser avec le titre sur certaines polices/tailles.

2. **FablePage (ligne 455)** : Même chose pour le header de fable.

3. **Alternative** : Utiliser `minPresenceAhead={100}` (react-pdf v3+) sur le titre seul pour éviter les orphelins sans bloquer le wrapping.

**Nouvelle logique sécurisée** :

```tsx
// TextePage - Version sécurisée sans wrap={false}
<View style={styles.texteContainer as Style}>
  <Text style={styles.texteTitle as Style}>{texte.titre}</Text>
  
  {/* Tous les paragraphes peuvent wrapper naturellement */}
  {paragraphs.map((para, idx) => (
    <Text key={idx} style={styles.texteContent as Style}>{para}</Text>
  ))}
  
  {options.includeMetadata && texte.type_texte && (
    <Text style={styles.texteMetadata as Style}>
      {texte.type_texte}
      {texte.marche_ville && ` · ${texte.marche_ville}`}
    </Text>
  )}
</View>
```

---

## Section Technique

### Pourquoi le crash se produit exactement

1. Le manifeste HTML contient : `<h1>MÉTADONNÉES</h1><ul><li><p>Opus : ...</p></li></ul>`
2. `sanitizeContentForPdf` ne gère pas `<h1>`, `<ul>`, `<li>` → tout est collé sur quelques "lignes"
3. Une "ligne" peut ainsi contenir 5000+ caractères
4. `splitIntoParagraphs` groupe ces lignes car elles font < 120 caractères individuellement (après `split(\n)`)
5. Le résultat : un "paragraphe" de 8000+ caractères
6. Ce paragraphe va dans un `<Text>` unique
7. Yoga calcule des coordonnées astronomiques → crash

### Calcul de sécurité

- Page A5 : 148×210mm = ~419×595 points
- Marges : ~80pt en haut, ~60pt en bas = ~455pt de hauteur utile
- Police 10pt, interligne 1.4 = ~14pt par ligne
- Lignes par page : 455 / 14 ≈ 32 lignes
- Caractères par ligne : ~55-65
- **Caractères par page : 32 × 60 = ~1920 caractères**

Donc `MAX_PARAGRAPH_LENGTH = 1500` est sécuritaire (avec marge).

---

## Fichiers à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/utils/pdfExportUtils.ts` | Ajouter traitement des balises `<h1-h6>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>` dans `sanitizeContentForPdf` |
| `src/utils/pdfPageComponents.tsx` | Refactorer `splitIntoParagraphs` avec chunking forcé à 1500 caractères max ; ajouter helper `chunkLongText` ; supprimer `wrap={false}` des conteneurs de texte |

---

## Résultat Attendu

- Zéro crash "unsupported number" quelle que soit la longueur du texte
- Le manifeste "Constitution de Dordonia" (21 638 caractères) se divise en ~15 paragraphes de ~1400 caractères chacun, répartis sur ~12 pages
- L'Épilogue (10 377 caractères) se répartit sur ~6 pages
- Les haïkus/senryūs courts (< 500 caractères) restent sur une seule page sans sur-découpage
- La numérotation TOC/Index reste cohérente grâce à `estimatePages()`

---

## Critères de Validation

1. Export PDF se génère sans erreur console
2. Tous les textes, y compris les très longs, apparaissent dans le PDF
3. Les textes longs s'étalent naturellement sur plusieurs pages
4. Les titres ne sont jamais orphelins (seuls en bas de page)
5. Les haïkus restent visuellement corrects (pas de découpage artificiel)
