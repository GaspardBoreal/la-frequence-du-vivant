

# Plan : Gestion des Parties dans la section "Orchestrer"

## Contexte et Objectif

Vous souhaitez structurer votre recueil "Fréquence de la rivière Dordogne" (16 marches, ~49 textes) en **3 mouvements littéraires** pour les éditeurs nationaux :

| Partie | Titre | Marches | Textes | Ratio |
|--------|-------|---------|--------|-------|
| I | LE CONTRE-COURANT | 1 à 9 | ~36 | 60% |
| II | LE POINT DE BASCULE | 10 à 16 | ~11 | 25% |
| III | LE NOUVEAU PACTE | 17-18 (Mont-Dore + Trémolat) | 2 | 15% |

Actuellement, la base de données ne gère que l'ordre séquentiel des marches (`ordre`), sans notion de regroupement en sections.

---

## Architecture technique proposée

### Option retenue : Nouvelle table `exploration_parties`

Cette approche est la plus propre et extensible pour gérer des structures éditoriales complexes.

```text
┌─────────────────────────────────────────────────────────────┐
│                    exploration_parties                       │
├─────────────────────────────────────────────────────────────┤
│ id              │ uuid        │ PK                          │
│ exploration_id  │ uuid        │ FK → explorations           │
│ titre           │ text        │ "LE CONTRE-COURANT"         │
│ sous_titre      │ text        │ "L'Observation" (optionnel) │
│ numero_romain   │ text        │ "I", "II", "III"            │
│ ordre           │ integer     │ Position de la partie       │
│ couleur         │ text        │ Code couleur (optionnel)    │
│ description     │ text        │ Notes internes              │
│ created_at      │ timestamptz │                             │
│ updated_at      │ timestamptz │                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  exploration_marches                         │
│                  (modification)                              │
├─────────────────────────────────────────────────────────────┤
│ ...colonnes existantes...                                   │
│ partie_id       │ uuid        │ FK → exploration_parties    │
│                 │             │ (nullable pour migration)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Étapes d'implémentation

### Étape 1 : Migration base de données

Créer la table `exploration_parties` et ajouter la colonne `partie_id` à `exploration_marches`.

```sql
-- Nouvelle table pour les parties
CREATE TABLE exploration_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL REFERENCES explorations(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  sous_titre TEXT,
  numero_romain TEXT NOT NULL DEFAULT 'I',
  ordre INTEGER NOT NULL DEFAULT 1,
  couleur TEXT DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_exploration_parties_exploration ON exploration_parties(exploration_id);

-- RLS policies
ALTER TABLE exploration_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view exploration_parties"
  ON exploration_parties FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert exploration_parties"
  ON exploration_parties FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated users can update exploration_parties"
  ON exploration_parties FOR UPDATE USING (true);

CREATE POLICY "Only authenticated users can delete exploration_parties"
  ON exploration_parties FOR DELETE USING (true);

-- Ajout de la colonne partie_id à exploration_marches
ALTER TABLE exploration_marches 
ADD COLUMN partie_id UUID REFERENCES exploration_parties(id) ON DELETE SET NULL;
```

### Étape 2 : Hooks React pour les parties

Créer `src/hooks/useExplorationParties.ts` :

- `useExplorationParties(explorationId)` - Lecture des parties
- `useCreateExplorationPartie()` - Création d'une partie
- `useUpdateExplorationPartie()` - Modification
- `useDeleteExplorationPartie()` - Suppression
- `useAssignMarcheToPartie()` - Assigner une marche à une partie
- `useReorderParties()` - Réordonner les parties

### Étape 3 : Composant de gestion des parties

Créer `src/components/admin/ExplorationPartiesManager.tsx` :

```text
┌────────────────────────────────────────────────────────────────┐
│  ⚡ Structurer en Parties                           [+ Partie] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ I. LE CONTRE-COURANT                          [⋮] [✎] │  │
│  │    L'Observation                                        │  │
│  │    ────────────────────────────────────────────────     │  │
│  │    ○ Bec d'Ambès (3 textes)                    [×]     │  │
│  │    ○ Fronsac (3 textes)                        [×]     │  │
│  │    ○ Libourne (5 textes)                       [×]     │  │
│  │    ... (9 marches au total)                             │  │
│  │    ┌─────────────────────────────────────┐             │  │
│  │    │ + Glisser une marche ici            │             │  │
│  │    └─────────────────────────────────────┘             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ II. LE POINT DE BASCULE                       [⋮] [✎] │  │
│  │     La Friction                                         │  │
│  │     ────────────────────────────────────────────────    │  │
│  │     ○ Argentat (1 texte)                       [×]     │  │
│  │     ○ Chalvignac (3 textes)                    [×]     │  │
│  │     ... (7 marches au total)                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ III. LE NOUVEAU PACTE                         [⋮] [✎] │  │
│  │      La Législation                                     │  │
│  │      ────────────────────────────────────────────────   │  │
│  │      ○ Mont-Dore (3 textes)                    [×]     │  │
│  │      ○ Trémolat - La Mue du Dragon (4 textes)  [×]     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 📦 Marches non assignées                                │  │
│  │    (aucune)                                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Fonctionnalités clés :**

1. **Création de partie** : Modale avec titre, sous-titre, numéro romain, couleur
2. **Drag-and-drop inter-parties** : Déplacer une marche d'une partie à une autre
3. **Réordonnancement des parties** : Monter/descendre une partie
4. **Prévisualisation** : Afficher le ratio textes par partie
5. **Marches orphelines** : Zone pour les marches non encore assignées

### Étape 4 : Intégration dans ExplorationMarchesAdmin

Modifier `src/pages/ExplorationMarchesAdmin.tsx` pour ajouter un onglet ou une section "Structurer en Parties" au-dessus de la liste des marches :

```text
┌──────────────────────────────────────────────────────────────┐
│  Orchestre de Marches                                        │
│  Fréquence de la rivière Dordogne                            │
├──────────────────────────────────────────────────────────────┤
│  [Séquence]  [Parties]  [Statuts]                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  (Contenu selon l'onglet actif)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Étape 5 : Export Word avec parties

Modifier `src/utils/wordExportUtils.ts` pour :

1. Récupérer les parties associées à l'exploration
2. Générer des pages de garde pour chaque partie (titre en grande typographie)
3. Regrouper les marches/textes sous leur partie respective
4. Mettre à jour les index avec la structure en parties

---

## Fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| Migration SQL | Créer | Table `exploration_parties` + colonne `partie_id` |
| `src/hooks/useExplorationParties.ts` | Créer | Hooks CRUD pour les parties |
| `src/components/admin/ExplorationPartiesManager.tsx` | Créer | Interface de gestion des parties |
| `src/components/admin/PartieCard.tsx` | Créer | Carte visuelle d'une partie avec ses marches |
| `src/components/admin/PartieFormModal.tsx` | Créer | Modale de création/édition de partie |
| `src/pages/ExplorationMarchesAdmin.tsx` | Modifier | Ajouter onglet/section "Parties" |
| `src/utils/wordExportUtils.ts` | Modifier | Intégrer les parties dans l'export |
| `src/types/exploration.ts` | Modifier | Ajouter interface `ExplorationPartie` |

---

## Impact sur l'export Word

Avec cette structure, l'export "Par marche / lieu" deviendra :

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                         I.

              LE CONTRE-COURANT
                L'Observation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bec d'Ambès
────────────
Haïku XYZ...

Fronsac  
────────────
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                        II.

              LE POINT DE BASCULE
                 La Friction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...
```

---

## Complexité estimée

| Composant | Effort |
|-----------|--------|
| Migration BDD | Faible |
| Hooks React | Moyen |
| UI Parties Manager | Élevé (drag-and-drop complexe) |
| Intégration page admin | Moyen |
| Export Word adapté | Moyen |
| **Total** | **~4-5 heures de développement** |

---

## Bénéfices

1. **Éditeurs** : Structure professionnelle visible dès la table des matières
2. **Flexibilité** : Réorganiser les parties sans toucher à l'ordre des marches
3. **Réutilisable** : Applicable à toutes les futures explorations
4. **Export pro** : Pages de garde automatiques par mouvement

