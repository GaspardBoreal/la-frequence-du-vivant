

## Objectif

Permettre aux lectrices et lecteurs de consulter les eBooks Pro **directement en ligne** (consultation web responsive Mobile/Tablette/Desktop) selon les trois directions artistiques : **Galerie Fleuve**, **La Frequence du Vivant**, et **Dordonia** - en plus du telechargement du fichier .epub deja disponible.

---

## Analyse de l'existant

| Composant | Etat actuel |
|-----------|-------------|
| **LivreVivantViewer** | Viewer complet avec navigation, renderers modulaires, simulation device (Mobile/Tablette/Desktop), integration Traversees. Actuellement reserve a l'admin dans `/admin/exportations` |
| **PublicEpubDownload** | Page `/epub/:slug` permettant de telecharger le .epub publie. Affiche couverture, metadata, bouton download |
| **Directions artistiques** | 3 presets complets definis dans `epubExportUtils.ts` : `galerie_fleuve`, `frequence_vivant`, `dordonia` avec colorSchemes et typographies specifiques |
| **Table `published_exports`** | Stocke les exports publies avec `artistic_direction` deja enregistree |
| **Routes lecteurs** | Pattern etabli : `/lecteurs/exploration/:slug/...` |

---

## Solution proposee : Double experience lecteur

Offrir aux lecteurs **deux modes de consultation** depuis une page d'accueil enrichie :

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PAGE PUBLIQUE /epub/:slug                               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    [Couverture]                                      │   │
│   │                                                                      │   │
│   │   Frequences de la riviere Dordogne                                  │   │
│   │   Atlas des Vivants                                                  │   │
│   │   par Gaspard Boreal                                                 │   │
│   │                                                                      │   │
│   │   [Badge: Galerie Fleuve]                                            │   │
│   │                                                                      │   │
│   │   ┌─────────────────────┐   ┌─────────────────────┐                  │   │
│   │   │   📖 Lire en ligne  │   │   ⬇️ Telecharger    │                  │   │
│   │   │   (Livre Vivant)    │   │   (.epub)          │                  │   │
│   │   └─────────────────────┘   └─────────────────────┘                  │   │
│   │                                                                      │   │
│   │   267 telechargements • 1.2 Mo                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Clic "Lire en ligne"
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PAGE /epub/:slug/lire                                      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   LIVRE VIVANT PUBLIC                                │   │
│   │                                                                      │   │
│   │   [Desktop] [Tablet] [Mobile]           ← 1/56     Fermer [X]       │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │                                                                      │   │
│   │              ┌──────────────────────────────────┐                    │   │
│   │              │                                  │                    │   │
│   │              │   Frequences de la riviere      │                    │   │
│   │              │   Dordogne - atlas des vivants  │                    │   │
│   │              │                                  │                    │   │
│   │              │   Gaspard Boreal                │                    │   │
│   │              │   La Comedie des Mondes Hybrides│                    │   │
│   │              │                                  │                    │   │
│   │              └──────────────────────────────────┘                    │   │
│   │                                                                      │   │
│   │   ─────────────────────────────────────────────────────────────────  │   │
│   │   🏠 Accueil  📋 Sommaire  📍 Lieux  📖 Genres  🧭 Traversees       │   │
│   │                                                                      │   │
│   │   ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░  3%                               │   │
│   │   |◀  ◀  1 / 56  ▶  ▶|                                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture technique

### 1. Nouvelle table `exploration_ebooks` (optionnel pour phase 2)

Pour la **Phase 1**, on reutilise la table `published_exports` existante qui contient deja tout le necessaire.

Pour une **Phase 2** ulterieure (ebooks pre-generes par direction artistique), on pourrait ajouter :

```text
CREATE TABLE exploration_ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id uuid REFERENCES explorations(id) NOT NULL,
  artistic_direction text NOT NULL,  -- 'galerie_fleuve' | 'frequence_vivant' | 'dordonia'
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exploration_id, artistic_direction)
);
```

### 2. Nouvelle page `PublicLivreVivant.tsx`

**Route** : `/epub/:slug/lire`

Cette page :
1. Recupere le `published_export` via le slug
2. Recupere les textes de l'exploration associee (via `exploration_id`)
3. Construit les options EPUB avec la direction artistique stockee
4. Affiche le **LivreVivantViewer** en mode plein ecran

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PublicLivreVivant.tsx                                                      │
│                                                                             │
│  1. useParams() → slug                                                      │
│  2. SELECT * FROM published_exports WHERE slug = :slug                      │
│  3. Si exploration_id → useExplorationTexts(exploration_id)                 │
│  4. Construire EpubExportOptions avec artistic_direction                    │
│  5. Render <PublicLivreVivantViewer textes={textes} options={options} />    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Nouveau composant `PublicLivreVivantViewer.tsx`

Version publique du LivreVivantViewer :
- **Sans Dialog** : page plein ecran directe (pas de modal)
- **Bouton retour** : vers `/epub/:slug` au lieu de fermer
- **Mode responsive natif** : detection automatique du device
- **Conservation de toutes les fonctionnalites** : navigation, renderers, Traversees

### 4. Modification de `PublicEpubDownload.tsx`

Ajouter un **deuxieme bouton** "Lire en ligne" :

```text
<Button variant="outline" size="lg" onClick={() => navigate(`/epub/${slug}/lire`)}>
  <BookOpen className="h-5 w-5 mr-2" />
  Lire en ligne
</Button>
```

### 5. Modification de `publicExportUtils.ts`

Ajouter `exploration_id` lors de la publication pour permettre la recuperation des textes :

```text
export const publishExport = async (options: PublishExportOptions): Promise<PublishedExport> => {
  // ... existing code ...
  
  const { data: insertData } = await supabase
    .from('published_exports')
    .insert({
      // ... existing fields ...
      exploration_id: options.explorationId,  // ← Ajouter ce champ
    })
```

### 6. Mise a jour du Router

```text
// App.tsx
<Route path="/epub/:slug" element={<PublicEpubDownload />} />
<Route path="/epub/:slug/lire" element={<PublicLivreVivant />} />  // ← Nouveau
```

---

## Fichiers a creer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/PublicLivreVivant.tsx` | CREER | Page publique de lecture en ligne |
| `src/components/public/PublicLivreVivantViewer.tsx` | CREER | Viewer adapte pour les lecteurs publics |
| `src/pages/PublicEpubDownload.tsx` | MODIFIER | Ajouter bouton "Lire en ligne" |
| `src/utils/publicExportUtils.ts` | MODIFIER | Ajouter `exploration_id` au workflow de publication |
| `src/components/admin/EpubExportPanel.tsx` | MODIFIER | Passer `explorationId` a `publishExport()` |
| `src/App.tsx` | MODIFIER | Ajouter route `/epub/:slug/lire` |

---

## Workflow utilisateur

### Pour l'administrateur :

1. Aller sur `/admin/exportations`
2. Selectionner une direction artistique (ex: "Galerie Fleuve")
3. Configurer les metadonnees
4. Cliquer "Publier & Partager"
5. Copier le lien public `/epub/{slug}`

### Pour le lecteur :

1. Recevoir le lien `/epub/{slug}`
2. Voir la page d'accueil avec couverture et description
3. **Choix 1** : Cliquer "Lire en ligne" → ouverture du Livre Vivant responsive
4. **Choix 2** : Cliquer "Telecharger" → telechargement du .epub

---

## Avantages de cette approche

1. **Reutilisation maximale** : Le LivreVivantViewer existe deja, seule une adaptation legere est necessaire
2. **Coherence visuelle** : Les lecteurs voient exactement la meme experience que l'apercu admin
3. **Respect des directions artistiques** : Chaque publication conserve son theme (couleurs, typographie)
4. **Mobile-first** : Le viewer est deja responsive
5. **SEO-friendly** : Les pages publiques sont indexables
6. **Evolutif** : Permet d'ajouter facilement de nouvelles directions artistiques

---

## Phase 2 (future) : Acces direct par direction depuis Galerie Fleuve

Une fois le systeme valide, on pourra ajouter des liens directs depuis les pages thematiques :

- Galerie Fleuve (`/galerie-fleuve/exploration/:slug`) → bouton "📖 eBook Galerie Fleuve"
- Bioacoustique → bouton "📖 eBook Frequence du Vivant"
- Dordonia (`/dordonia`) → bouton "📖 eBook Dordonia"

Ces liens pourraient pointer directement vers `/epub/{slug-specific}/lire` ou generer dynamiquement l'ebook si non publie.

---

## Verification (acceptance)

1. Publier un ePUB depuis `/admin/exportations` avec direction "Galerie Fleuve"
2. Copier le lien public genere
3. Ouvrir le lien en navigation privee
4. Verifier la presence des deux boutons : "Lire en ligne" et "Telecharger"
5. Cliquer "Lire en ligne"
6. Verifier :
   - L'affichage du Livre Vivant avec les couleurs "Galerie Fleuve"
   - La navigation entre pages fonctionne
   - Le toggle Mobile/Tablette/Desktop fonctionne
   - Les Traversees sont accessibles
7. Tester sur mobile reel pour verifier la responsivite

