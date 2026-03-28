

# Visualiser les marches de l'exploration dans la fiche événement admin

## Constat

Dans `MarcheEventDetail.tsx`, le champ "Exploration associée" permet de lier un événement à une exploration, mais l'admin ne voit pas quelles marches composent cette exploration. Il doit aller ailleurs pour le savoir.

## Solution

Ajouter un bloc **conditionnel** (visible uniquement quand une exploration est sélectionnée) juste sous le sélecteur d'exploration, dans la Card "Informations". Ce bloc affiche la liste des marches rattachées via `exploration_marches`, avec leurs infos clés.

```text
  ┌─────────────────────────────────────────┐
  │ Exploration associée: [Les Arbres Gard▾]│
  │                                         │
  │ ┌─ Marches de cette exploration (3) ──┐ │
  │ │                                     │ │
  │ │  1. Nous deux entre vers            │ │
  │ │     📍 Beynac · Dordogne            │ │
  │ │     🏷 Biodiversité · brouillon     │ │
  │ │                                     │ │
  │ │  2. Le souffle des arbres           │ │
  │ │     📍 Sarlat · Dordogne            │ │
  │ │     🏷 Forêt · publiée             │ │
  │ │                                     │ │
  │ │  3. L'eau qui chante               │ │
  │ │     📍 Domme · Dordogne             │ │
  │ │     🏷 Rivière · en cours           │ │
  │ └─────────────────────────────────────┘ │
  └─────────────────────────────────────────┘
```

### Détails de chaque carte-marche

- **Numéro d'ordre** (champ `ordre` de `exploration_marches`)
- **Nom** (`nom_marche` ou ville en fallback)
- **Lieu** (ville, département)
- **Thème principal** + **statut de publication** (badge coloré : brouillon/en cours/publiée)
- **Partie** (si rattachée à une `exploration_parties`, afficher le titre en sous-label)

### Requête

Quand `form.exploration_id` change, une query charge :
```
exploration_marches (exploration_id = X)
  → marches (nom_marche, ville, departement, theme_principal)
  → exploration_parties (titre) via partie_id
```
Triée par `ordre`.

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventDetail.tsx` | Ajouter une query `exploration-marches-preview` conditionnelle sur `form.exploration_id`, et un bloc visuel sous le sélecteur d'exploration affichant les marches en liste compacte avec badges de statut |

