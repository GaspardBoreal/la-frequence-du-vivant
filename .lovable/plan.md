

## Acces discret aux eBooks "Livre Vivant" depuis les pages d'exploration

### Contexte

Les lecteurs naviguant sur les pages d'exploration publiques n'ont actuellement aucun moyen d'acceder aux versions eBook interactives ("Livre Vivant") publiees selon differentes directions artistiques. L'objectif est d'ajouter un acces discret, elegant et non prioritaire vers ces trois versions.

### Pages concernees

| Page | URL | Emplacement du lien discret |
|------|-----|----------------------------|
| Galerie Fleuve Welcome | `/galerie-fleuve/exploration/:slug` | Footer (zone "Gaspard Boreal") |
| Biodiversite | `/galerie-fleuve/exploration/:slug/biodiversite` | Footer existant |
| Dordonia Welcome | `/dordonia` | Footer existant |

### Solution proposee

Creer un composant reutilisable `EbookSelectorDialog` qui :
1. S'ouvre via un lien textuel discret dans le footer de chaque page
2. Presente les trois directions artistiques de maniere elegante
3. Redirige vers l'URL de lecture correspondante

---

### Architecture technique

```text
Composant EbookSelectorDialog
┌─────────────────────────────────────────────────────────────┐
│                  Lire le Livre Vivant                       │
│                                                             │
│  Choisissez votre experience de lecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ Emeraude      │  │ Foret         │  │ Cyan          │   │
│  │ ■             │  │ ■             │  │ ■             │   │
│  │               │  │               │  │               │   │
│  │ Galerie Fleuve│  │ Frequence     │  │ Dordonia      │   │
│  │               │  │ du Vivant     │  │               │   │
│  │ Style epure   │  │ Theme nocturne│  │ Theme riviere │   │
│  │ fond blanc    │  │ foret         │  │ nuit          │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Fichiers a creer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/EbookSelectorDialog.tsx` | CREER | Dialog de selection des 3 directions artistiques |
| `src/components/GalerieFleuveWelcome.tsx` | MODIFIER | Ajouter le lien discret dans le footer |
| `src/pages/ExplorationBiodiversite.tsx` | MODIFIER | Ajouter le lien discret dans le footer |
| `src/components/dordonia/DordoniaWelcome.tsx` | MODIFIER | Ajouter le lien discret dans le footer |

---

### Details techniques

#### 1. Composant `EbookSelectorDialog`

Props :
- `explorationId?: string` - Pour charger dynamiquement les publications disponibles (optionnel)
- `trigger: React.ReactNode` - Element declencheur personnalisable

Comportement :
- Au clic sur le trigger, ouvre un Dialog Radix UI
- Affiche les trois cartes cliquables avec preview de couleur
- Redirige vers `/epub/:slug/lire` au clic sur une carte

```text
interface EbookDirection {
  key: 'galerie_fleuve' | 'frequence_vivant' | 'dordonia';
  label: string;
  description: string;
  colorPreview: string;  // Couleur d'accent pour preview
  url: string;           // URL directe vers le livre
}

const EBOOK_DIRECTIONS: EbookDirection[] = [
  {
    key: 'galerie_fleuve',
    label: 'Galerie Fleuve',
    description: 'Style galerie d\'art epure, fond blanc, accents emeraude',
    colorPreview: '#10B981',
    url: '/epub/frequences-de-la-riviere-dordogne-atlas-des-vivant-2026-02-01-5257/lire'
  },
  {
    key: 'frequence_vivant',
    label: 'Frequence du Vivant',
    description: 'Theme nocturne foret, fond sombre, accents menthe',
    colorPreview: '#22C55E',
    url: '/epub/frequences-de-la-riviere-dordogne-atlas-des-vivant-2026-02-01-ukcu/lire'
  },
  {
    key: 'dordonia',
    label: 'Dordonia',
    description: 'Theme nocturne riviere, fond bleu nuit, accents cyan',
    colorPreview: '#22D3EE',
    url: '/epub/frequences-de-la-riviere-dordogne-atlas-des-vivant-2026-02-01-nwj6/lire'
  }
];
```

Design du dialog :
- Fond avec backdrop blur leger
- Titre discret : "Lire le Livre Vivant"
- Sous-titre : "Choisissez votre experience de lecture"
- 3 cartes cote a cote (responsive : 1 colonne sur mobile)
- Chaque carte :
  - Bandeau de couleur en haut (accent du theme)
  - Nom de la direction artistique
  - Description courte en texte muted
  - Hover avec legere elevation et glow

#### 2. Modification de `GalerieFleuveWelcome.tsx`

Dans le footer existant (lignes 304-318), ajouter un lien discret :

```text
Avant:
  <a href="...">Decouvrir l'auteur</a>
  <a href="...">Conferences et formation IA</a>

Apres:
  <a href="...">Decouvrir l'auteur</a>
  <a href="...">Conferences et formation IA</a>
  <EbookSelectorDialog trigger={
    <button className="text-white/60 hover:text-white/90 transition-colors text-sm italic">
      Livre Vivant
    </button>
  } />
```

Style du lien :
- Opacite reduite (60%)
- Italique
- Meme typographie que les autres liens
- Pas d'icone pour rester discret
- Hover subtil vers opacite 90%

#### 3. Modification de `ExplorationBiodiversite.tsx`

Dans le footer existant (lignes 290-298), ajouter avant le copyright :

```text
Avant:
  <p>Donnees issues de GBIF...</p>
  <p>© 2025 - 2026...</p>

Apres:
  <div className="flex items-center justify-center gap-4 mb-2">
    <p>Donnees issues de GBIF...</p>
    <span className="text-muted-foreground/40">·</span>
    <EbookSelectorDialog trigger={
      <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors text-xs italic">
        Livre Vivant
      </button>
    } />
  </div>
  <p>© 2025 - 2026...</p>
```

#### 4. Modification de `DordoniaWelcome.tsx`

Dans le footer existant (lignes 112-122), integrer discretement :

```text
Avant:
  <p>© 2026 Gaspard Boreal / Contenus sous licence CC BY-NC-SA 4.0</p>

Apres:
  <div className="flex flex-col items-center gap-2">
    <EbookSelectorDialog trigger={
      <button className="text-muted-foreground/40 hover:text-cyan-400/60 transition-colors text-xs tracking-wider uppercase">
        Livre Vivant
      </button>
    } />
    <p>© 2026 Gaspard Boreal / Contenus sous licence CC BY-NC-SA 4.0</p>
  </div>
```

Style adapte a Dordonia :
- Texte tres discret (opacite 40%)
- Hover vers cyan (couleur signature Dordonia)
- Uppercase avec tracking pour coherence visuelle

---

### Rendu visuel attendu

**Sur Galerie Fleuve Welcome :**
Le lien "Livre Vivant" apparait en dernier dans la rangee de liens du footer, en italique et legerement plus transparent que les autres liens.

**Sur Biodiversite :**
Le lien apparait a cote de la mention des sources de donnees, separe par un point median, en taille xs.

**Sur Dordonia :**
Le lien apparait au-dessus du copyright, en majuscules tres discretes avec tracking large, dans l'esprit contemplatif de l'interface.

---

### Accessibilite

- Tous les boutons ont des roles implicites corrects
- Le Dialog a un `DialogTitle` pour les lecteurs d'ecran
- Les cartes sont focusables au clavier
- Les hovers ont des transitions douces

---

### Verification

1. Aller sur `/galerie-fleuve/exploration/remontee-dordogne-atlas-eaux-vivantes-2025-2045`
2. Scroller jusqu'au footer et reperer le lien "Livre Vivant"
3. Cliquer : le dialog s'ouvre avec les 3 options
4. Cliquer sur "Dordonia" : redirection vers `/epub/.../lire` avec theme cyan
5. Repeter sur `/dordonia` et sur la page biodiversite

