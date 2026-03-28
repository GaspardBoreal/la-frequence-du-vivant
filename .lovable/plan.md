

# Optimisation verticale de la page Accueil — sans scroll

## Analyse du budget vertical (viewport 672px)

| Bloc | Hauteur actuelle estimée |
|------|------------------------|
| Header sticky | ~48px |
| TabBar top (scrollable) | ~60px |
| Padding main (py-5) | 20px top |
| FrequenceWave (p-3 + contenu) | ~90px |
| space-y-5 gap | 20px |
| ProgressionCard (p-6 + timeline) | ~240px |
| space-y-5 gap | 20px |
| Quick actions (p-4 + icon 40px) | ~90px |
| Bottom nav mobile (pb-24) | ~96px |
| **Total** | **~684px** → déborde |

## Gains ciblés (objectif : -100px)

### 1. ProgressionCard — le plus gros bloc (~240px → ~180px)
- Padding `p-6` → `p-4` (gain ~16px)
- `space-y-4` → `space-y-2` (gain ~16px)
- Timeline des rôles : icônes `w-8 h-8` → `w-6 h-6`, supprimer le `pt-2` (gain ~16px)
- Texte description italic : `text-sm` reste mais `line-clamp-2` pour limiter à 2 lignes max (gain ~10px)

### 2. AccueilTab — gaps entre blocs
- `space-y-5` → `space-y-3` (gain ~8px)

### 3. Quick actions — boutons plus compacts
- Padding `p-4` → `p-3` (gain ~8px)
- Icônes `w-10 h-10` → `w-8 h-8`, internes `w-5 h-5` → `w-4 h-4` (gain ~8px)
- `gap-2` → `gap-1.5` (gain ~4px)

### 4. Main container
- `py-5` → `py-3` (gain ~8px)

**Total estimé : ~95px de gain → tout tient dans 672px**

## Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/components/community/ProgressionCard.tsx` | Réduire padding, espacements, taille timeline |
| `src/components/community/tabs/AccueilTab.tsx` | Réduire `space-y-5` → `space-y-3`, boutons plus compacts |
| `src/pages/MarchesDuVivantMonEspace.tsx` | `py-5` → `py-3` dans le main |

Aucun changement de couleur, contenu ou structure. Uniquement des ajustements de taille.

