

## Synchroniser le snapshot à chaque ouverture de l'onglet Vivant

### Problème

- **VivantTab** appelle `biodiversity-data` en temps réel (GPS) → voit 3 Animalia (dont la punaise identifiée hier)
- **EventBiodiversityTab** (Empreinte) lit `biodiversity_snapshots` → snapshot du 02/04, figé à 2 Animalia
- Les chiffres divergent systématiquement après chaque nouvelle observation

### Solution : VivantTab met à jour le snapshot après chaque appel live

Quand VivantTab reçoit les données live de `biodiversity-data`, il **écrit silencieusement** le résultat dans `biodiversity_snapshots` via un upsert (edge function). Ainsi l'Empreinte est toujours à jour.

### Architecture

```text
VivantTab ouvre
  → appel live biodiversity-data (GPS, 0.5km)
  → affiche les espèces en temps réel (3 Animalia) ✓
  → appel silencieux sync-biodiversity-snapshot (marcheId, speciesData, summary)
      → UPSERT biodiversity_snapshots pour ce marche_id
      → met à jour snapshot_date, species_data, compteurs
  → invalidation du cache 'event-biodiversity-snapshots'
  → Empreinte = 3 Animalia ✓
```

### Étapes

**1. Nouvelle edge function `sync-biodiversity-snapshot`**

Reçoit `{ marcheId, latitude, longitude, speciesData, summary, methodology }` et fait un upsert dans `biodiversity_snapshots` :
- Supprime l'ancien snapshot le plus récent pour ce `marche_id`
- Insère le nouveau avec la date du jour
- Pas de rate-limiting (c'est un sync, pas une collecte)
- Accessible à tout utilisateur authentifié (lecture publique des données biodiv)

**2. Modifier VivantTab**

Après réception réussie de `biodiversityData` :
- Appeler `sync-biodiversity-snapshot` en arrière-plan (fire-and-forget, pas bloquant pour l'UX)
- Sur succès, invalider le cache `['event-biodiversity-snapshots']` pour que l'Empreinte se rafraîchisse
- Afficher un discret indicateur de sync (petit badge "Données synchronisées" qui disparaît après 2s)

**3. UX soignée**

- L'appel sync est silencieux : aucun loader, aucun blocage
- Si le sync échoue, aucun impact sur l'affichage de VivantTab (les données live sont déjà affichées)
- Un toast discret optionnel "Empreinte mise à jour" confirme la synchronisation
- Les compteurs dans toutes les vues (Carte, Marches, Empreinte, Carnet) se mettent à jour automatiquement via l'invalidation du cache React Query

### Fichiers

| Action | Fichier |
|--------|---------|
| Créer | `supabase/functions/sync-biodiversity-snapshot/index.ts` |
| Modifier | `src/components/community/MarcheDetailModal.tsx` (VivantTab) |
| Modifier | `supabase/config.toml` (déclarer la nouvelle function) |

### Sécurité

- La function vérifie que le `marche_id` existe dans la table `marches`
- Authentification requise (JWT)
- Les données envoyées proviennent de la même source (`biodiversity-data`) que `collect-event-biodiversity`

