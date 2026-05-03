## Problème

Dans **Marches → Écouter** (modal d'une marche), les sons d'un marcheur (`marcheur_audio`) apparaissent sur **toutes les étapes du même événement**, alors qu'ils sont attachés à une étape précise (`marche_id`).

Cause : `MarcheurAudioPanel` ne filtre `ownerAudio` que par `marche_event_id` — il ignore `activeMarcheId`. Les audios admin (`marche_audio`), eux, sont déjà filtrés par `marche_id` (donc OK étape 1 vs 2), mais les sons utilisateurs ne le sont pas.

La table `marcheur_audio` possède bien la colonne `marche_id` (3/3 lignes renseignées). On peut donc filtrer proprement.

## Comportement cible

| Vue | Scope attendu pour les sons marcheur |
|-----|--------------------------------------|
| Marches → Écouter (étape précise) | uniquement les sons de **cette étape** (`marche_id = activeMarcheId`) |
| Marcheurs → Marcheurs → Écoute (vue exploration) | tous les sons de l'exploration (inchangé) |

## Changement

**Fichier : `src/components/community/audio/MarcheurAudioPanel.tsx`**

Dans la query `marcheur-panel-owner-audio` :
- Inclure `activeMarcheId` dans la `queryKey`.
- Si `activeMarcheId` est fourni, ajouter `.eq('marche_id', activeMarcheId)` au SELECT.

Aucun changement nécessaire ailleurs : `MarcheDetailModal.EcouterTab` passe déjà `activeMarcheId`, et `MarcheursTab` ne le passe pas (donc comportement exploration préservé).

## Détail technique

```ts
const { data: ownerAudio } = useQuery({
  queryKey: ['marcheur-panel-owner-audio', ownerUserId, ownerCrewId, marcheEventIds, activeMarcheId, sort],
  queryFn: async () => {
    if (!marcheEventIds.length || (!ownerUserId && !ownerCrewId)) return [];
    const orParts: string[] = [];
    if (ownerUserId) orParts.push(`user_id.eq.${ownerUserId}`);
    if (ownerCrewId) orParts.push(`attributed_marcheur_id.eq.${ownerCrewId}`);
    let q = supabase
      .from('marcheur_audio')
      .select('*')
      .in('marche_event_id', marcheEventIds)
      .or(orParts.join(','));
    if (activeMarcheId) q = q.eq('marche_id', activeMarcheId);
    const { data } = await q.order('created_at', { ascending: sort === 'asc' });
    return (data || []).filter((a: any) => a.is_public || (effectiveViewerUserId && a.user_id === effectiveViewerUserId));
  },
  enabled: marcheEventIds.length > 0 && !!(ownerUserId || ownerCrewId),
  staleTime: 30_000,
});
```

## Risque / régressions

- Les sons historiques sans `marche_id` (aucun aujourd'hui : 3/3 OK) seraient cachés en vue étape — acceptable, ils restent visibles dans Marcheurs → Écoute.
- Aucun impact RLS, aucun changement de schéma, aucune migration.
