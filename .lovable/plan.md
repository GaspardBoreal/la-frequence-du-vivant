## Problème confirmé

`HAUT ROCHER` (SIREN 491615993) est dans la base mais `latitude/longitude` sont NULL → le filtre `c.latitude && c.longitude` l'exclut de la carte. Aucun mécanisme de rattrapage n'existe : `rg "geocode-crm\|missingGeo\|Géolocaliser" src/` ne retourne rien, et `supabase/functions/geocode-crm-company/` n'existe pas. Les deux plans précédents n'ont jamais été implémentés.

## Correctif (3 fichiers)

### 1. Nouvelle edge function `supabase/functions/geocode-crm-company/index.ts`
- Admin-only : valide JWT + vérifie `has_role(uid, 'admin')` via service-role.
- Input : `{ company_ids?: string[] }`. Si vide → cible toutes les `crm_companies` avec `latitude IS NULL OR longitude IS NULL`.
- Pour chaque entreprise :
  1. Appel `https://api-adresse.data.gouv.fr/search/?q={adresse} {code_postal} {ville}&limit=1` (BAN, gratuit, sans clé).
  2. Fallback : `?q={code_postal} {ville}&type=municipality` si zéro résultat.
  3. `UPDATE crm_companies SET latitude, longitude WHERE id = …`.
- Retour : `{ updated, failed, details: [{siren, status, source}] }`.

### 2. UI bandeau orange dans `src/pages/CrmAnnuaire.tsx`
- Calcul `const missingGeo = companies.filter(c => !c.latitude || !c.longitude)`.
- Bandeau **placé au-dessus du contenu des deux onglets « Entreprises » ET « Carte »** (juste sous la barre de recherche, dans le `<Card>` filtres ou en bandeau indépendant) — c'est ce qui manquait : l'utilisateur est sur Entreprises et ne le voyait pas.
  ```
  ⚠️ N entreprise(s) non géolocalisée(s)   [Géolocaliser maintenant]
  ```
- Click → `supabase.functions.invoke('geocode-crm-company', { body: { company_ids: missingGeo.map(c => c.id) } })`.
- Toast récap + `queryClient.invalidateQueries(['crm-companies'])`.
- Bouton avec `disabled` + spinner pendant la requête.

### 3. Fallback inline dans `supabase/functions/import-companies-batch/index.ts`
- Si `siege.latitude` est null après normalisation API gouv, appel BAN avant `insert` pour que les futurs imports n'aient plus le problème.

## Hors scope
- Pas de nouvelle table/colonne, pas de migration.
- Pas de re-geocoding périodique (cron).
- Pas de cluster Leaflet.
