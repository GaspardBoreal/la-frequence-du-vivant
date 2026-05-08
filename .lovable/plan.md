# Badge "Textes" manquant sur la carte Marcheur

## Diagnostic

Dans l'onglet **Marcheurs** d'une exploration, chaque carte (`MarcheurCard`) affiche en compact 3 badges à droite : Photos (📷), Sons (🎧), Espèces (🌿). Le **nombre de textes écrits** par le marcheur n'apparaît nulle part dans cette ligne récap, alors que la donnée existe déjà : `marcheur.stats.textes` (alimenté côté hook par `marcheur_textes` count).

C'est pour ça que la coccinelle / haïku écrit par un marcheur "n'apparaît pas dans la liste" : le compteur n'est pas exposé visuellement sur la carte fermée. (À l'ouverture de `MarcheDetailModal` onglet Écrire, le badge sur l'icône plume fonctionne déjà.)

## Correction (mobile-first, élégante, robuste)

### Fichier impacté
- `src/components/community/exploration/MarcheursTab.tsx` (uniquement la carte `MarcheurCard`)

### Changements

1. **Importer l'icône `Feather`** (déjà présente dans lucide, plus organique que `PenLine` pour évoquer la plume d'écriture poétique). Garder `PenLine` en alternative si Feather pas dans la liste d'imports — déjà importé : `FileText`. Préférer **`Feather`** (cohérence avec `TextesEcritsSubTab` qui utilise déjà `Feather`).

2. **Calculer `textesCount`** : `marcheur.stats.textes || 0`.

3. **Ajouter le badge** dans le bloc des "Elegant stats badges" (lignes ~929-948), entre `audioCount` et `realContribCount`, avec :
   - Icône `Feather` ambre/or (`text-amber-400`) — couleur déjà associée à l'écriture (`Écrire` tab amber dans MarcheDetailModal).
   - Même style pill `bg-muted/60 dark:bg-white/5`, gap-1, px-2 py-0.5, taille `w-3 h-3` icône / `text-[11px]` chiffre.
   - `title` accessible : "X texte(s) partagé(s)".
   - Conditionnel : ne s'affiche que si `textesCount > 0`.

4. **Inclure `textesCount`** dans la condition `hasContent` pour que la carte reste expansible si elle n'a que des textes.

5. **Mobile-first** : les 4 badges restent côte à côte ; sur viewport étroit, le bloc `flex items-center gap-1.5 flex-shrink-0` se comporte déjà bien (chacun `px-2 py-0.5` ≈ 32-40px). Aucun débord attendu sur 320px.

### Hors périmètre
- Pas de modif backend / RLS (la donnée `stats.textes` est déjà calculée).
- Pas de modif du sous-onglet expand (déjà OK).
- Pas de modif de `MarcheDetailModal` (badge Écrire OK).

## Détails techniques

```tsx
const textesCount = marcheur.stats.textes || 0;
// hasContent
const hasContent = totalContribs > 0 || realContribCount > 0 
                || photoCount > 0 || audioCount > 0 || textesCount > 0;

// dans le bloc badges
{textesCount > 0 && (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 dark:bg-white/5"
       title={`${textesCount} texte${textesCount > 1 ? 's' : ''} partagé${textesCount > 1 ? 's' : ''}`}>
    <Feather className="w-3 h-3 text-amber-400" />
    <span className="text-[11px] font-semibold text-foreground">{textesCount}</span>
  </div>
)}
```

Import à ajouter : `Feather` dans la ligne `lucide-react` du fichier.
