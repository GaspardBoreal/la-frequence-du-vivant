## Cause racine

L'API `recherche-entreprises.api.gouv.fr` attend le **code INSEE** du département (ex: `33`) et de la région (ex: `75`), pas leur libellé. Or notre dropdown envoie `"GIRONDE"` (label brut de `FRENCH_DEPARTMENTS`). L'API renvoie donc `400 Bad Request` → `FunctionsHttpError` côté client.

Test direct API : `?departement=33&activite_principale=01.21Z` → 200 OK avec résultats. Avec `departement=GIRONDE` → 400.

## Correctifs

### 1. Mapping département/région → code INSEE
Dans `CompanySearchFiltersDrawer.tsx`, remplacer les `<SelectItem value={d}>` par des paires `{ code, label }`. Sources :
- Créer `src/utils/frenchDepartmentsCodes.ts` : tableau `[{ code: '01', label: 'AIN' }, …, { code: '33', label: 'GIRONDE' }, …, '2A', '2B', '971'…'976']` (101 départements + DOM).
- Créer `src/utils/frenchRegionsCodes.ts` : 18 régions avec leur code INSEE (`11` Île-de-France, `75` Nouvelle-Aquitaine, etc.).
- Le `SelectItem` envoie `value=code` mais affiche `label`.

### 2. Guard côté edge function
Dans `search-french-companies/index.ts`, ajouter un `console.log('[search-french-companies] URL:', url)` avant le fetch + logger le `status` HTTP et le body en cas de non-200, pour que la prochaine régression soit immédiatement lisible dans les logs.

### 3. Propager le `detail` API gouv jusqu'au toast UI
L'edge function renvoie déjà `detail` en cas de 502, mais ici c'est un 400 → on retourne actuellement `status: 502` ce qui masque l'info. Renvoyer `status: resp.status` et inclure `detail` brut pour debug.

## Vérification
- Sélectionner Gironde + `01.21Z` → liste de viticulteurs girondins (SCEA, EARL…).
- Sélectionner Nouvelle-Aquitaine seule → résultats régionaux.
- Texte libre seul (`bziiit`) → continue de fonctionner.

## Hors scope
- Phase B (pipeline / devis / IA) tant que l'Annuaire n'est pas stable.
