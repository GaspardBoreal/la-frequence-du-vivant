

## Correctif : Transmission de l'ID d'exploration pour activer la lecture en ligne

### Problème identifié

Le bouton **"Lire en ligne"** ne s'affiche pas car la condition `exportData?.exploration_id != null` retourne `false` - le champ `exploration_id` est `null` en base de données pour toutes les publications.

### Cause racine

1. **Props manquante** : L'interface `EpubExportPanelProps` ne contient pas de prop `explorationId`
2. **Appel incomplet** : La fonction `handlePublishAndShare` n'inclut pas `explorationId` dans l'appel à `publishExport`
3. **Parent non configuré** : `ExportationsAdmin.tsx` ne transmet pas l'ID de l'exploration au panel

### Modifications à effectuer

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/admin/EpubExportPanel.tsx` | MODIFIER | Ajouter prop `explorationId` et l'inclure dans l'appel `publishExport` |
| `src/pages/ExportationsAdmin.tsx` | MODIFIER | Transmettre l'ID de l'exploration sélectionnée au panel |

---

### Détails techniques

#### 1. Modification de `EpubExportPanel.tsx`

**Interface des props** (lignes 61-66) :
```typescript
interface EpubExportPanelProps {
  textes: TexteExport[];
  explorationCoverUrl?: string;
  explorationName?: string;
  explorationId?: string;  // ← AJOUTER
  onRefresh?: () => void;
}
```

**Destructuration des props** (ligne 68-73) :
```typescript
const EpubExportPanel: React.FC<EpubExportPanelProps> = ({
  textes,
  explorationCoverUrl,
  explorationName,
  explorationId,  // ← AJOUTER
  onRefresh,
}) => {
```

**Appel à `publishExport`** (lignes 177-186) :
```typescript
const published = await publishExport({
  blob,
  title: options.title,
  subtitle: options.subtitle,
  description: options.description,
  author: options.author,
  coverUrl: options.coverImageUrl,
  artisticDirection: options.format,
  fileType: 'epub',
  explorationId,  // ← AJOUTER
});
```

#### 2. Modification de `ExportationsAdmin.tsx`

**Rendu du panel** (lignes 1507-1512) :
```typescript
<EpubExportPanel
  textes={filteredTextes}
  explorationCoverUrl={selectedExplorations.size === 1 
    ? explorations.find(e => selectedExplorations.has(e.id))?.cover_url 
    : undefined}
  explorationName={explorations.find(e => selectedExplorations.has(e.id))?.name}
  explorationId={selectedExplorations.size === 1 
    ? Array.from(selectedExplorations)[0] 
    : undefined}  // ← AJOUTER : passer l'ID si une seule exploration sélectionnée
  onRefresh={() => loadData(true)}
/>
```

---

### Comportement attendu après correction

1. **Une exploration sélectionnée** → `explorationId` est transmis → La publication enregistre l'ID → Le bouton "Lire en ligne" s'affiche
2. **Plusieurs explorations** → `explorationId` reste `undefined` → Seul le téléchargement est disponible (comportement cohérent car le viewer a besoin d'une exploration unique)

---

### Mise à jour des publications existantes (optionnel)

Pour corriger les publications déjà existantes, une requête SQL peut mettre à jour `exploration_id` :

```sql
UPDATE published_exports 
SET exploration_id = (SELECT id FROM explorations WHERE name ILIKE '%Dordogne%' LIMIT 1)
WHERE exploration_id IS NULL;
```

---

### Vérification

1. Aller sur `/admin/exportations`
2. Sélectionner **une seule exploration** (ex: "Fréquences de la rivière Dordogne")
3. Cliquer "Publier & Partager"
4. Ouvrir le lien public généré
5. Vérifier que le bouton **"Lire en ligne"** s'affiche maintenant
6. Cliquer dessus pour vérifier l'ouverture du Livre Vivant

