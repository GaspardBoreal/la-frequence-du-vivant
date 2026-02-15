

# Carte Carnet de Terrain -- Variante "Lumiere" pour la page Explorer

## Probleme

Le composant `CarnetTerrainCard` actuel est concu pour un fond sombre (page galerie). Sur la page Explorer (fond creme/clair), les textes et badges sont peu lisibles car ils utilisent des couleurs claires (`text-foreground`, `text-emerald-400/80`, etc.) pensees pour un fond noir.

Image 1 (Explorer, fond clair) : textes quasi invisibles, badges decolores.
Image 2 (Galerie, fond sombre) : rendu correct et lisible.

## Solution

Creer un composant **`CarnetTerrainCardLight`** dedie a la page Explorer, avec une palette adaptee au fond clair :

### Differences visuelles par rapport a la version sombre

| Element | Version sombre (galerie) | Version lumiere (Explorer) |
|---|---|---|
| Fond carte | `bg-white/[0.06]` glassmorphe | `bg-white` avec ombre douce |
| Bordure | `border-emerald-500/10` | `border-stone-200` hover `border-emerald-400/40` |
| Titre | `text-foreground` (clair) | `text-stone-800` hover `text-emerald-700` |
| Lieu | `text-muted-foreground` | `text-stone-500` |
| Badge especes | `text-emerald-400/80 bg-emerald-500/10` | `text-emerald-700 bg-emerald-50` |
| Badge photos | `text-sky-400/80 bg-sky-500/10` | `text-sky-700 bg-sky-50` |
| Badge audio | `text-amber-400/80 bg-amber-500/10` | `text-amber-700 bg-amber-50` |
| Region chip | `bg-amber-500/20 text-amber-200` | `bg-emerald-600/80 text-white` |
| Date chip | `bg-black/30 text-white/70` | `bg-white/70 text-stone-600` |
| Ombre hover | glow emeraude | ombre stone douce |

### Rendu attendu

Cartes blanches epurees avec coins arrondis, ombre portee subtile, badges aux couleurs saturees lisibles sur fond clair, typographie Crimson Text en stone fonce. Coherent avec l'esthetique editorial de la page Explorer.

## Modifications techniques

### 1. Nouveau fichier : `src/components/carnets/CarnetTerrainCardLight.tsx`

- Copie structurelle de `CarnetTerrainCard` (meme interface, meme logique de slug/date)
- Palette entierement remappee pour fond clair (voir tableau ci-dessus)
- Ombre CSS : `shadow-sm hover:shadow-lg` au lieu de glow emeraude
- Meme ratio 4/3, meme layout de badges, meme animation framer-motion

### 2. Modifier `src/pages/MarchesDuVivantExplorer.tsx`

- Remplacer l'import de `CarnetTerrainCard` par `CarnetTerrainCardLight`
- Utiliser `CarnetTerrainCardLight` dans la grille de la section "Carnets de terrain"
- Aucun autre changement

### Aucun impact sur la galerie

Le composant `CarnetTerrainCard` original reste inchange. La page `/marches-du-vivant/carnets-de-terrain` continue d'utiliser la version sombre.

