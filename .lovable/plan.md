

# Supprimer la sous-ligne "kigo" du header

## Constat

La ligne 54-59 affiche le kigo d'accueil sous le prénom (ex: "🌿 Marcheur"). Cette info prend de la place et crée de la confusion avec le badge de rôle "Marcheur en devenir" qui est déjà affiché via `RoleBadge`.

## Modification

**Fichier** : `src/components/community/MonEspaceHeader.tsx`

Supprimer le `<span>` des lignes 54-59 qui affiche le kigo d'accueil. Le badge `RoleBadge` (ligne 52) qui affiche "Marcheur en devenir" est conservé intact.

Le bloc `<div className="flex-1 min-w-0">` ne contiendra plus que la ligne prénom + badge rôle.

