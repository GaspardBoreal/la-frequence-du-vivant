

## Remplacer les badges sémantiques par le vrai type de marche

### Problème

Les badges actuels ("Biodiversité", "Bioacoustique", "Géopoétique") sont détectés par analyse textuelle du titre (`detectPillars`). Or le champ `event_type` existe déjà dans `marche_events` avec les valeurs `agroecologique`, `eco_poetique`, `eco_tourisme` — et le registre de métadonnées `marcheEventTypeMeta` fournit déjà labels, icônes et couleurs.

### Solution

1. **`src/hooks/useCommunityProfile.ts`** — Ajouter `event_type` dans le select de la requête participations :
   ```
   marche_events(title, date_marche, lieu, exploration_id, event_type, explorations(name))
   ```

2. **`src/components/community/CarnetVivant.tsx`** :
   - Mettre à jour l'interface `Participation` pour inclure `event_type?: string` dans `marche_events`
   - Supprimer la fonction `detectPillars`
   - Remplacer le bloc des badges par un unique badge basé sur `getMarcheEventTypeMeta(event.event_type)` :
     - **Agroécologique** : icône Sprout, couleurs emerald (primary)
     - **Éco poétique** : icône BookOpenText, couleurs secondary (violet/rose)
     - **Éco tourisme** : icône Trees, couleurs accent (ambre/bois)
   - Si aucun type, ne pas afficher de badge (au lieu du fallback "Biodiversité")

3. **Responsive** — Les badges sont déjà en `flex-wrap` avec `text-[10px]` et `px-2 py-0.5`, parfaitement adaptés mobile/tablette/desktop. Le passage d'un à trois badges possibles vers un unique badge simplifie encore l'affichage sur petits écrans.

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifier | `src/hooks/useCommunityProfile.ts` (ajouter `event_type` au select) |
| Modifier | `src/components/community/CarnetVivant.tsx` (supprimer `detectPillars`, utiliser `getMarcheEventTypeMeta`) |

