
# Visionneuse eBook Immersive : Architecture Extensible

## Vision

Creer une visionneuse "Livre Vivant" conçue des le depart comme un **systeme a plugins** permettant d'ajouter facilement :
- De nouveaux modes de "Traversees" (Constellations, Flux Temporel...)
- De nouveaux types d'index (Index Sonore, Index Emotionnel...)
- Des liens vers des contenus externes (blogs, agents IA, reseaux sociaux)

L'architecture s'inspire du pattern **Registry** deja present dans le codebase (`marcheModels`, `TEXT_TYPES_REGISTRY`, `KEYWORD_CATEGORIES`).

---

## Architecture Modulaire Proposee

```text
+------------------------------------------------------------------+
|                    LIVRE VIVANT VIEWER                           |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+    +------------------+                    |
|  |  PAGE REGISTRY   |    | TRAVERSEE REGISTRY|                   |
|  |  (types de pages)|    | (modes exploration)|                  |
|  +------------------+    +------------------+                    |
|          |                       |                               |
|          v                       v                               |
|  +------------------+    +------------------+    +-------------+ |
|  |  INDEX REGISTRY  |    |  LINKS REGISTRY  |    |   THEMES    | |
|  | (types d'index)  |    |(liens externes)  |    |  REGISTRY   | |
|  +------------------+    +------------------+    +-------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 1. Registre des Pages (PageTypeRegistry)

Chaque type de page du livre est un module independant :

```text
PageType {
  id: 'cover' | 'toc' | 'partie' | 'texte' | 'index-lieu' | 'traversee' | ...
  label: string
  icon: LucideIcon
  renderer: React.FC<PageRendererProps>
  category: 'structure' | 'content' | 'navigation' | 'exploration'
  order: number
}
```

**Types de pages initiaux :**
- `cover` - Couverture
- `toc` - Table des matieres
- `partie` - Page de mouvement
- `texte` - Contenu litteraire
- `index-lieu` - Index par lieu
- `index-genre` - Index par genre
- `index-oeuvres` - Index alphabetique
- `traversee-seismograph` - Sismographe Poetique
- `traversee-orbites` - Index Vivant Orbital

**Extensibilite :** Ajouter un nouveau type = ajouter une entree au registre + son composant renderer.

---

## 2. Registre des Traversees (TraverseeRegistry)

Extension du `TraverseesHub` actuel vers un systeme enfichable :

```text
TraverseeMode {
  id: string
  label: string
  icon: LucideIcon
  description: string
  component: React.FC<TraverseeProps>
  category: 'visualisation' | 'index' | 'immersion'
  requiredData?: ('textes' | 'audio' | 'photos' | 'marches')[]
  badge?: 'new' | 'beta' | 'experimental'
}
```

**Modes actuels :**
- `seismograph` - Sismographe Poetique (visualisation)
- `living-index` - Index Vivant / Orbites Thematiques (index)

**Modes futurs envisages :**
- `constellation` - Constellation Textuelle (liens semantiques entre textes)
- `flux-temporel` - Timeline poetique animee
- `cartographie-sonore` - Visualisation audio des marches
- `resonances` - Connexions inter-textes par mots-cles partages

---

## 3. Registre des Index (IndexRegistry)

Generalisation des index existants :

```text
IndexType {
  id: string
  label: string
  icon: LucideIcon
  description: string
  extractor: (textes: TexteExport[]) => IndexData
  renderer: React.FC<IndexRendererProps>
  exportable: boolean  // Peut etre exporte dans l'EPUB
  interactive: boolean // Mode interactif dans la visionneuse
}
```

**Index actuels :**
- `lieu` - Par lieu (ordre narratif)
- `genre` - Par genre litteraire
- `oeuvres` - Alphabetique des titres
- `mots-cles` - 7 categories thematiques (Faune, Hydrologie, etc.)

**Index futurs envisages :**
- `emotionnel` - Classification par tonalite emotionnelle (IA)
- `sonore` - Par paysage sonore associe
- `temporel` - Par periode evoquee (2050, Holocène, etc.)
- `intertextuel` - Connexions entre textes par motifs communs

---

## 4. Registre des Liens Externes (ExternalLinksRegistry)

Nouveaute pour connecter le livre au monde :

```text
ExternalLinkType {
  id: string
  label: string
  icon: LucideIcon
  platform: 'blog' | 'social' | 'agent' | 'audio' | 'video' | 'custom'
  urlPattern?: string
  renderer: React.FC<ExternalLinkProps>
  contexts: ('texte' | 'marche' | 'partie' | 'global')[]
}
```

**Types de liens envisages :**
- `dordonia-agent` - Lien vers l'agent IA Dordonia
- `blog-post` - Article de blog associe
- `instagram-post` - Post Instagram du lieu
- `soundcloud-track` - Piste audio externe
- `youtube-video` - Video documentaire
- `wikipedia-article` - Reference encyclopedique

**Integration :** Chaque texte/marche peut avoir des `externalLinks[]` qui apparaissent comme des boutons/icones dans la visionneuse.

---

## 5. Structure des Fichiers Proposee

```text
src/
  registries/
    pageTypes.ts           # Registre des types de pages
    traverseeModes.ts      # Registre des modes de traversee
    indexTypes.ts          # Registre des types d'index
    externalLinks.ts       # Registre des liens externes
    
  components/admin/
    livre-vivant/
      LivreVivantViewer.tsx       # Composant principal (modal)
      LivreVivantNavigation.tsx   # Barre de navigation
      LivreVivantToc.tsx          # Panneau Table des Matieres
      LivreVivantToolbar.tsx      # Barre d'outils (device, theme)
      
      renderers/
        CoverRenderer.tsx         # Page de couverture
        PartieRenderer.tsx        # Page de partie
        TexteRenderer.tsx         # Page de texte
        IndexRenderer.tsx         # Page d'index (generique)
        TraverseeRenderer.tsx     # Page de traversee (wrapper)
        ExternalLinksBar.tsx      # Barre de liens externes
        
      hooks/
        useBookPages.ts           # Generation de la sequence de pages
        useBookNavigation.ts      # Logique de navigation
        useDeviceSimulation.ts    # Simulation responsive
```

---

## 6. Interface du Livre Vivant

```text
+------------------------------------------------------------------+
|  ← 12/47          LIVRE VIVANT          📱 🎨  ×                 |
+------------------------------------------------------------------+
|                                                                  |
|                         ┌─────────────┐                          |
|                         │             │                          |
|                         │   CONTENU   │                          |
|                         │   DE LA     │                          |
|                         │   PAGE      │                          |
|                         │             │                          |
|                         └─────────────┘                          |
|                                                                  |
|  [🌐 Blog] [🤖 Dordonia] [📸 Instagram]     <- Liens Externes    |
|                                                                  |
+------------------------------------------------------------------+
|  ◀◀   ◀   [═══════●══════════════]   ▶   ▶▶                     |
|                                                                  |
|  🏠 Accueil  📑 TdM  🧭 Traversees  🔖 Signets                   |
+------------------------------------------------------------------+
```

---

## 7. Navigation vers les Traversees

Depuis la visionneuse, un bouton "Traversees" ouvre un menu permettant d'acceder directement aux modes immersifs :

```text
+---------------------------+
|     TRAVERSEES            |
+---------------------------+
| 📊 Sismographe Poetique   |
| 🌌 Index Vivant (Orbites) |
| ─────────────────────     |
| 🌟 Constellation  [BETA]  |
| ⏱️ Flux Temporel  [NEW]   |
| 🎵 Cartographie Sonore    |
+---------------------------+
```

---

## 8. Mode d'Ajout d'un Nouveau Mode de Traversee

Pour ajouter une nouvelle traversee (ex: "Constellation Textuelle") :

**Etape 1 :** Creer le composant
```text
src/components/admin/ConstellationView.tsx
```

**Etape 2 :** L'enregistrer dans le registre
```text
// src/registries/traverseeModes.ts
{
  id: 'constellation',
  label: 'Constellation Textuelle',
  icon: Stars,
  description: 'Visualise les liens semantiques entre textes',
  component: ConstellationView,
  category: 'visualisation',
  badge: 'beta',
}
```

**Etape 3 :** Le mode apparait automatiquement dans le menu Traversees.

---

## 9. Implementation en Phases

### Phase 1 : Fondations (Cette iteration)
- Creer la structure de registres (`src/registries/`)
- Creer `LivreVivantViewer` avec navigation basique
- Integrer les pages existantes (cover, partie, texte)
- Bouton "Lire le Livre" dans `EpubPreview.tsx`

### Phase 2 : Navigation Complete
- Table des matieres interactive
- Raccourcis clavier et swipe
- Simulation responsive (mobile/tablette)

### Phase 3 : Traversees Integrees
- Menu Traversees dans la visionneuse
- Integration du Sismographe et Index Vivant
- Transition fluide livre -> traversee -> livre

### Phase 4 : Liens Externes
- Registre des liens externes
- Barre de liens contextuels par texte/marche
- Integration Dordonia, blogs, reseaux sociaux

### Phase 5 : Nouveaux Modes
- Constellation Textuelle
- Flux Temporel
- Index Emotionnel (IA)

---

## Section Technique

### Fichiers a Creer

1. **`src/registries/pageTypes.ts`**
   - Type `PageType` et tableau `PAGE_TYPES_REGISTRY`
   - Fonction `getPageRenderer(type)`

2. **`src/registries/traverseeModes.ts`**
   - Type `TraverseeMode` et tableau `TRAVERSEE_MODES_REGISTRY`
   - Fonction `getTraverseeComponent(id)`

3. **`src/registries/indexTypes.ts`**
   - Type `IndexType` et tableau `INDEX_TYPES_REGISTRY`
   - Reutilisation de `KEYWORD_CATEGORIES` pour l'index thematique

4. **`src/registries/externalLinks.ts`**
   - Type `ExternalLinkType` et tableau `EXTERNAL_LINKS_REGISTRY`
   - Configurations pour blog, agents, reseaux sociaux

5. **`src/components/admin/livre-vivant/LivreVivantViewer.tsx`**
   - Modal plein ecran
   - Gestion de l'etat (page courante, signets, mode)
   - Rendu conditionnel via registres

6. **`src/components/admin/livre-vivant/LivreVivantNavigation.tsx`**
   - Barre de progression
   - Boutons navigation
   - Menu Traversees

7. **`src/components/admin/livre-vivant/LivreVivantToc.tsx`**
   - Panneau lateral slide-in
   - Liste navigable

8. **`src/components/admin/livre-vivant/renderers/*.tsx`**
   - Un renderer par type de page
   - Props standardisees via `PageRendererProps`

9. **`src/components/admin/livre-vivant/hooks/useBookPages.ts`**
   - Hook pour generer la sequence de pages
   - Utilise `groupTextesByPartie` existant

### Fichiers a Modifier

1. **`src/components/admin/EpubPreview.tsx`**
   - Ajouter import de `LivreVivantViewer`
   - Ajouter etat `isViewerOpen`
   - Ajouter bouton "Lire le Livre" dans le footer

2. **`src/components/admin/TraverseesHub.tsx`**
   - Migrer vers l'utilisation de `TRAVERSEE_MODES_REGISTRY`
   - Rendre le composant plus generique

### Types TypeScript Cles

```text
// PageRendererProps - Interface commune pour tous les renderers
interface PageRendererProps {
  colorScheme: ColorScheme;
  typography: Typography;
  data?: unknown;  // Donnees specifiques au type de page
  onNavigate?: (pageIndex: number) => void;
  onOpenTraversee?: (mode: string) => void;
  externalLinks?: ExternalLink[];
}

// BookPage - Une page dans la sequence du livre
interface BookPage {
  id: string;
  type: string;
  title: string;
  data?: unknown;
  externalLinks?: ExternalLink[];
}

// ExternalLink - Lien vers contenu externe
interface ExternalLink {
  type: string;  // Reference au registre
  url: string;
  label?: string;
  context: 'texte' | 'marche' | 'partie' | 'global';
}
```

### Dependances Utilisees

- `framer-motion` (deja installe) : animations, gestures, transitions
- `lucide-react` : icones
- `@radix-ui/react-dialog` (deja installe) : modal accessible

### Considerations UX

- **Responsive** : La visionneuse s'adapte a la taille d'ecran
- **Accessible** : Navigation clavier complete, focus visible
- **Performant** : Virtualisation des pages si > 100 pages
- **Persistant** : Position de lecture sauvegardee en localStorage
