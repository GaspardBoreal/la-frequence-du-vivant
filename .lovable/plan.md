

# Fix : Participants affichés à 0 malgré des données en base

## Cause racine

La requête Supabase utilise une jointure embarquée :
```ts
.select('*, community_profiles:user_id(prenom, nom, role)')
```

Or il n'existe **aucune clé étrangère directe** entre `marche_participations.user_id` et `community_profiles.user_id`. Les deux pointent vers `auth.users`, mais PostgREST ne peut pas résoudre cette relation indirecte. La requête échoue silencieusement ou retourne une erreur, et `participations` reste `undefined` — d'où le `(0)`.

## Correction

Séparer en **deux requêtes** dans `MarcheEventDetail.tsx` :

1. **Requête participations** : `select('*')` sans jointure embarquée
2. **Requête profils des participants** : récupérer les `community_profiles` correspondants via les `user_id` obtenus

```tsx
// 1. Participations brutes
const { data: participations } = useQuery({
  queryKey: ['marche-participations', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('marche_participations')
      .select('*')
      .eq('marche_event_id', id!);
    if (error) throw error;
    return data;
  },
  enabled: !isNew && !!id,
});

// 2. Profils des participants
const participantUserIds = participations?.map(p => p.user_id) ?? [];
const { data: participantProfiles } = useQuery({
  queryKey: ['participant-profiles', participantUserIds],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('community_profiles')
      .select('user_id, prenom, nom, role')
      .in('user_id', participantUserIds);
    if (error) throw error;
    return data;
  },
  enabled: participantUserIds.length > 0,
});
```

Puis dans le rendu, fusionner les deux :
```tsx
const getProfile = (userId: string) =>
  participantProfiles?.find(p => p.user_id === userId);

// Dans le TableRow :
<TableCell>{getProfile(p.user_id)?.prenom} {getProfile(p.user_id)?.nom}</TableCell>
```

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventDetail.tsx` | Séparer la requête participations en 2 (données + profils), fusionner à l'affichage |

