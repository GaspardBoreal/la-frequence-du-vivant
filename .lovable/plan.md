

# Harmoniser les données entre la page Bioacoustique et le Carnet Vivant

## Diagnostic

La difference vient du **rayon de recherche** :

- **Page Bioacoustique** (COPIE 1) : rayon = **500m** (slider visible en bas) → 42 especes
- **Carnet Vivant** (COPIE 2) : rayon = **5000m** (code en dur dans le fallback edge function) → 264 especes, 89 oiseaux, etc.

Le meme endpoint `biodiversity-data` est appele, mais avec un rayon 10x plus grand dans le carnet, d'ou les chiffres gonfles.

## Proposition

### 1. Aligner le rayon par defaut a 500m dans le Carnet Vivant

Modifier l'appel edge function dans `VivantTab` : `radius: 500` au lieu de `5000`. Ainsi les chiffres correspondent exactement a ce que le marcheur voit sur la page bioacoustique.

### 2. Ajouter un lien "Explorer sur le territoire" dans le Carnet

Sous les stats du Territoire, afficher un petit lien cliquable qui ouvre la page bioacoustique de cette marche. Le marcheur peut alors ajuster le rayon, filtrer par espece, etc. Le carnet reste un resume compact ; la page bioacoustique est l'outil de fouille.

```text
  ┌───────────────────────────────┐
  │  🌍 LE TERRITOIRE             │
  │  42 especes · 26 plantes ...  │
  │  [top especes]                │
  │                               │
  │  🔗 Explorer sur le territoire│
  └───────────────────────────────┘
```

Le lien existe deja dans le code (`explorerLink`) mais n'est rendu que si `marcheSlug` est fourni. Il faut s'assurer que le slug est bien transmis.

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/components/community/MarcheDetailModal.tsx` | Ligne ~183 : changer `radius: 5000` en `radius: 500`. Verifier que `marcheSlug` est bien passe au `VivantTab` pour que le lien "Explorer" fonctionne. |

