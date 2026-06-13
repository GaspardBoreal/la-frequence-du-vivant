## Diagnostic

Le formulaire envoie `date_souhaitee: ""` (chaîne vide) au lieu de `null`. Postgres rejette : `invalid input syntax for type date: ""` (code 22007). L'opportunité n'est donc jamais créée — d'où la liste vide.

Console log confirmé :
```
Error creating opportunity: invalid input syntax for type date: ""
  at handleFormSubmit (CrmPipeline.tsx:59)
```

Le toast d'erreur s'affiche mais le message technique n'est pas explicite, ce qui a masqué le vrai problème.

## Correctif

Dans `src/pages/CrmPipeline.tsx`, normaliser le payload avant `createOpportunity` / `updateOpportunity` :

1. `date_souhaitee` : `""` → `null`
2. `assigned_to` : `""` → `null` (uuid)
3. Champs texte optionnels (`fonction`, `telephone`, `experience_souhaitee`, `format_souhaite`, `lieu_prefere`, `objectifs`, `financement_souhaite`, `source`, `notes`, `entreprise`) : `""` → `null`
4. Numériques (`budget_estime`, `nombre_participants`) : `NaN`/`undefined`/`""` → `null`

Une petite fonction `sanitizeOpportunityPayload(payload)` appliquée dans `handleFormSubmit` avant les mutations.

Aucun changement DB, aucun changement de schéma. Pas de migration.

## Vérification

- Saisir une opportunité sans date → doit créer la ligne et l'afficher dans la liste/kanban.
- Console doit être vierge d'erreur 22007.
