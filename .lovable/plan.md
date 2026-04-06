

## Système de logs d'activité des marcheurs — Tableau de bord stratégique

### Architecture

Deux composantes : **collecte** (hook client-side qui enregistre chaque navigation) et **consultation** (tableau de bord admin enrichi dans `/admin/community`).

### 1. Table `marcheur_activity_logs`

```sql
CREATE TABLE marcheur_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,        -- 'page_view', 'tab_switch', 'media_upload', 'tool_use'
  event_target text NOT NULL,      -- ex: 'exploration:607a0ae3', 'tab:empreinte', 'outil:quiz'
  exploration_id uuid,             -- nullable, pour filtrer par exploration
  marche_event_id uuid,            -- nullable, pour filtrer par événement
  metadata jsonb DEFAULT '{}',     -- device info, viewport, sous-onglet, etc.
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_user ON marcheur_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON marcheur_activity_logs(event_type, created_at DESC);
```

RLS : INSERT pour `authenticated`, SELECT réservé aux admins via `check_is_admin_user`.

### 2. Hook `useActivityTracker`

Un hook léger (`src/hooks/useActivityTracker.ts`) qui expose une fonction `trackActivity(eventType, eventTarget, metadata?)`. Il :
- Récupère `user_id` via la session Supabase
- Ajoute automatiquement `user_agent`, `viewport`, `timestamp`
- Fait un INSERT asynchrone (fire-and-forget, pas bloquant)
- Déduplique les vues rapides (debounce 2s pour éviter les doublons sur les switches d'onglets)

### 3. Points d'instrumentation

| Composant | Événement tracké |
|-----------|-----------------|
| `ExplorationMarcheurPage` | `page_view` + `exploration_id` à l'ouverture |
| Onglets globaux (Carte, Marches, Empreinte, Apprendre, Marcheurs, Messages) | `tab_switch` + nom de l'onglet |
| Sous-onglets Apprendre (Biodiversité, Bioacoustique, Géopoétique) | `tab_switch` + `apprendre:biodiversite` etc. |
| `MarcheDetailModal` | `marche_view` + `marche_event_id` |
| Upload média (photo/son/texte) | `media_upload` + type |
| Outils (Zones, Quiz, Sons, Kigo) | `tool_use` + nom de l'outil |
| Connexion (auth state change) | `session_start` + device info |

### 4. Fonction RPC `get_marcheur_activity_dashboard`

Une fonction SQL `SECURITY DEFINER` qui retourne les agrégats pour le tableau de bord admin :

- **Par marcheur** : dernière connexion, nombre de sessions (jours distincts), onglets les plus visités, médias uploadés (compteurs photo/son/texte), explorations consultées
- **Global** : onglets les plus populaires, heures de pointe, médias uploadés par type d'événement (agroéco/écopoétique/écotourisme), taux d'engagement (sessions/marcheur/semaine)

### 5. Enrichissement de `/admin/community`

La page `CommunityProfilesAdmin` gagne un **3ème bloc** sous l'affiliation : le tableau de bord d'activité.

**Vue synthétique** (cards en haut) :
- Sessions actives (7 derniers jours)
- Médias uploadés cette semaine
- Onglet le plus populaire
- Marcheur le plus actif

**Tableau détaillé par marcheur** :
| Marcheur | Dernière connexion | Sessions (7j) | Onglets favoris | Photos | Sons | Textes | Explorations vues |
|---|---|---|---|---|---|---|---|

**Vue par exploration/type d'événement** :
- Nombre de vues par exploration
- Répartition par type (Agroéco / Écopoétique / Écotourisme)
- Compteurs de contributions par volet — données directement exploitables pour les dossiers partenaires

**Timeline d'activité** :
- Flux chronologique des dernières actions (les 50 plus récentes) avec filtre par marcheur

### 6. Fichiers impactés

| Action | Fichier |
|--------|---------|
| Créer | Migration SQL (table + RLS + RPC) |
| Créer | `src/hooks/useActivityTracker.ts` |
| Modifier | `src/components/community/ExplorationMarcheurPage.tsx` (instrumentation onglets) |
| Modifier | `src/components/community/MarcheDetailModal.tsx` (instrumentation marche + uploads) |
| Modifier | `src/components/community/insights/ApprendreTab.tsx` (sous-onglets) |
| Modifier | `src/pages/CommunityProfilesAdmin.tsx` (nouveau bloc dashboard) |
| Créer | `src/components/admin/ActivityDashboard.tsx` (composant tableau de bord) |

### Stratégie de lancement pour les 10 marcheurs

Le système sera opérationnel dès le week-end : chaque ouverture d'exploration, chaque clic sur un onglet, chaque upload sera capturé. Vous pourrez en temps réel voir quels marcheurs sont actifs, quels contenus les attirent, et compiler les données d'engagement par type de marche pour vos partenaires financeurs.

