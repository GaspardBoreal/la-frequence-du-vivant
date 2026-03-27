

# Fix du contraste texte sur hover dans la liste des profils

## Probleme

Quand on survole un profil dans la liste d'ajout retroactif, le `hover:bg-accent` applique un fond clair (beige/jaune) mais le texte reste sombre, rendant le nom illisible.

## Correction

Dans `src/pages/MarcheEventDetail.tsx`, ligne 330, ajouter `hover:text-accent-foreground` à la classe du bouton pour que le texte s'adapte au fond de survol :

```
className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
```

Cela garantit que le texte utilise la couleur compagnon du fond `accent`, quelle que soit le thème.

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventDetail.tsx` | Ajouter `hover:text-accent-foreground` sur le bouton profil (ligne 330) |

