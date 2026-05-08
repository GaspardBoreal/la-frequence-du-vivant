## Diagnostic

Le bug : dans `DayDetailDrawer`, on lit `sp.commonNameFr` directement depuis `species_data` (snapshot) — mais ce champ n'y est jamais stocké. Les snapshots ne contiennent que `commonName` (anglais, source iNat/GBIF). La traduction FR vit uniquement dans la table `species_translations`.

Deux systèmes existent en parallèle aujourd'hui :
- `useSpeciesTranslation` (unitaire, avec fallback edge function `translate-species`)
- `useFrenchSpeciesNames` (batch, lecture seule de la table)
- `useExplorationSpeciesPool` enrichit déjà à la source → c'est pourquoi l'écran "Vivant" fonctionne.

Cible : un **seul système** robuste, performant, utilisé partout, qui auto-traduit en arrière-plan ce qui manque.

## Architecture cible

### 1. Source de vérité unique : `useFrenchSpeciesNamesAuto` (nouveau hook)

Évolution de `useFrenchSpeciesNames` :
- Lit la table `species_translations` en batch (comme aujourd'hui).
- Pour les noms scientifiques **non trouvés**, déclenche en arrière-plan un appel batch à l'edge function `translate-species` (modifiée pour accepter un tableau et **INSERT** dans la table — cache permanent partagé).
- Re-renvoie le résultat enrichi via React Query invalidation → swap doux EN → FR sans flicker (transition opacity 200ms côté composant).
- Cache 24h client + cache DB permanent → 1 seule traduction LLM par espèce, jamais répétée.

### 2. Composant universel `<SpeciesName />` (nouveau)

```tsx
<SpeciesName 
  scientificName="Papaver rhoeas" 
  commonName="common poppy"  // fallback EN
  showScientific  // affiche italic en dessous
  size="sm|md|lg"
/>
```

- Utilise `useFrenchSpeciesNamesAuto` en interne (batch via React Query, donc partage le cache si plusieurs `<SpeciesName />` sur la même page).
- Affiche immédiatement `commonName` (EN) puis swap vers FR avec fade-in dès résolu.
- Variante `<SpeciesNameInline />` pour les cas sans bloc (juste le texte).

### 3. Hook batch pour les listes : `useEnrichSpeciesList(species[])`

Pour les hooks qui produisent déjà des listes (snapshots, evolution, pool…) : un seul appel qui retourne la liste enrichie avec `displayName` + `commonNameFr` résolus. Évite N appels.

### 4. Edge function `translate-species` — extension batch

Aujourd'hui elle prend une espèce. À étendre pour accepter `{ items: [{scientificName, commonName}] }` et :
- Filtrer celles déjà dans la table.
- Appeler le LLM (Lovable AI Gateway, gemini-2.5-flash) en un seul prompt structuré pour les manquantes.
- INSERT en bulk dans `species_translations` (source='ai', confidence='medium').
- Retourner la map.

## Migration progressive

### Phase 1 — Fix immédiat (DayDetailDrawer)
- Modifier `useBiodiversityEvolution` pour appeler `useEnrichSpeciesList` sur toutes les espèces extraites.
- Le drawer utilise `<SpeciesName />` → résolution garantie.

### Phase 2 — Drawers/modals d'espèces
Migrer vers `<SpeciesName />` :
- `SpeciesDetailModal.tsx`
- `SpeciesGalleryDetailModal.tsx`
- `SpeciesXenoCantoModal.tsx`
- `SpeciesCardWithPhoto.tsx`
- `EmblematicSpeciesGallery.tsx`
- `BiodiversityTop10Podium.tsx`
- `SpeciesExplorer.tsx` (vue "L'œil")
- `BiodiversityRiskRadar.tsx`
- `BiodiversityMap.tsx` (popups)

`SpeciesDisplay.tsx` actuel devient un **wrapper deprecated** qui délègue à `<SpeciesName />` pour compatibilité descendante (pas de breaking change).

### Phase 3 — Garde-fous
- Mémoire projet : règle Core "Tout affichage de nom d'espèce passe par `<SpeciesName />` ou un hook qui enrichit via `useEnrichSpeciesList`. Jamais de `commonName` brut affiché."
- Mémoire détaillée `mem://technical/species/french-name-resolution-architecture`.
- Lint custom optionnel (commentaire JSDoc `@requires SpeciesName` sur les types contenant scientificName) — non bloquant.

## Détails techniques

**Fichiers créés** :
- `src/hooks/useFrenchSpeciesNamesAuto.ts` (évolution avec auto-fill)
- `src/hooks/useEnrichSpeciesList.ts` (helper pour listes)
- `src/components/species/SpeciesName.tsx` (composant universel)
- `src/components/species/SpeciesNameInline.tsx` (variante inline)

**Fichiers modifiés** :
- `supabase/functions/translate-species/index.ts` → mode batch + INSERT
- `src/hooks/useBiodiversityEvolution.ts` → enrichit DayObservation
- `src/components/community/exploration/DayDetailDrawer.tsx` → utilise `<SpeciesName />`
- `src/components/biodiversity/SpeciesDisplay.tsx` → wrapper deprecated
- ~10 composants migrés progressivement (Phase 2)

**Aucune migration SQL** : la table `species_translations` existe déjà, RLS publique en lecture, INSERT via service_role depuis l'edge function.

## UX inspirante

- **Swap doux EN → FR** : opacity transition 200ms, jamais de layout shift (skeleton de largeur égale).
- **Badge subtil** : petit point émeraude `•` en hover si traduction AI fraîche (transparence sur la qualité).
- **Pas de blocage** : le nom EN s'affiche immédiatement, FR arrive quand prêt.
- **Cohérence totale** : même typographie, même hiérarchie partout (titre commun + sous-titre scientifique italique).
- **Accessibilité** : `<abbr title="nom scientifique">` sur le scientifique en mode inline pour SR.
