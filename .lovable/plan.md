

## Scroll en haut au clic sur "Événements"

### Constat
Quand l'utilisateur clique sur le bouton "Événements" depuis `/admin`, il arrive sur `/admin/marche-events` mais conserve la position de scroll de la page précédente (comportement par défaut de React Router).

### Investigation à mener
- Localiser la page `/admin/marche-events` (probablement `src/pages/MarcheEventsAdmin.tsx` ou équivalent)
- Vérifier s'il existe déjà un `ScrollToTop` global dans `App.tsx` (sinon le scroll manuel sur cette page suffit)

### Solution (minimale, 1 fichier)

Ajouter un `useEffect` au montage de la page cible :

```ts
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
}, []);
```

### Fichier concerné

| Fichier | Action |
|---|---|
| `src/pages/MarcheEventsAdmin.tsx` (ou nom équivalent à confirmer) | Ajout d'un `useEffect` de scroll au montage |

Aucune autre modification (pas de changement du bouton, pas de router global, pas de migration).

