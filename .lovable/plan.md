

## Étendre "Ma Fréquence du jour" avec Biodiversité et Bioacoustique

### Concept

Aujourd'hui, la Fréquence du jour affiche une citation littéraire (géopoétique). L'idée est d'enrichir cette expérience quotidienne avec deux nouveaux types de contenus :

- **Biodiversité** : un fait/anecdote sur une espèce, un écosystème, un phénomène écologique (ex: "Le lierre est l'une des dernières plantes à fleurir en automne, nourrissant abeilles et papillons quand tout s'éteint. — Source: INPN")
- **Bioacoustique** : un fait sonore sur un animal, un paysage sonore, une technique d'écoute (ex: "Le troglodyte mignon produit un chant de 90 dB, l'un des plus puissants rapportés à sa taille. — Source: Krause, 2012")

Chaque jour, le marcheur verra 3 fréquences dans un carousel ou des onglets discrets : Géopoétique, Biodiversité, Bioacoustique.

### Architecture

**Option retenue : ajouter une colonne `categorie` à la table existante `frequence_citations`** plutôt que créer de nouvelles tables. Cela permet de réutiliser toute l'infrastructure existante (compteurs, admin, IA).

### Modifications base de données (1 migration)

1. Ajouter une colonne `categorie` à `frequence_citations` :
   - Type : `text` avec valeur par défaut `'geopoetique'`
   - Valeurs possibles : `geopoetique`, `biodiversite`, `bioacoustique`
2. Toutes les citations existantes reçoivent automatiquement `'geopoetique'`

```sql
ALTER TABLE frequence_citations 
  ADD COLUMN categorie text NOT NULL DEFAULT 'geopoetique';
```

### Modifications admin (`AdminFrequences.tsx`)

1. Ajouter un **filtre par catégorie** (ToggleGroup) : Toutes | Géopoétique | Biodiversité | Bioacoustique
2. Ajouter un **sélecteur de catégorie** dans le formulaire d'ajout et d'édition
3. Afficher un **badge catégorie** sur chaque ligne du tableau
4. Adapter la suggestion IA pour passer la catégorie sélectionnée au prompt

### Modifications composant marcheur (`FrequenceWave.tsx`)

1. Charger les 3 catégories de citations
2. Sélectionner une citation par catégorie par jour (même algorithme seed mais décalé)
3. Afficher un **mini onglet** ou **carousel** avec 3 icônes :
   - BookOpen (Géopoétique)
   - TreePine (Biodiversité)  
   - Headphones (Bioacoustique)
4. Le marcheur peut switcher entre les 3, avec une animation douce

### Modifications Edge Function (`suggest-citations`)

Adapter le prompt pour accepter un paramètre `categorie` et générer des contenus appropriés :
- Géopoétique : citations littéraires (comportement actuel)
- Biodiversité : faits sourcés sur la faune/flore
- Bioacoustique : faits sur les sons du vivant, paysages sonores

### Fichiers concernés

| Fichier | Action |
|---|---|
| Nouvelle migration SQL | `ALTER TABLE frequence_citations ADD COLUMN categorie` |
| `src/pages/AdminFrequences.tsx` | Filtre catégorie, badge, formulaire étendu |
| `src/components/community/FrequenceWave.tsx` | Onglets 3 catégories, sélection par catégorie |
| `supabase/functions/suggest-citations/index.ts` | Prompt adapté selon catégorie |
| `src/integrations/supabase/types.ts` | Régénéré automatiquement |

### Design du composant marcheur

```text
┌──────────────────────────────────────────┐
│ MA FRÉQUENCE DU JOUR                     │
│ [📖] [🌿] [🎧]                          │
│                                          │
│ « Le lierre est l'une des dernières      │
│   plantes à fleurir en automne... »      │
│                        — INPN 🔗         │
└──────────────────────────────────────────┘
```

Les trois icônes sont des onglets discrets. L'onglet actif est souligné avec la couleur du rôle. Le contenu change avec une animation fade.

