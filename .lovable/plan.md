

# Associer les marcheurs a une Exploration ET a des Marches

## Situation actuelle

Deux systemes deconnectes :
- **`exploration_marcheurs`** : equipe editoriale manuelle (Gaspard Boreal & co), liee a une **exploration**, non liee a `auth.users`
- **`marche_participations`** : marcheurs communautaires (inscrits via connexion), lies a des **marche_events**, sans lien avec une exploration

Le chainon manquant : `marche_events` n'a pas de colonne `exploration_id`. On ne sait pas a quelle exploration appartient un evenement de marche.

## Solution

Ajouter `exploration_id` a la table `marche_events`. Ainsi, quand un marcheur s'inscrit a un evenement, il est automatiquement lie a la marche ET a l'exploration.

```text
exploration
  └── marche_events (via exploration_id)  ← NOUVEAU
        └── marche_participations (via marche_event_id)
              └── community_profiles (via user_id)
```

## Changements

### 1. Migration DB

```sql
ALTER TABLE marche_events 
  ADD COLUMN exploration_id uuid REFERENCES explorations(id);
```

Pas de NOT NULL pour ne pas casser les evenements existants.

### 2. Admin — `MarcheEventsAdmin.tsx`

Ajouter un selecteur d'exploration lors de la creation/edition d'un evenement de marche. Champ optionnel.

### 3. Espace marcheur — `MarchesTab.tsx`

Afficher le nom de l'exploration a cote de chaque evenement (si renseignee). Permet au marcheur de voir a quelle exploration il contribue.

### 4. `useCommunityProfile.ts`

Enrichir la requete des participations pour inclure `marche_events(title, date_marche, lieu, exploration_id, explorations(name))` — afficher l'exploration associee.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter `exploration_id` a `marche_events` |
| `src/pages/MarcheEventsAdmin.tsx` | Selecteur exploration dans le formulaire |
| `src/components/community/tabs/MarchesTab.tsx` | Afficher nom exploration |
| `src/hooks/useCommunityProfile.ts` | Enrichir select avec exploration |

## Ce que cela ne change PAS

- `exploration_marcheurs` reste intact pour l'equipe editoriale
- `community_profiles` reste inchange
- Les participations existantes continuent de fonctionner (colonne nullable)

