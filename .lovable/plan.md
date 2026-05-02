## Objectif

Reproduire à l'identique l'onglet **Profils** (mosaïque + dashboard d'impact) de `/admin/community` dans `/admin/marche-events`, avec un code **factorisé** : un seul jeu de composants servant les deux pages, pour que tout ajout fonctionnel futur s'applique automatiquement aux deux.

## Analyse de l'existant

L'onglet "Profils" actuel dans `CommunityProfilesAdmin.tsx` est déjà presque entièrement factorisé :

- `ProfilsImpactDashboard` (compteurs animés + pyramide âges + donut genres + treemap CSP) — **autonome**, alimenté par le hook `useCommunityImpactAggregates` (RPC `get_community_impact_aggregates`).
- `ProfilsMosaique` — reçoit `profiles` + `onEdit` en props, gère ses propres filtres internes (recherche, âge, genre, CSP, rôle).
- `MarcheurEditSheet` — sheet d'édition, pilotée par état `editing`/`editOpen`.

Le seul "glue code" non factorisé dans `CommunityProfilesAdmin` est :
1. La requête `community-profiles-admin` qui charge `community_profiles`.
2. L'état local `editing/editOpen` + la fonction `openEditor`.
3. Le rendu du `<MarcheurEditSheet>`.
4. Le header "Qui marche avec nous ?".

## Stratégie de factorisation

Créer **un composant unique réutilisable** qui encapsule tout le bloc "Profils" (header + dashboard + mosaïque + sheet d'édition + chargement des données). Les deux pages l'importent tel quel.

### Nouveau composant

**`src/components/admin/community/ProfilsPanel.tsx`**

Responsabilités (extraites depuis `CommunityProfilesAdmin`) :
- Charger `community_profiles` via React Query (clé `community-profiles-admin` — partagée pour bénéficier du cache).
- Gérer l'état `editing` / `editOpen`.
- Rendre, dans cet ordre :
  - Header "Qui marche avec nous ?" + sous-titre (props `title` / `subtitle` optionnelles pour personnaliser si besoin, défaut = textes actuels).
  - `<ProfilsImpactDashboard />`
  - `<ProfilsMosaique profiles={...} onEdit={openEditor} />`
  - `<MarcheurEditSheet open={editOpen} onOpenChange={setEditOpen} profile={editing} />` (même invalidation de queries qu'aujourd'hui).

Aucun nouveau hook réseau n'est créé : `ProfilsImpactDashboard` et `ProfilsMosaique` restent inchangés.

### Refactor `CommunityProfilesAdmin.tsx`

Remplacer le contenu actuel du `TabsContent value="profils"` par `<ProfilsPanel />`. Supprimer de la page :
- L'état `editing` / `editOpen` / `openEditor` **uniquement s'il n'est plus utilisé ailleurs**. Vérification : `openEditor` est aussi appelé depuis l'onglet "Communauté" (bouton Éditer dans la table). On garde donc l'état + le `<MarcheurEditSheet>` au niveau page pour l'onglet Communauté, et `ProfilsPanel` gère son propre `MarcheurEditSheet` interne (deux instances n'entrent pas en conflit puisqu'une seule est ouverte à la fois). Comportement identique pour l'utilisateur.

### Ajout dans `MarcheEventsAdmin.tsx`

- Importer `ProfilsPanel`.
- Ajouter un 5ᵉ onglet `profils` dans la `TabsList` (icône `Sparkles`, label "Profils"), géré via le param URL `?tab=profils` (la page utilise déjà `useSearchParams` pour les onglets).
- Ajuster la grille de la `TabsList` : `grid-cols-4` → `grid-cols-5`.
- Ajouter un `<TabsContent value="profils"><ProfilsPanel /></TabsContent>`.

Le `EventsKpiBanner` et `EventsFiltersBar` restent affichés au-dessus des onglets — comportement actuel inchangé pour les autres onglets. Pour l'onglet Profils, ces filtres ne s'appliquent pas (les profils ne sont pas filtrables par type/statut d'événement), ce qui est cohérent : ils sont simplement ignorés par `ProfilsPanel` qui a ses propres filtres internes.

## Garantie d'identité parfaite

Puisque les deux pages rendent **exactement le même composant `<ProfilsPanel />`** :
- Les compteurs, chartes, mosaïque, filtres, sheet d'édition sont littéralement le même code.
- Tout ajout futur (nouveau KPI, nouveau filtre, nouvelle colonne, nouvelle action) se fait dans `ProfilsPanel` (ou ses enfants) et apparaît instantanément dans les deux pages.
- Le cache React Query (`community-profiles-admin`, `community-impact-aggregates`) est partagé, donc pas de double fetch quand on navigue entre les deux pages.

## Fichiers touchés

- **Créé** : `src/components/admin/community/ProfilsPanel.tsx` (~80 lignes — extraction directe).
- **Modifié** : `src/pages/CommunityProfilesAdmin.tsx` — `TabsContent value="profils"` remplacé par `<ProfilsPanel />`.
- **Modifié** : `src/pages/MarcheEventsAdmin.tsx` — ajout d'un onglet "Profils" + `<TabsContent>` correspondant, `grid-cols-4` → `grid-cols-5`.

Aucune migration SQL, aucun changement de hook ou d'API. Risque de régression minimal : la logique d'origine est déplacée bit-pour-bit, pas réécrite.
