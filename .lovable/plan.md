
## Plan : Correction du parsing des haïkus avec formatage mixte

### Diagnostic

Le problème vient de la **structure HTML inconsistante** des haïkus en base de données :

| Format | Exemple | Résultat actuel |
|--------|---------|-----------------|
| ✅ Toutes lignes en `<div>` | `<div>L1</div><div>L2</div><div>L3</div>` | L1 ↵ L2 ↵ L3 |
| ❌ Première ligne "nue" | `L1<div>L2</div><div>L3</div>` | L1L2 ↵ L3 |

La fonction `cleanHtml` insère un `\n` seulement **après** une balise `</div>`. Si la première ligne n'est pas dans un `<div>`, elle fusionne avec la suivante.

---

### Solution : Insérer un retour ligne AVANT les `<div>` ouvrantes

**Fichier** : `src/utils/fableMoralExtractor.ts`

Modifier la fonction `cleanHtml` pour ajouter un `\n` **avant** chaque `<div>` ouvrante, pas seulement après la fermante :

```typescript
export const cleanHtml = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<div[^>]*>/gi, '\n')     // MODIFIÉ: div ouvrante = retour ligne AVANT
    .replace(/<\/div>/gi, '')          // MODIFIÉ: supprime la div fermante (plus de \n ici)
    .replace(/<[^>]+>/g, '')           // Supprime le reste des balises
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
```

**Avant** (haïku problématique) :
```
Entrée: "Vent doux sur la peau&nbsp;<div>Sons inquiétants</div><div>Bigre</div>"
Sortie: "Vent doux sur la peau Sons inquiétants\nBigre"
```

**Après** :
```
Entrée: "Vent doux sur la peau&nbsp;<div>Sons inquiétants</div><div>Bigre</div>"
Sortie: "Vent doux sur la peau \nSons inquiétants\nBigre"
```

---

### Résumé technique

| Fichier | Modification |
|---------|--------------|
| `src/utils/fableMoralExtractor.ts` | Inverser la logique `<div>` : le retour ligne se fait à l'ouverture, pas à la fermeture |

### Impact

- ✅ Corrige les haïkus avec première ligne "nue"
- ✅ Ne casse pas les haïkus déjà bien formatés
- ✅ Applicable à tous les textes utilisant `cleanHtml`
