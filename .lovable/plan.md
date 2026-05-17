## Objectif

Dans `MarcheursTab` > sous-onglet **Contributions** d'un marcheur, remplacer la liste compacte (vignettes 44px) par une **mosaïque Bento** qui met les photos en grand format, avec priorité aux photos uploadées par le marcheur (`marcheur_observations.photo_url`) et fallback sur les photos iNat des snapshots.

## Sources de données (priorité)

Pour chaque taxon observé par le marcheur :
1. **Photo perso prioritaire** — requête `marcheur_observations` filtrée sur `marcheur_id ∈ crewIds(user)` + `marche_id ∈ explorationMarcheIds`, regroupée par `species_scientific_name`. Garder toutes les photos (chronologique) pour usage carrousel léger optionnel.
2. **Fallback iNat** — réutilise la requête existante sur `biodiversity_snapshots.species_data[].attributions[]` (matching par alias normalisé). Sert quand le marcheur n'a pas uploadé de photo perso pour cette espèce.

Fusion : déduplication par `scientificName`. Chaque entrée porte `{ scientificName, commonName/Fr, kingdom, photos: string[], primaryPhoto, hasOwnPhoto: boolean, lastDate, sources: Set<'marcheur'|'inat'> }`.

## UI — Mosaïque Bento

Nouveau composant `ContributionsBentoGrid` remplaçant le bloc lignes (lignes 539-613 de `MarcheursTab.tsx`).

**Structure de grille** (CSS Grid `auto-rows` + `col-span`/`row-span`) :
- Mobile : 2 colonnes uniformes (carré).
- Tablette : 3 colonnes, motif Bento (1 grande + petites alternées).
- Desktop : 4 colonnes, motif Bento riche.

**Algorithme de tailles** : trier par (a) `hasOwnPhoto` desc, (b) nombre de photos perso desc, (c) date récente desc. Le 1er occupe `col-span-2 row-span-2`, les positions 4 et 7 occupent `col-span-2`, le reste `1x1`. Espèces sans photo perso : tuile carrée standard.

**Tuile** :
- `<img>` plein cadre, `object-cover`, ratio carré ou 2x2 selon span, `aspect-square`/`aspect-[2/1]`.
- Dégradé sombre bas (`from-black/70 to-transparent`) pour lisibilité.
- En haut-gauche : pastille règne (icône + couleur — `getKingdomInfo` existante).
- En haut-droite : si `hasOwnPhoto`, micro-badge "📷 Marcheur" (emerald/10) ; sinon badge discret "iNat".
- En bas : `<SpeciesName>` (nom FR gras + nom scientifique italique petit), date relative à droite.
- Hover/tap : léger zoom (`scale-105`), couronne emerald (`ring-2 ring-emerald-500/40`).
- Clic : ouvre soit `originalUrl` (iNat) soit lightbox simple (photo perso) — V1 = lien direct externe ou ouverture image plein écran via Dialog shadcn déjà disponible.

**État vide** : conserver le bloc actuel (icône Leaf + texte italique).

**État chargement** : 6 skeletons en mosaïque (mêmes spans).

**Header** : conserver le compteur "{n} espèce(s) identifiée(s)" + `SortToggle` (date desc/asc). Ajouter un mini-toggle "Mes photos / Toutes" (filtre `hasOwnPhoto`) si pertinent — désactivé par défaut, à activer dans une V2 si demandé.

## Animations

- Apparition staggered via Framer Motion (`initial={{ opacity:0, scale:0.96 }}`, délai `i * 0.03`, max 0.4s) — déjà importé dans le fichier.
- Hover : transition `200ms` sur scale et ring.

## Performance

- `loading="lazy"` sur toutes les `<img>`.
- `decoding="async"`.
- `IntersectionObserver` via `motion` whileInView pour la mosaïque sous le pli.

## Fichiers touchés

- **Édité** : `src/components/community/exploration/MarcheursTab.tsx`
  - Étendre la requête `marcheur-contributions-species` pour récupérer les photos perso depuis `marcheur_observations` et fusionner avec les attributions iNat.
  - Remplacer le bloc liste (539-613) par `<ContributionsBentoGrid items={sorted} />`.
  - Définir `ContributionsBentoGrid` en sous-composant local (cohérent avec le reste du fichier).
- **Réutilisé** : `SpeciesName`, `useFrenchSpeciesNamesAuto`, `getKingdomInfo`, `SortToggle`.

## Hors scope

- Pas de modification des règles de calcul d'impact ni de la Fréquence.
- Pas de changement aux autres sous-onglets (Observations, Écoute, Textes, Votre impact).
- Pas de réorganisation drag-and-drop dans cette vue (déjà géré ailleurs via `useReorderMarcheurObservations`).
