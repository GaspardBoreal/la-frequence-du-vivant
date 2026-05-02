# Sélecteur unifié de médias pour une "Nouvelle pratique éditoriale"

## Contexte

Dans `MainCuration.tsx` (onglet *La Main* → *Pratiques emblématiques* d'une exploration), le sélecteur de médias actuel ne propose que les photos du **mur Convivialité**. Il faut pouvoir piocher dans **tous les médias de toutes les marches** rattachées à l'événement (exploration), tout en conservant les photos Convivialité, le tout dans une UX mobile-first soignée.

## Sources à agréger

Pour une exploration donnée, on rassemble :

1. **Convivialité** — `exploration_convivialite_photos` (via `useConvivialitePhotos`)
2. **Photos & vidéos des marcheurs** — `marcheur_medias` (`type_media = 'photo' | 'video'`) joints à `marche_events.exploration_id`
3. *(préparé pour évolutions)* Audios — `marcheur_audio`. Hors périmètre v1 du sélecteur visuel mais l'architecture le permettra.

Chaque média est identifié par une **clé composite** stable :

```text
conv:<uuid>         → photo Convivialité
media:<uuid>        → marcheur_medias (photo ou vidéo)
```

Le champ `media_ids text[]` de `exploration_curations` accepte déjà ce format (les valeurs existantes `<uuid>` brutes seront migrées implicitement en lecture : un `id` sans préfixe = `conv:<id>`).

## UX mobile-first du sélecteur

Composant nouveau : `MediaPickerSheet.tsx` ouvert depuis l'éditeur de pratique. Sur mobile, plein écran via `Sheet` (Radix) ; sur desktop, modale large.

```text
┌──────────────────────────────────────────┐
│  ✕   Choisir les médias        3 sélect. │  ← header sticky
├──────────────────────────────────────────┤
│  [🖼 Photos] [🎞 Vidéos] [✨ Convivialité]│  ← filtres type (chips)
├──────────────────────────────────────────┤
│  ▾ Toutes les marches            [▿]     │  ← filtre marche (sélecteur)
├──────────────────────────────────────────┤
│  ┃ Marche du 12 mai · Beynac             │  ← section sticky par marche
│  ┃ ────────                              │
│  ┃ ▢ ▢ ▢ ▢                               │  grille 3 col mobile / 5 desktop
│  ┃ ▢ ▢ ▢                                  │
│  ┃                                        │
│  ┃ Marche du 18 mai · La Roque-Gageac    │
│  ┃ ▢ ▢ ▢ ▢ ▢ ▢                            │
│                                          │
│  ┃ ✨ Convivialité                       │
│  ┃ ▢ ▢ ▢                                  │
├──────────────────────────────────────────┤
│  [ Annuler ]      [ Valider · 3 médias ] │  ← footer sticky safe-area
└──────────────────────────────────────────┘
```

Détails UX :

- **Filtres rapides en chips** (haut, scrollables horizontalement) : `Tous` / `Photos` / `Vidéos` / `Convivialité`. État actif = pastille emerald, inactif = bordure douce.
- **Sélecteur de marche** : un `<Select>` listant *Toutes les marches* + chaque marche (date + ville). Permet de focaliser quand il y en a beaucoup.
- **Regroupement par marche** : titres sticky (date + lieu + compteur). Convivialité est une section virtuelle en fin (ou en tête, selon filtre).
- **Grille de vignettes** : carrés `aspect-square`, `grid-cols-3 sm:grid-cols-4 md:grid-cols-5`, gap 1.5. Vignettes cliquables avec coche emerald (cohérent avec l'existant). Vidéos : badge ▶ + durée si dispo.
- **Compteur global** dans le header + bouton flottant *Valider · N médias* en footer, en `position: sticky` avec `pb-[env(safe-area-inset-bottom)]`.
- **Lazy loading** des images (`loading="lazy"`, `decoding="async"`).
- **État vide** explicite par section : *« Aucun média pour cette marche »* sans casser la liste.
- **Recherche optionnelle (v1.1)** : input texte filtrant par titre — non bloquant pour la v1.
- **Animation** d'apparition `Sheet` (slide-up mobile, fade desktop) déjà fournie par shadcn.

## Architecture technique

### Nouveau hook `useExplorationAllMedia(explorationId)`

```text
returns {
  marches: Array<{ id, ville, date, nom_marche }>,
  byMarche: Record<marcheId, MediaItem[]>,   // marcheur_medias photo/video
  convivialite: MediaItem[],                  // exploration_convivialite_photos
}

interface MediaItem {
  key: string;        // 'conv:uuid' | 'media:uuid'
  source: 'conv' | 'media';
  type: 'photo' | 'video';
  url: string;
  thumbUrl?: string;
  titre?: string | null;
  authorName?: string;
  marcheId?: string;
  createdAt: string;
}
```

Implémentation :
- `marche_events` filtrés par `exploration_id` → liste des `event_id` + leur marche associée (jointure `marches`).
- `marcheur_medias` `IN (event_ids)` filtré `is_public=true`, types `photo|video`.
- `exploration_convivialite_photos` (réutiliser `useConvivialitePhotos` en interne).
- Tri : par `created_at DESC` au sein de chaque marche.

### Adaptations `MainCuration.tsx`

1. Remplacer la grille interne du dialog par un bouton *« Choisir les médias »* qui ouvre `MediaPickerSheet`.
2. Rendre la galerie d'aperçu de la pratique compatible **multi-sources** :
   - construire une `Map<key, MediaItem>` à partir de `useExplorationAllMedia`.
   - rétro-compatibilité : si une entrée stockée n'a pas de préfixe, la traiter comme `conv:<id>`.
   - Vidéos : afficher la vignette poster (1ère frame via `<video preload="metadata">` + `#t=0.1`) avec badge ▶.

### Nouveau composant `MediaPickerSheet.tsx`

Props :
```text
{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  explorationId: string;
  selectedKeys: string[];
  onConfirm: (keys: string[]) => void;
}
```
- État local `draft: Set<string>` initialisé depuis `selectedKeys` ; `onConfirm` à la validation uniquement.
- Utilise `useIsMobile()` pour basculer `Sheet` (mobile) / `Dialog` (desktop), ou simplement `Sheet side="bottom"` partout (plus simple et déjà mobile-first).

### Pas de changement de schéma DB

Le champ `media_ids text[]` accepte déjà des chaînes arbitraires. Aucune migration requise. Les anciennes pratiques restent lisibles grâce au fallback `id → conv:id`.

## Fichiers impactés

- **Créé** : `src/hooks/useExplorationAllMedia.ts`
- **Créé** : `src/components/community/insights/curation/MediaPickerSheet.tsx`
- **Modifié** : `src/components/community/insights/curation/MainCuration.tsx`
  - rendu galerie multi-sources + ouverture du picker
  - normalisation `id → conv:id` au chargement

## Hors périmètre

- Sélection d'audios/textes (peut être ajoutée ensuite via les chips de type).
- Réordonnancement de la sélection (drag-and-drop) — possible en v1.1.
- Filtre par auteur ou par date — pas demandé, on garde la sobriété.
