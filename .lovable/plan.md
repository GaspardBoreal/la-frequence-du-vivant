## Objectif
Supprimer la bascule clair/sombre et forcer le mode sombre partout, sans rien casser.

## Ce qui change

1. **`src/components/community/ThemeToggle.tsx`** — supprimé.

2. **Retrait du bouton** aux 3 endroits où il est affiché :
   - `src/components/layout/PublicTopBar.tsx` (bandeau public)
   - `src/components/community/MonEspaceHeader.tsx` (header Mon espace)
   - `src/pages/ProprieteEspace.tsx` (header Propriété)

3. **`src/contexts/ThemeContext.tsx`** — conservé mais simplifié : `resolvedTheme` vaut toujours `'dark'`, la classe `dark` est appliquée en permanence sur `<html>`, `setTheme` devient un no-op. Le contexte reste exporté pour ne casser aucun import existant (`PublicTopBar` lit `resolvedTheme` pour choisir son ton — il obtiendra toujours `dark`, cohérent avec l'app).

## Points de vigilance
- Aucun changement de palette, de tokens CSS ou de composants métier : seuls les rendus déjà en mode sombre restent actifs.
- `src/components/ui/sonner.tsx` utilise `next-themes` (indépendant) — non modifié, il reste sur `system` comme aujourd'hui.
- La clé localStorage `marcheur-theme` n'est plus lue ; les utilisateurs bloqués en clair repasseront automatiquement en sombre.
