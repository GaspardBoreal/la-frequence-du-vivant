# Traiter les alertes API depuis l'espace admin

Aujourd'hui la bannière signale qu'une API critique décroche (iNaturalist, Lovable AI Gateway), mais elle ne mène qu'à un tableau de bord en lecture seule : aucun geste possible, aucune trace de ce qui a été fait. On ajoute deux choses, et rien de plus : **relancer la collecte** et **garder l'historique**.

## Ce que l'admin verra

### 1. Un bouton « Relancer la collecte »

Sur la carte de chaque API en orange ou rouge (et dans le tiroir de détail) apparaît un bouton d'action, absent quand tout est vert.

- Un clic lance la mise à jour réelle des données concernées :
  - **iNaturalist** : relance de la synchronisation des relevés de biodiversité.
  - **Lovable AI Gateway** : relance de la classification des étiquettes écologiques d'espèces.
  - Les API sans relance possible affichent simplement « pas de relance automatique » (bouton grisé, avec l'explication).
- Pendant l'exécution : bouton en attente, message « relance en cours… ».
- À la fin : message clair de réussite (avec ce qui a été mis à jour) ou d'échec (avec le motif réel renvoyé, en français), puis rafraîchissement immédiat des indicateurs de santé.
- Sécurité : action réservée aux admins, contrôlée côté serveur.

### 2. Un journal « Historique des incidents »

Nouvel onglet dépliable en bas de la page API & MCP, et rappel des 3 dernières lignes dans le tiroir de chaque API.

Chaque ligne indique : date et heure, API concernée, état au moment de l'action (orange/rouge), qui a agi, l'action menée, le résultat (réussite/échec) et le motif en cas d'échec. Filtres simples : par API et par état. Les lignes sont créées automatiquement à chaque relance — rien à saisir.

## Ce qui ne change pas

- Les seuils restent ceux d'aujourd'hui (orange au-delà de 24 h, rouge au-delà de 72 h).
- Aucune relance automatique planifiée : tout part d'un geste de l'admin.
- La page publique API & MCP n'est pas modifiée (ni bouton, ni journal).
- Aucun calcul de santé existant n'est touché.

## Détails techniques

**Base de données** (migration)

- Table `public.api_mcp_incidents` : `id`, `slug` (texte, API du registre), `status_at_action` (texte), `action` (texte, ex. `relance`), `outcome` (`success` | `error`), `detail` (texte, motif ou résumé), `freshness_before` (timestamptz, nullable), `triggered_by` (uuid), `created_at`.
- `GRANT SELECT ON public.api_mcp_incidents TO authenticated;` `GRANT ALL ... TO service_role;` puis RLS activée : lecture réservée aux admins via `public.has_role(auth.uid(), 'admin')` (aligné sur les policies existantes du registre), écriture uniquement par la fonction serveur (service role).
- Index sur `(slug, created_at desc)`.

**Fonction serveur** `supabase/functions/api-mcp-remediate/index.ts`

- Auth via le helper partagé `_shared/auth-helper.ts` + vérification du rôle admin (403 sinon).
- Table de correspondance fermée, côté serveur uniquement :
  `inaturalist → sync-biodiversity-snapshot`, `lovable-ai → classify-species-eco-tags`. Tout autre slug → 400 « aucune relance disponible ».
- Lit la fraîcheur avant action, invoque la fonction cible avec le service role, capte réussite/erreur, insère la ligne d'incident, renvoie `{ ok, detail }`.
- Déclarée `verify_jwt = true` dans `supabase/config.toml`.

**Frontend**

- `src/hooks/useApiMcpRemediate.ts` : mutation React Query, invalide `['api-mcp-health']` et `['api-mcp-incidents']`, retours en toast français.
- `src/hooks/useApiMcpIncidents.ts` : lecture paginée (50 dernières), filtre optionnel par slug.
- `src/components/api-mcp/ApiRemediateButton.tsx` : bouton d'action (états repos / en cours / résultat).
- `src/components/api-mcp/ApiIncidentsLog.tsx` : tableau du journal, compact et lisible sur mobile.
- `ApiCard.tsx` / `ApiStoryDrawer.tsx` : afficher le bouton uniquement en mode admin (`showHealth`) et si l'état est orange/rouge ; rappel des 3 derniers incidents dans le tiroir.
- `AdminApiMcp.tsx` : ajout du journal sous la grille.
- Couleurs et espacements via les tokens sémantiques existants.

**Vérification**

- Compilation TypeScript propre.
- Relance de test sur iNaturalist depuis la page admin, lecture du journal de la fonction, puis contrôle que l'indicateur repasse au vert et que la ligne d'historique s'affiche.
