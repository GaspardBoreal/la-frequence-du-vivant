

# Supprimer un participant — bouton rapide dans le tableau

## Changement

Ajouter un bouton **corbeille** (icone `Trash2`) sur chaque ligne du tableau des participants dans `MarcheEventDetail.tsx`. Au clic, une confirmation via `ConfirmDeleteDialog` (deja existant dans le projet), puis suppression de la ligne dans `marche_participations` par `id`.

## Implementation

### 1. Mutation `deleteParticipant`

```typescript
const deleteParticipant = useMutation({
  mutationFn: async (participationId: string) => {
    const { error } = await supabase
      .from('marche_participations')
      .delete()
      .eq('id', participationId);
    if (error) throw error;
  }
});
```

### 2. Colonne "Actions" dans le tableau

Ajouter un `TableHead` vide + un `TableCell` avec bouton `Trash2` rouge discret sur chaque ligne. Au clic, ouvrir le `ConfirmDeleteDialog` avec le nom du participant.

### 3. State pour le dialog

```typescript
const [deletingParticipation, setDeletingParticipation] = useState<{id: string, name: string} | null>(null);
```

## Fichier impacte

| Fichier | Action |
|---|---|
| `src/pages/MarcheEventDetail.tsx` | Ajouter colonne Actions, mutation delete, dialog confirmation |

