

# Ajouter un picto de connexion dans le bandeau haut de /marches-du-vivant/explorer

## Modification

### `src/pages/MarchesDuVivantExplorer.tsx` (lignes 184-191)

Ajouter un bouton/lien vers `/marches-du-vivant/connexion` dans le groupe de boutons a droite du bandeau nav, avant les boutons Partager et Imprimer.

- Icone : `UserCircle` (import depuis lucide-react) — evoque l'espace personnel / connexion
- Style : identique aux boutons existants (`p-2.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600`)
- Mobile first : meme taille tactile que les autres pictos (44px zone de tap via `p-2.5`), visible sur toutes les tailles d'ecran
- `title="Connexion / Mon espace"`

```tsx
<Link to="/marches-du-vivant/connexion" className="p-2.5 rounded-xl hover:bg-emerald-50 transition-colors text-emerald-600 hover:text-emerald-800" title="Connexion / Mon espace">
  <UserCircle className="w-4 h-4" />
</Link>
```

### Import

Ajouter `UserCircle` a l'import lucide-react existant (ligne 6-9).

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantExplorer.tsx` | Modifier (import + 1 lien dans la nav) |

