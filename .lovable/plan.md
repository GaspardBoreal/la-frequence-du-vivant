## Analyse des 12 éléments de Faune

J'ai croisé chaque carte affichée à l'écran avec la table `species_translations`. Verdict :

| # | Nom affiché | Nom scientifique | Statut | Correction proposée |
|---|---|---|---|---|
| 1 | **European Striped Shield** | *Graphosoma italicum* | ❌ Aucune entrée FR → affiche l'anglais brut | **Punaise arlequin** (alt : *Pentatome rayé*, *Gendarme d'Italie*) |
| 2 | Tircis | *Pararge aegeria* | ✅ Correct | — |
| 3 | Araignées du clade RTA | *Rta clade* | ✅ Acceptable (terme technique, pas de nom vernaculaire) | — |
| 4 | Sphinx fuciforme | *Hemaris fuciformis* | ✅ Corrigé hier | — |
| 5 | **Coenagrionidae** | *Coenagrionidae* | ❌ Latin recopié, pas un nom français | **Agrions** (alt : *Demoiselles*, *Coenagrionidés*) |
| 6 | Ptérygotes | *Pterygota* | ✅ Correct (sous-classe) | — |
| 7 | Mélitée | *Melitaea* | ⚠️ Singulier pour un genre — devrait être pluriel | **Mélitées** (alt : *Damiers*) |
| 8 | Grande sauterelle verte | *Tettigonia viridissima* | ✅ Correct | — |
| 9 | **Escargot de Bourgogne** | *Cornu aspersum* | ❌ **Erreur grave** : confusion d'espèce. *Escargot de Bourgogne* = *Helix pomatia* | **Petit-gris** (alt : *Escargot petit-gris*, *Escargot chagriné*) |
| 10 | Punaise rouge du feu | *Pyrrhocoris apterus* | ⚠️ Nom inhabituel | **Gendarme** (alt : *Pyrrhocore aptère*, *Suisse*, *Cherche-midi*) |
| 11 | Bourdon | *Bombus* | ✅ Correct | — |
| 12 | **Bruant des roseaux** | *Emberiza cirlus* | ❌ **Erreur grave** : confusion d'espèce. *Bruant des roseaux* = *Emberiza schoeniclus* | **Bruant zizi** |

### Synthèse
- **3 erreurs graves** (mauvaise espèce) : Cornu aspersum, Emberiza cirlus, Graphosoma italicum (anglais brut).
- **2 imprécisions** : Coenagrionidae (latin), Mélitée (singulier).
- **1 nom rare** : Pyrrhocoris apterus.
- **6 noms corrects**, dont Sphinx fuciforme déjà corrigé.

## Plan d'action

**Une seule migration SQL** sur `species_translations` qui :

1. **Insère** la ligne manquante pour *Graphosoma italicum* (`source: 'manual'`, `confidence: 'high'`).
2. **Met à jour** les 5 lignes existantes erronées ou imprécises :
   - *Cornu aspersum* → "Petit-gris"
   - *Emberiza cirlus* → "Bruant zizi"
   - *Coenagrionidae* → "Agrions"
   - *Melitaea* → "Mélitées"
   - *Pyrrhocoris apterus* → "Gendarme"
3. Pour chacune : `source = 'manual'`, `confidence_level = 'high'`, alternatives FR pertinentes dans `alternative_names_fr`. Cela les protège des futures réécritures par l'IA (logique déjà en place dans `translate-species`).

Aucun changement de code, aucun changement de schéma. Les noms apparaîtront au prochain rafraîchissement du cache TanStack Query.

### Détails techniques (SQL prévu)

```sql
INSERT INTO species_translations (scientific_name, common_name_fr, alternative_names_fr, source, confidence_level)
VALUES ('Graphosoma italicum', 'Punaise arlequin', ARRAY['Pentatome rayé','Gendarme d''Italie'], 'manual', 'high')
ON CONFLICT (scientific_name) DO UPDATE SET ...;

UPDATE species_translations SET common_name_fr='Petit-gris',
  alternative_names_fr=ARRAY['Escargot petit-gris','Escargot chagriné'],
  source='manual', confidence_level='high'
WHERE scientific_name='Cornu aspersum';
-- etc. pour les 4 autres
```
