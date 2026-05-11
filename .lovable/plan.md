## Contexte

Sur la fiche espèce de **Arion vulgaris** (modal `SpeciesDetailModal`), trois soucis cohabitent :

1. **Traduction FR douteuse** : la DB contient `Loche ibérique` (source `ai`, confidence `medium`) — Gemini a halluciné un nom peu courant. Le vrai nom français usuel est **Loche espagnole**. INPN est offline (cyberattaque MNHN), Wikipédia FR n'a pas matché → fallback IA non fiable.
2. **Carte de droite** : affiche le `commonName` brut anglais (« Spanish Slug ») au lieu du nom FR du cache, alors que le titre du modal lui utilise bien la traduction. Incohérence + viole la règle Core « Jamais de `commonName` brut affiché ».
3. **`Famille: 54582`** : `useSpeciesPhoto.ts` met `String(taxon.ancestor_ids[len-2])` (un ID iNat) dans le champ family. Ce n'est pas un nom de famille.

## Objectif

- Corriger immédiatement *Arion vulgaris* en DB.
- Donner aux curateurs (admin / ambassadeur / sentinelle) un moyen **in-place** de corriger n'importe quelle traduction douteuse, depuis le badge `Traduction medium - ai`.
- Aligner l'affichage : la carte droite et le titre utilisent le même nom FR ; la famille n'affiche plus un ID brut.

## Plan

### 1. Migration data — Arion vulgaris (immédiat)

Mettre à jour la ligne existante :
- `common_name_fr` → `Loche espagnole`
- `source` → `manual`
- `confidence_level` → `high`

### 2. Mini UI de curation in-place sur le badge `Traduction`

**Composant** `SpeciesTranslationCuratorBadge.tsx` (nouveau, dans `src/components/biodiversity/`) :
- Visible uniquement si `useCanCurateTranslations()` retourne `true` (admin / ambassadeur / sentinelle, même pattern que `useCanCurateAudio`).
- Pour un non-curateur : badge informatif inchangé (`Traduction medium - ai`).
- Pour un curateur : le badge devient un bouton, ouvre un **Popover** élégant avec :
  - Affichage du nom scientifique (lecture seule)
  - Input `Nom français` (pré-rempli avec la valeur actuelle)
  - Petite note : « Source actuelle : ai · medium · proposé par l'IA »
  - Boutons `Valider la traduction` (garde le nom, passe en `manual/high`) et `Enregistrer` (upsert avec source=`manual`, confidence=`high`)
- Sur succès : invalide les query keys `species-translation` + `french-species-names`, toast confirmation, popover se ferme.

**RPC dédiée** `update_species_translation_manual(scientific_name text, common_name text)` (SECURITY DEFINER) :
- Vérifie côté serveur que l'appelant est admin OU `community_profiles.role IN ('ambassadeur','sentinelle')`.
- Upsert dans `species_translations` avec `source='manual'`, `confidence_level='high'`.
- Plus sûr qu'une policy UPDATE ouverte aux 3 rôles (les policies actuelles n'autorisent que `admin`).

### 3. Réparer l'affichage de la fiche espèce

Dans `src/components/biodiversity/SpeciesDetailModal.tsx` (carte de droite, lignes ~170-190) :
- Remplacer le bloc actuel par `<SpeciesName scientificName=… commonName=… size="md" showScientific />` (déjà fait pour le titre — appliquer la cohérence).
- Garde uniquement `species.commonName` comme **fallback** dans `<SpeciesName />` ; le hook `useFrenchSpeciesNamesAuto` se charge du nom FR.
- Remplacer le badge inline par le nouveau `<SpeciesTranslationCuratorBadge />`.
- **Famille** : si `species.family` est purement numérique (regex `^\d+$`), masquer la ligne « Famille: … » (ne pas afficher d'ID brut). Si la valeur n'est pas numérique, l'afficher normalement. Solution durable : à terme, corriger `useSpeciesPhoto.ts` pour résoudre l'ID en nom (hors scope de cette correction UX, à signaler dans les notes).

### 4. QA

- Vérifier que *Arion vulgaris* affiche maintenant « Loche espagnole » dans le titre ET la carte droite.
- Le badge n'apparaît plus si `source='manual' && confidence='high'` (déjà géré par la condition existante `translation.source !== 'fallback'` à élargir : `source !== 'manual'`).
- Tester en tant qu'admin : popover s'ouvre, sauvegarde fonctionne, toast OK, refresh immédiat de la fiche.
- Tester en tant qu'utilisateur lambda : badge non cliquable.
- Tester sur mobile (390px) : popover bien positionné.

## Détails techniques

**Fichiers créés** :
- `src/components/biodiversity/SpeciesTranslationCuratorBadge.tsx`
- `src/hooks/useCanCurateTranslations.ts` (calque `useCanCurateAudio`)
- Migration SQL : RPC `update_species_translation_manual` + UPDATE one-shot d'Arion vulgaris

**Fichiers modifiés** :
- `src/components/biodiversity/SpeciesDetailModal.tsx` — carte droite : `<SpeciesName />` + nouveau badge + masquage family numérique

**Hors scope** (à traiter plus tard) :
- Refactor `useSpeciesPhoto.ts` pour résoudre les `ancestor_ids` en noms taxonomiques.
- Generaliser le badge à `SpeciesGalleryDetailModal.tsx` (même pattern, peut être fait dans un second temps).