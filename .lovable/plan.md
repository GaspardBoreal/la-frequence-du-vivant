

## Plan de résolution : Export Word - Ordre et types manquants

### Diagnostic confirmé

Deux problèmes distincts affectent l'export "Par marche / lieu" :

| Problème | Cause | Impact |
|----------|-------|--------|
| "Constitution de Dordonia" manquant | Le type `manifeste` n'est pas dans `TEXT_TYPE_LABELS` | Le texte est exporté sans label correct dans l'index |
| Ordre incorrect | La requête SQL trie par `created_at` au lieu de `ordre` | L'ordre narratif défini dans l'admin est ignoré |

### Modifications requises

#### 1. Ajouter les types littéraires manquants

**Fichier** : `src/utils/wordExportUtils.ts`

Mettre à jour `TEXT_TYPE_LABELS` (lignes 297-306) pour inclure tous les types de `src/types/textTypes.ts` :

```typescript
const TEXT_TYPE_LABELS: Record<string, string> = {
  haiku: 'Haïkus',
  senryu: 'Senryūs',
  haibun: 'Haïbuns',
  poeme: 'Poèmes',
  'texte-libre': 'Textes libres',
  'essai-bref': 'Essais brefs',
  'dialogue-polyphonique': 'Dialogues polyphoniques',
  fable: 'Fables',
  fragment: 'Fragments',
  'carte-poetique': 'Cartes poétiques',
  prose: 'Proses',
  carnet: 'Carnets de terrain',
  correspondance: 'Correspondances',
  manifeste: 'Manifestes',           // ← AJOUT
  glossaire: 'Glossaires poétiques',
  protocole: 'Protocoles hybrides',
  synthese: 'Synthèses IA-Humain',
  'recit-donnees': 'Récits-données',
  recit: 'Récits',
};
```

Mettre à jour les 3 occurrences de `typeOrder` (lignes 668, 1099) pour inclure tous les types dans l'ordre éditorial souhaité.

#### 2. Récupérer et utiliser le champ `ordre`

**Fichier** : `src/pages/ExportationsAdmin.tsx`

Modifier la requête SQL (lignes 176-186) :

```typescript
const { data: textesData } = await supabase
  .from('marche_textes')
  .select(`
    id,
    titre,
    contenu,
    type_texte,
    marche_id,
    ordre,           // ← AJOUT
    created_at
  `)
  .order('ordre', { ascending: true });  // ← Tri par ordre
```

#### 3. Ajouter le champ `ordre` à l'interface

**Fichier** : `src/utils/wordExportUtils.ts`

Modifier l'interface `TexteExport` (lignes 15-25) :

```typescript
interface TexteExport {
  id: string;
  titre: string;
  contenu: string;
  type_texte: string;
  marche_nom?: string;
  marche_ville?: string;
  marche_region?: string;
  marche_date?: string;
  ordre?: number;       // ← AJOUT
  created_at?: string;
}
```

#### 4. Respecter l'ordre dans le groupement par marche

**Fichier** : `src/utils/wordExportUtils.ts`

Dans la fonction `groupTextesByMarcheWithDate` (ligne 600-626), trier les textes par `ordre` après le groupement :

```typescript
const groupTextesByMarcheWithDate = (textes: TexteExport[]): Map<string, MarcheGroupWithDate> => {
  const groupsWithDate = new Map<string, MarcheGroupWithDate>();
  
  textes.forEach(texte => {
    const key = texte.marche_nom || texte.marche_ville || 'Sans lieu';
    if (!groupsWithDate.has(key)) {
      groupsWithDate.set(key, { date: texte.marche_date || null, textes: [] });
    }
    groupsWithDate.get(key)!.textes.push(texte);
  });

  // Trier les textes par ordre à l'intérieur de chaque groupe
  groupsWithDate.forEach(group => {
    group.textes.sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999));
  });

  // Sort groups by date chronologically
  const sortedEntries = Array.from(groupsWithDate.entries())
    .sort((a, b) => {
      const dateA = a[1].date || '9999-12-31';
      const dateB = b[1].date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  // Rebuild sorted Map
  const sortedMap = new Map<string, MarcheGroupWithDate>();
  sortedEntries.forEach(([key, value]) => {
    sortedMap.set(key, value);
  });

  return sortedMap;
};
```

#### 5. Adapter l'index "Par Lieu" pour respecter l'ordre

Dans `createIndexByMarche` (lignes 648-741), supprimer le regroupement par type qui casse l'ordre et afficher les textes dans leur ordre naturel avec le type en italique :

```typescript
// Remplacer le groupement par type par un simple affichage dans l'ordre
for (const texte of groupTextes) {
  const bookmarkId = generateBookmarkId(texte);
  const shortTitle = texte.titre.length > 50 
    ? texte.titre.substring(0, 47) + '...' 
    : texte.titre;
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${shortTitle} `,
          size: 22,
        }),
        new TextRun({
          text: `(${getTypeLabel(texte.type_texte)}) `,
          italics: true,
          size: 20,
          color: '888888',
        }),
        new TextRun({
          text: '— p. ',
          size: 20,
          color: '888888',
        }),
        createPageRef(bookmarkId),
      ],
      indent: { left: 400 },
      spacing: { after: 60 },
    })
  );
}
```

### Résumé des fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `src/pages/ExportationsAdmin.tsx` | Ajouter `ordre` à la requête SQL, trier par `ordre ASC` |
| `src/utils/wordExportUtils.ts` | Ajouter `ordre` à l'interface, compléter `TEXT_TYPE_LABELS`, trier les textes par `ordre` dans le groupement |

### Résultat attendu

Après ces modifications, l'export "Par marche / lieu" pour "La mue du dragon" affichera :

1. Haïku Brut (Haïkus)
2. L'algorithme du serpent (Textes libres)
3. Constitution de Dordonia (Manifestes)
4. Épilogue — Le Parlement de l'Estuaire (Textes libres)

