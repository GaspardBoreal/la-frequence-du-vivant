

# Plan : Aperçu EPUB complet et exhaustif en temps réel

## Problème Identifié

L'aperçu EPUB actuel (`EpubPreview.tsx`) présente plusieurs limitations majeures :

| Élément | État Actuel | Ce qui manque |
|---------|-------------|---------------|
| **Textes** | Affiche 1-2 textes échantillons | Pas de vue complète des 49 textes |
| **Structure** | Onglets séparés (Partie/Texte) | Pas de vue hiérarchique Partie > Marche > Texte |
| **Table des matières** | Non prévisualisée | Option `includeTableOfContents` non reflétée |
| **Index (lieux + genres)** | Non prévisualisé | Option `includeIndexes` non reflétée |
| **Options cochées** | Non visibles | Pas de feedback visuel des options actives |

## Solution Proposée

Transformer l'aperçu en un **véritable "Aperçu du document"** (WYSIWYG), similaire à celui du Word mais adapté au format EPUB, avec :

1. **Vue hiérarchique complète** : Partie > Marche > Texte (collapsibles imbriqués)
2. **Prévisualisation de la Table des Matières** si activée
3. **Prévisualisation des Index** (par lieu et par genre) si activés
4. **Indicateurs visuels des options actives**

## Nouvelle Architecture de l'Aperçu

```text
┌─────────────────────────────────────────────────────────────────┐
│  Aperçu du document EPUB                                        │
├─────────────────────────────────────────────────────────────────┤
│  [Couverture] [Structure] [Index] [Style]  ← Onglets améliorés  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ONGLET "STRUCTURE" (nouveau) :                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▼ I. LE CONTRE-COURANT                      [15 textes]  │  │
│  │   ├─ ▶ Bergerac (15 mars 2024)              [4 textes]   │  │
│  │   ├─ ▶ Libourne (22 mars 2024)              [3 textes]   │  │
│  │   └─ ▶ Sainte-Foy-la-Grande                 [2 textes]   │  │
│  │                                                           │  │
│  │ ▶ II. L'HÉSITATION DU MODÈLE                [18 textes]  │  │
│  │ ▶ III. LE DROIT AU SILENCE                  [16 textes]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ONGLET "INDEX" (nouveau, si option activée) :                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Index par Lieu           │ Index par Genre                │  │
│  │ ─────────────────────    │ ────────────────────           │  │
│  │ • Bergerac               │ • Haïkus (12)                  │  │
│  │   → Haïkus, Fables       │   Bergerac, Libourne...        │  │
│  │ • Libourne               │ • Fables (8)                   │  │
│  │   → Poèmes, Haïkus       │   Argentat, Beaulieu...        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  OPTIONS ACTIVES : [✓ TdM] [✓ Parties] [✓ Index] [✓ Illus.]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Détails de l'Implémentation

### 1. Nouveau composant `EpubDocumentPreview.tsx`

Créer un composant dédié pour la vue hiérarchique (inspiré de `WordExportPreview.tsx`) :

- **Groupement des textes** : Utiliser la même logique que `groupTextesByPartie()` de `epubExportUtils.ts`
- **Collapsibles imbriqués** : Parties → Marches → Textes (avec compteurs)
- **État expandé/collapsé** : Toutes les parties collapsées par défaut, premier niveau accessible

### 2. Nouveaux onglets dans `EpubPreview.tsx`

Passer de 4 à 5-6 onglets :

| Onglet | Icône | Contenu |
|--------|-------|---------|
| Couverture | Book | Titre, auteur, image (existant) |
| Partie | Layout | Aperçu d'une page de partie (existant, amélioré) |
| **Structure** | List | **Vue hiérarchique complète (NOUVEAU)** |
| **Index** | BookOpen | **Aperçu TdM + Index lieux/genres (NOUVEAU)** |
| Texte | FileText | Échantillon de texte stylisé (existant) |
| Visuel | Image | Illustration + QR (existant) |

### 3. Prévisualisation conditionnelle des Index

Dans l'onglet "Index", afficher dynamiquement selon les options :

```text
Si options.includeTableOfContents :
  → Afficher une Table des Matières générée à partir des textes

Si options.includeIndexes :
  → Afficher l'Index par Lieu (villes → genres)
  → Afficher l'Index par Genre (genres → villes)

Si aucune option activée :
  → Afficher "Aucun index sélectionné"
```

### 4. Indicateurs visuels des options actives

Ajouter au pied de page une barre récapitulative :

```text
[✓ Couverture] [✓ TdM] [✓ Parties] [○ Index] [✓ Illustrations]
      actif      actif    actif    inactif      actif
```

### 5. Optimisations de performance

- **Virtualisation** : Pour les listes longues (> 50 textes), utiliser un affichage paginé ou virtualisé
- **Lazy loading** : Ne calculer les index que si l'onglet est ouvert
- **Mémoïsation** : Utiliser `useMemo` pour les calculs de groupement et d'index

## Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/admin/EpubPreview.tsx` | Modifier | Ajouter les nouveaux onglets Structure et Index |
| `src/components/admin/EpubDocumentTree.tsx` | **Créer** | Vue arborescente Partie > Marche > Texte |
| `src/components/admin/EpubIndexPreview.tsx` | **Créer** | Aperçu des index (TdM, lieux, genres) |

## Logique de génération des Index (pour l'aperçu)

### Index par Lieu

```text
Pour chaque ville unique dans textes :
  - Lister les genres présents (Haïkus, Fables, Poèmes...)
  - Afficher le nombre de textes par genre
```

### Index par Genre

```text
Pour chaque type de texte unique :
  - Lister les villes où ce genre apparaît
  - Suivre l'ordre : haiku, senryu, poeme, fable, manifeste...
```

## Section Technique

### Types à ajouter

```typescript
interface PartieGroup {
  id: string | null;
  numeroRomain: string;
  titre: string;
  sousTitre: string | null;
  ordre: number;
  marches: Map<string, {
    date: string | null;
    textes: TexteExport[];
    marche_ordre: number;
  }>;
}

interface IndexEntry {
  name: string;
  items: string[];
  count: number;
}
```

### Dépendances

Aucune nouvelle dépendance requise. Utilisation des composants Radix UI existants (Collapsible, Tabs, ScrollArea).

## Validation

1. Aller sur `/admin/exportations`
2. Sélectionner l'exploration Dordogne (49 textes)
3. Vérifier l'onglet **Structure** :
   - Affiche les 3 parties avec compteurs corrects
   - Chaque partie peut être déployée pour voir les marches
   - Chaque marche peut être déployée pour voir les textes
4. Vérifier l'onglet **Index** :
   - La TdM reflète la structure réelle
   - Les index par lieu/genre sont générés dynamiquement
5. Cocher/décocher les options :
   - Les indicateurs visuels changent en temps réel
   - Le contenu de l'onglet Index s'adapte

## Risques et Points d'Attention

- **Performance** : Avec 49+ textes, le rendu doit rester fluide. Utiliser des collapsibles fermés par défaut et la mémoïsation.
- **Cohérence** : La structure affichée dans l'aperçu doit strictement correspondre à celle générée dans l'EPUB final.
- **Responsive** : Le composant doit rester lisible sur tablette (le panneau fait ~50% de la largeur).

