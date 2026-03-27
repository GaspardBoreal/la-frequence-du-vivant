

# Fix : empêcher l'ajout d'un participant déjà inscrit

## Cause racine

La contrainte `UNIQUE (user_id, marche_event_id)` sur `marche_participations` rejette l'insertion quand le participant existe déjà. Le participant zephyrine a bien été ajouté (présent en base), mais comme la liste ne se rafraîchissait pas (bug précédent), l'utilisateur a retenté, provoquant une violation de contrainte unique.

## Correction

Dans `src/pages/MarcheEventDetail.tsx`, filtrer les profils communautaires affichés dans le sélecteur d'ajout rétroactif pour **exclure ceux déjà participants** :

```tsx
const availableProfiles = allProfiles?.filter(
  (p) => !participations?.some((part) => part.user_id === p.user_id)
) ?? [];
```

Utiliser `availableProfiles` au lieu de `filteredProfiles` (qui ne filtre que par recherche textuelle) dans le rendu du sélecteur. Combiner les deux filtres : d'abord exclure les participants existants, puis appliquer le filtre de recherche.

De plus, améliorer le message d'erreur pour distinguer un doublon d'une autre erreur :

```tsx
onError: (error) => {
  if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
    toast.error('Ce participant est déjà inscrit à cet événement');
  } else {
    toast.error("Erreur lors de l'ajout du participant");
  }
}
```

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventDetail.tsx` | Filtrer les profils déjà participants + message d'erreur spécifique doublon |

