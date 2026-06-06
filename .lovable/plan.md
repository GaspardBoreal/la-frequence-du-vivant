# Onglet « Recherches » dans `/admin/community`

Ajouter un nouvel onglet **Recherches** entre **Activités** et **Affiliation marcheurs** pour consulter et analyser la table `search_logs` (alimentée par la RPC `log_search`).

## Emplacement

`src/pages/CommunityProfilesAdmin.tsx` — insertion d'un `TabsTrigger value="recherches"` après « Activités » et avant « Affiliation marcheurs », plus un `TabsContent` correspondant.

## Composant

Nouveau fichier `src/components/admin/community/RecherchesPanel.tsx` (cohérent avec `ProfilsPanel.tsx`, `ActivityDashboard`, etc.).

### Données affichées (depuis `search_logs`)

1. **Cartes KPI** (7 derniers jours vs 30 jours) :
   - Total recherches
   - Recherches uniques (DISTINCT `query` normalisé lower+unaccent)
   - Marcheurs actifs (DISTINCT `user_id`)
   - Taux de clic (`clicked_kind IS NOT NULL` / total)
   - Recherches « 0 résultat » (% et nombre)

2. **Top requêtes** (table triable) : query normalisée, occurrences, résultats moyens, taux de clic, dernière occurrence.

3. **Requêtes infructueuses** (`results_count = 0`) : liste à fort signal produit — opportunités de contenu manquant ou d'amélioration du `search_global`.

4. **Répartition par `clicked_kind`** : species / practice / testimony / text / marcheur / event (barres horizontales simples).

5. **Répartition par `scope`** : global / event / admin.

6. **Flux temps réel** (50 dernières recherches) : `created_at`, `prenom nom`, `query`, `results_count`, `clicked_kind`, `route` (lien cliquable interne).

### Filtres globaux du panel

- Période : 24 h / 7 j / 30 j / 90 j (par défaut 7 j)
- Scope : tous / global / event / admin
- Recherche texte (filtre client sur `query`)

## Détails techniques

- **Pas de nouvelle RPC nécessaire** : `search_logs` est déjà accessible côté admin via les policies existantes (à vérifier — si lecture restreinte, créer une RPC `get_search_logs_admin(p_from, p_to, p_scope)` `SECURITY DEFINER` gardée par `has_role(auth.uid(),'admin')`). Cf. mémoire « Edge function auth ».
- Hook dédié `src/hooks/useSearchLogs.ts` (React Query, `staleTime: 60_000`).
- Normalisation des queries (lower + trim + `unaccent` côté client pour le top) pour regrouper « Tonte », « tonte », « tonté ».
- Pagination simple côté client (top 50 / flux 50). Pas d'export demandé pour l'instant.
- Suit la mémoire **Sobriété informationnelle** : layout minimal, cartes claires, pas de banner pédagogique.

## Vérification

- `/admin/community` → onglet **Recherches** apparaît entre Activités et Affiliation marcheurs.
- Les KPI 7 j collent au contenu actuel (`tonte`, `dendro`, `Hup`, `consoude`…).
- Cliquer sur une ligne du flux ouvre la `route` dans un nouvel onglet.
- Aucune régression visuelle sur les autres onglets.

## Hors scope

- Export CSV (peut être ajouté plus tard si besoin)
- Graphique d'évolution temporelle (peut être ajouté en v2)
- Action de suppression de logs
