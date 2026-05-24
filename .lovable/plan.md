## Objectif

Remplacer la barre de chiffres "RSO CUMA" (section ProofBar de `src/pages/MarchesDuVivantAgriculture.tsx`, lignes 22-27 et 186-211) par 5 indicateurs **dynamiques** sur la réalité Marches du Vivant, avec libellés inspirants pour le monde agricole.

## 1. Nouveau hook `useMarchesDuVivantStats`

Fichier : `src/hooks/useMarchesDuVivantStats.ts`

Une seule `useQuery` (clé `['mdv-public-stats']`, staleTime 30 min) qui effectue en parallèle :

- `supabase.from('marches').select('id, region, departement')` → `marches`, `regions` (distincts non vides), `departements` (distincts non vides).
- `supabase.from('community_profiles').select('id', { count: 'exact', head: true })` → `marcheurs`.
- Espèces identifiées : requête sur `biodiversity_snapshots` (id, marche_id, snapshot_date, species_data) ; pour chaque `marche_id` on garde le **snapshot le plus récent**, puis on agrège les `scientificName` (ou `scientific_name`) de `species_data` dans un `Set` normalisé (lowercase + trim) → `especes`.
  - Fallback robuste : si `species_data` est vide, on somme `total_species` du dernier snapshot par marche (borne haute approximative).
  - Plafonné via `.limit(10000)` pour éviter de dépasser la pagination Supabase ; pagination par batch si nécessaire.

Retour :

```ts
{ marches: number; regions: number; departements: number; especes: number; marcheurs: number; isLoading: boolean }
```

## 2. Refonte du bloc ProofBar

Dans `src/pages/MarchesDuVivantAgriculture.tsx` :

- Supprimer la constante `proofs` figée (lignes 22-27).
- Importer et appeler `useMarchesDuVivantStats()` dans le composant.
- Construire `proofs` à partir des valeurs live, avec format français (`Intl.NumberFormat('fr-FR')`).
- Pendant le chargement : afficher un skeleton léger (placeholder `—` + classe `animate-pulse`) sur le chiffre, libellés visibles.
- Mettre à jour l'en-tête (ligne 190) : `« Marches du Vivant — chiffres clés du réseau »`.

### Libellés proposés (orientés monde agricole)


| Chiffre        | Libellé principal                               | Sous-libellé                                                                                 |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `marches`      | **Marches du Vivant déjà organisées**           | Des exploitations et coopératives déjà engagées                                              |
| `regions`      | **Régions françaises mobilisées**               | Un réseau national au plus près de vos territoires                                           |
| `departements` | **Départements traversés**                      | Une couverture fine, adaptée à chaque bassin agricole                                        |
| `especes`      | **Espèces vivantes identifiées sur le terrain** | Inventaire opposable GBIF/iNaturalist · preuve de biodiversité réelle                        |
| `marcheurs`    | **Marcheurs-observateurs actifs**               | Agriculteurs, techniciens, élus, citoyens — une intelligence collective au service du vivant |


(Libellés finalisables avant build ; je propose ces formulations comme socle.)

## 3. Détails techniques

- `useMarchesDuVivantStats` est utilisé uniquement sur `MarchesDuVivantAgriculture.tsx` pour ce ticket (réutilisable ensuite ailleurs).
- Pas de changement de design system, palette `lime-400` et grille `grid-cols-2 md:grid-cols-5` (passage de 4 à 5 colonnes en desktop, 2 colonnes mobile inchangé).
- Aucun changement de base de données.
- Aucune autre section modifiée.

## Fichiers touchés

- **Nouveau** : `src/hooks/useMarchesDuVivantStats.ts`
- **Modifié** : `src/pages/MarchesDuVivantAgriculture.tsx` (constante `proofs`, en-tête section, grille 5 colonnes, branchement hook).