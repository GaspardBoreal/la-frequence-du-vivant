

## Correctif : Afficher le viewer Livre Vivant pour les lecteurs publics

### Probleme identifie

Le bouton "Lire en ligne" redirige actuellement vers `/explorations/:slug/lire` qui affiche l'interface **ExperienceLectureOptimisee** (lecture lineaire Galerie Fleuve) au lieu du viewer **LivreVivantViewer** (simulation eBook avec navigation, Traversees, toggle Mobile/Tablet/Desktop).

### Difference entre les deux interfaces

| Caracteristique | ExperienceLectureOptimisee (actuel) | LivreVivantViewer (attendu) |
|-----------------|-------------------------------------|----------------------------|
| Navigation | Texte par texte, fleches | Pages, Sommaire, Index, Traversees |
| Simulation device | Non | Oui (Desktop/Tablet/Mobile) |
| Direction artistique | Theme Galerie Fleuve fixe | Respecte la direction de publication |
| Header | "Gaspard Boreal" + pagination | "LIVRE VIVANT" + toggle devices |
| Experience | Lecture continue | Simulation liseuse eBook |

### Solution

Creer une page publique dedicee qui encapsule le viewer LivreVivantViewer sans le wrapper Dialog, avec recuperation des donnees depuis la publication.

---

### Architecture technique

```text
/epub/:slug         →  PublicEpubDownload.tsx  (page d'accueil)
                           │
                           ├── Bouton "Telecharger" → download .epub
                           │
                           └── Bouton "Lire en ligne" → /epub/:slug/lire
                                                              │
                                                              ▼
/epub/:slug/lire   →  PublicLivreVivant.tsx (NOUVEAU)
                           │
                           ├── Recupere published_export (direction artistique)
                           ├── Recupere textes via exploration_id
                           ├── Construit EpubExportOptions
                           │
                           └── Affiche PublicLivreVivantViewer (plein ecran)
                                   │
                                   └── Reutilise hooks + renderers existants
                                       (useBookPages, useBookNavigation, 
                                        CoverRenderer, TexteRenderer, etc.)
```

---

### Fichiers a creer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/PublicLivreVivant.tsx` | REMPLACER | Charger les donnees et afficher le viewer public |
| `src/components/public/PublicLivreVivantViewer.tsx` | CREER | Version page plein ecran du LivreVivantViewer |
| `src/pages/PublicEpubRead.tsx` | SUPPRIMER | N'est plus necessaire (redirection remplacee) |

---

### Details techniques

#### 1. `PublicLivreVivant.tsx` - Chargeur de donnees

Cette page :
1. Recupere le `slug` depuis l'URL
2. Charge la publication (`published_exports`) pour obtenir :
   - `exploration_id`
   - `artistic_direction`
   - `title`, `subtitle`, `author`, etc.
3. Charge les textes de l'exploration via `exploration_id`
4. Construit les `EpubExportOptions` avec la direction artistique
5. Affiche le viewer public

```text
useEffect:
  1. SELECT * FROM published_exports WHERE slug = :slug
  2. Si exploration_id → SELECT textes via jointures
  3. Construire colorScheme + typography selon artistic_direction
  4. Passer au PublicLivreVivantViewer
```

#### 2. `PublicLivreVivantViewer.tsx` - Viewer public

Adaptation du `LivreVivantViewer` admin :
- **Sans Dialog** : rendu plein ecran direct (`fixed inset-0`)
- **Bouton retour** : lien vers `/epub/:slug` au lieu de `onClose()`
- **Memes hooks** : `useBookPages`, `useBookNavigation`
- **Memes renderers** : `CoverRenderer`, `TexteRenderer`, `TocRenderer`, etc.
- **Traversees** : overlay anime integre

Structure du composant :

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                     │
│   ← Retour    Titre    [Desktop][Tablet][Mobile]                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                     ┌─────────────────────────┐                            │
│                     │                         │                            │
│                     │    Contenu de page      │  ← Simulation device      │
│                     │    (renderers)          │                            │
│                     │                         │                            │
│                     └─────────────────────────┘                            │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ Navigation                                                                 │
│   Accueil | Sommaire | Lieux | Genres | Traversees                        │
│   ████████████░░░░░░░░░  25%                                               │
│   |◀  ◀   14 / 56   ▶  ▶|                                                 │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 3. Recuperation de la direction artistique

Les options sont construites a partir de la colonne `artistic_direction` :

```text
const ARTISTIC_PRESETS = {
  galerie_fleuve: {
    colorScheme: { 
      primary: '#1a1a1a', 
      secondary: '#666666', 
      accent: '#10B981', 
      background: '#ffffff' 
    },
    typography: { 
      headingFont: 'Playfair Display', 
      bodyFont: 'Georgia' 
    }
  },
  frequence_vivant: {
    colorScheme: { 
      primary: '#0a0a0a', 
      secondary: '#4a5568', 
      accent: '#22c55e', 
      background: '#0f1419' 
    },
    typography: { 
      headingFont: 'Inter', 
      bodyFont: 'Georgia' 
    }
  },
  dordonia: {
    colorScheme: { 
      primary: '#1e293b', 
      secondary: '#64748b', 
      accent: '#0ea5e9', 
      background: '#f8fafc' 
    },
    typography: { 
      headingFont: 'Merriweather', 
      bodyFont: 'Source Serif Pro' 
    }
  }
};
```

---

### Mise a jour du Router

```text
// App.tsx - Modifier la route existante
<Route path="/epub/:slug/lire" element={<PublicLivreVivant />} />
```

Supprimer l'import de `PublicEpubRead` et le fichier correspondant.

---

### Verification

1. Aller sur `/epub/:slug` (page publique)
2. Cliquer sur "Lire en ligne"
3. Verifier que le **Livre Vivant** s'affiche avec :
   - Le toggle Desktop/Tablet/Mobile en haut a droite
   - La navigation (Accueil, Sommaire, Lieux, Genres, Traversees) en bas
   - Les couleurs correspondant a la direction artistique de la publication
4. Naviguer entre les pages avec les fleches
5. Cliquer sur "Traversees" pour verifier l'overlay
6. Cliquer sur "Retour" pour revenir a `/epub/:slug`

