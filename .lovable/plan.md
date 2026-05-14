## Objectif

Donner aux marcheurs une visibilité d'ensemble sur **leurs tags privés** :

1. Une **section "Mes tags"** dans le Carnet vivant — vue panoramique cliquable.
2. Une **story Impact dédiée** — célébration intime de leur grille de lecture du vivant (visible uniquement par eux-mêmes).

## 1. Carnet vivant — section "Mes tags"

### Emplacement
Dans `src/components/community/CarnetVivant.tsx`, **au-dessus** de la timeline saisonnière, dans un bloc repliable (par défaut replié si > 6 tags, déplié sinon) — cohérent avec la sobriété informationnelle.

### Contenu
- Titre `Mes tags` + icône `Tag` + chip privé.
- Pour chaque tag (trié par fréquence d'usage desc) : pastille colorée + label + compteur d'espèces distinctes.
- Click sur un tag → `Drawer` (existant) listant les espèces taggées, chacune cliquable pour ouvrir `SpeciesGalleryDetailModal`.
- État vide pédagogique : « Vous n'avez encore créé aucun tag. Ouvrez n'importe quelle fiche espèce dans Apprendre → L'Œil pour commencer votre vocabulaire personnel. »

### Données
Nouveau hook `useMyMarcheurTagsOverview()` dans `src/hooks/useMarcheurSpeciesTags.ts` :

```ts
export function useMyMarcheurTagsOverview() {
  return useQuery({
    queryKey: ['my-marcheur-tags-overview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('marcheur_species_tags')
        .select('id, label, color_hash, scientific_name, marche_id, created_at')
        .order('created_at', { ascending: false });
      // Group côté client par label_normalized
      // → [{ label, color_hash, total: n, speciesCount: distinct(scientific_name), species: [{scientific_name, marche_id, taggedAt}] }]
    },
  });
}
```

RLS existant garantit que seul le user voit ses tags. Aucune migration nécessaire.

## 2. Story Impact dédiée — "Mon regard sur le vivant"

### Conditionnelle
Story incluse **uniquement** si la prop `isSelf` (à propager depuis `MarcheurImpactPanel`) est vraie — un autre utilisateur n'a pas le droit de voir mes tags.

Détection `isSelf` : comparer `marcheur.userId` avec `supabase.auth.getUser().id` (déjà disponible via `useCurrentUser`/contexte ; sinon ajouter prop côté `MarcheursTab`).

### Position dans `STORY_KEYS`
Insérée après `familles`, avant `detections` :

```ts
const STORY_KEYS = ['empreinte', 'sentinelle', 'familles', ...(isSelf ? ['tags'] : []), 'detections', 'badges', 'palier'] as const;
```

### Contenu visuel (`StoryMyTags`)
- Eyebrow : `Mon regard · privé`
- Titre : `{labels.length} tags · {speciesCount} espèces que vous avez su nommer`
- Bulles flottantes (3-5 plus utilisées) — taille proportionnelle au compteur, couleur du tag, animation `motion` (entrée stagger + flotting).
- Si `<3` tags : variant pédagogique : « Votre vocabulaire commence à se former. »
- Si `0` tag : story sautée (on retire `'tags'` de `STORY_KEYS`).

### Données
Réutilise `useMyMarcheurTagsOverview()`. Hook appelé dans `MarcheurImpactPanel` quand `isSelf`.

## Fichiers touchés

- `src/hooks/useMarcheurSpeciesTags.ts` — ajout `useMyMarcheurTagsOverview`.
- `src/components/community/tags/MyTagsOverview.tsx` (nouveau) — section Carnet (collapse + grid + drawer espèces).
- `src/components/community/CarnetVivant.tsx` — insertion `<MyTagsOverview userId={userId} />` au-dessus de la timeline.
- `src/components/community/exploration/impact/ImpactStoriesViewer.tsx` — nouvelle story `StoryMyTags` + `STORY_KEYS` conditionnel sur prop `isSelf`.
- `src/components/community/exploration/impact/MarcheurImpactPanel.tsx` — calcul `isSelf` (via `supabase.auth.getUser()`), passage de la prop, fetch `useMyMarcheurTagsOverview()` quand `isSelf`.

## Détails techniques

- Pas de migration BDD ; pas de nouvelle RPC.
- Couleurs via `getTagColor(color_hash)` déjà exporté.
- `SpeciesGalleryDetailModal` réutilisable depuis le Drawer (signature actuelle : `name`, `scientificName`, `count`, `kingdom`).
- Privé = badge cadenas visible (cohérent avec `MarcheurSpeciesTagDots`).
- Mobile-first : la story doit tenir en `<= 740px` de hauteur, scroll vertical autorisé comme `StorySentinelle`.

## Hors scope

- Édition / suppression des tags depuis le Carnet (déjà disponible sur les fiches espèce — éviter la duplication).
- Partage public d'un tag (les tags restent strictement privés ; cf. mémoire sécurité).
