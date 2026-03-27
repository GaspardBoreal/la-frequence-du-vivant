

# Supprimer le prénom du header

## Constat

Le prénom ("Gas...") est tronqué sur mobile et illisible. L'avatar avec les initiales (GB) identifie déjà l'utilisateur.

## Modification

**Fichier** : `src/components/community/MonEspaceHeader.tsx`

- Supprimer le `<h1>` du prénom (ligne 51)
- Le `RoleBadge` reste seul dans le bloc central

Layout résultant :
```text
[←] [GB] [Marcheur en devenir] [★ 0] [⚙️]
```

