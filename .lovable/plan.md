# Fix : "Aucun résultat" sur l'Annuaire CRM

## Cause racine
Les edge functions `search-french-companies` et `import-companies-batch` existent dans le code mais **ne sont pas déployées** (appel direct → 404). Elles n'ont pas d'entrée dans `supabase/config.toml`, et l'UI n'affiche pas l'erreur réseau → l'utilisateur voit juste un état vide.

L'API gouv elle-même fonctionne parfaitement (testé en direct, BZIIIT remonte bien).

## Correctifs

### 1. Déployer les edge functions
Ajouter dans `supabase/config.toml` :
```toml
[functions.search-french-companies]
verify_jwt = false

[functions.import-companies-batch]
verify_jwt = false
```
(L'auth est déjà validée dans le code via `validateAuth(req)` — pattern identique aux autres fonctions du projet.)

### 2. Rendre les erreurs visibles dans l'UI
Dans `src/hooks/useCompanySearch.ts` : retirer le `try/catch` silencieux implicite et laisser remonter l'erreur React Query. Dans `src/pages/CrmAnnuaire.tsx` : afficher un encart `Card` rouge avec le message d'erreur quand `error` est défini (plutôt qu'un simple "Aucun résultat"), pour qu'on voie immédiatement les futurs incidents (rate-limit, 502, etc.).

### 3. Garde-fou supplémentaire dans l'edge function
Logger l'URL appelée et le statut HTTP de l'API gouv (`console.log` côté edge) — déjà partiellement en place, on s'assure que ça couvre le cas succès aussi pour faciliter le debug.

## Vérification
- Recharger `/admin/crm/annuaire`, taper "bziiit" → 1 résultat avec carte cliquable et bouton "Importer comme Suspect".
- Test direct edge function via `supabase--curl_edge_functions` doit renvoyer 200 + le résultat normalisé.

## Hors scope
- Phase B (pipeline / devis / IA) — on n'y touche pas tant que l'Annuaire ne fonctionne pas.
