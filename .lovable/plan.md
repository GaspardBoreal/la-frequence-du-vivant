# Refonte CRM — Shell unifié, sidebar Linear-style, Bento Home

Refonte ergonomique complète du CRM : un seul shell d'app avec sidebar verticale persistante, navigation interne sans rechargement, accueil Bento moderne, et nouvelle vue Marches reliée aux entreprises.

## 1. Direction visuelle — « Linear / Vercel Dark Minimal »

Palette dédiée CRM (scopée via `data-crm-shell` pour ne pas polluer le reste de l'app) :
- `--crm-bg: #0a0a0a` (canvas)
- `--crm-surface: #18181b` (cartes)
- `--crm-surface-elevated: #27272a` (hover, sidebar)
- `--crm-border: #27272a / 60%`
- `--crm-text: #fafafa` / `--crm-text-muted: #a1a1aa`
- `--crm-accent: #a78bfa` (violet) + `--crm-accent-glow: #a78bfa / 20%`
- Glassmorphism subtil sur sidebar (`backdrop-blur-xl`, `bg-zinc-900/80`)
- Typographie dense, tabular-nums sur chiffres, micro-interactions framer-motion (200ms ease-out)

## 2. Architecture — Shell unifié

```text
/admin/crm/*  →  <CrmShell>
                    ├─ <CrmSidebar />          (collapsible icon, offcanvas mobile)
                    ├─ <CrmTopBar />           (breadcrumb + search globale + profil)
                    └─ <Outlet />              (route enfant)
```

- Nouveau layout React Router : route parent `/admin/crm` avec `<Outlet />`, enfants : `index` (Accueil), `annuaire`, `pipeline`, `marches` (nouveau), `equipe`, `ia` (stub).
- La sidebar reste montée → transitions instantanées entre vues (pas de remount du shell).
- Sidebar : `collapsible="icon"` desktop (56px ↔ 240px), `offcanvas` mobile via `SidebarTrigger` dans la top bar.
- Persistance état collapsed dans `localStorage` (`crm-sidebar-state`).

### Items sidebar

| Icône | Label | Route | Badge |
|---|---|---|---|
| LayoutDashboard | Accueil | `/admin/crm` | — |
| Building2 | Annuaire | `/admin/crm/annuaire` | nb entreprises |
| Target | Opportunités | `/admin/crm/pipeline` | nb actives |
| CalendarRange | Marches | `/admin/crm/marches` | nb à venir |
| Users | Équipe | `/admin/crm/equipe` | — |
| Sparkles | IA | `/admin/crm/ia` | « Bientôt » |

Footer sidebar : retour `/admin`, toggle collapse, avatar utilisateur.

## 3. Accueil — Bento Grid

Remplace `CrmDashboard.tsx` actuel. Grille 12 colonnes responsive avec tuiles de tailles mixtes :

```text
┌──────────────┬────────┬────────┐
│  Pipeline    │ Suspect│Prospect│
│  Funnel (6) │  (3)  │  (3)  │
│              ├────────┼────────┤
│              │ Client │Contact │
├──────┬───────┤  (3)  │  (3)  │
│Oppor.│Commd. ├────────┴────────┤
│ (3) │ (3)  │  Activité récente │
├──────┼───────┤      (6)         │
│Factu.│ CA   │                  │
│ (3) │ (3)  │                  │
└──────┴───────┴──────────────────┘
```

7 KPI tiles + funnel Suspect→Prospect→Client (recharts) + activity feed. Chaque tile :
- Grand chiffre tabular-nums (text-5xl)
- Label muted, icône violette en haut-droite
- Sparkline 30j discret en bas (sauf stubs)
- Hover : léger glow violet, click → vue détaillée

Commandes / Factures : tiles présentes avec valeur `0` et badge « Bientôt » discret.

## 4. Vues existantes — Reprises telles quelles

- `Annuaire` (`CrmAnnuaire.tsx`) : conservé intégralement (sous-onglets Annuaire / Entreprises / Carte, drawer flottant). Juste re-skinné via tokens CRM (background, borders).
- `Pipeline` (`CrmPipeline.tsx`) : conservé.
- `Équipe` : conservé.

Re-skin = remplacement `bg-background` → `bg-[hsl(var(--crm-bg))]` etc. via wrapper CSS scopé. Pas de refonte fonctionnelle.

## 5. Nouvelle vue — Marches (`/admin/crm/marches`)

Liste des `marche_events` côté CRM avec liaison entreprises.

### UI
- Header : recherche + filtres (statut, type, date range) + bouton « Lier entreprise »
- Vue toggle : Liste (DataTable) ↔ Calendrier (mois)
- Liste cols : Date | Titre | Type | Lieu | Entreprises liées (avatars empilés) | Statut | Actions
- Drawer détail event au clic : infos event + section « Entreprises associées » avec recherche/ajout/suppression de liens vers `crm_companies`

### Modèle de données (migration)
Nouvelle table de liaison many-to-many :

```sql
CREATE TABLE public.crm_company_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.marche_events(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'participant',
    -- 'participant' | 'sponsor' | 'organisateur' | 'invite'
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(company_id, event_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_company_events TO authenticated;
GRANT ALL ON public.crm_company_events TO service_role;

ALTER TABLE public.crm_company_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRM members can manage company-event links"
  ON public.crm_company_events FOR ALL TO authenticated
  USING (public.has_crm_access(auth.uid()))
  WITH CHECK (public.has_crm_access(auth.uid()));
```

Sera réutilisable depuis la fiche entreprise (onglet « Marches associées »).

## 6. Vue IA (stub)

Page placeholder élégante : icône Sparkles animée, titre « Assistant CRM », baseline « Bientôt — spécifications en cours », CTA désactivé. Aucune logique.

## 7. Détails techniques

### Fichiers créés
- `src/layouts/CrmShell.tsx` — provider + grid layout
- `src/components/crm/shell/CrmSidebar.tsx`
- `src/components/crm/shell/CrmTopBar.tsx`
- `src/components/crm/shell/crmShell.css` — tokens CRM scopés
- `src/components/crm/home/CrmBentoHome.tsx`
- `src/components/crm/home/BentoKpiTile.tsx`
- `src/components/crm/home/PipelineFunnelTile.tsx`
- `src/components/crm/home/ActivityFeedTile.tsx`
- `src/pages/CrmMarches.tsx`
- `src/components/crm/marches/MarchesDataTable.tsx`
- `src/components/crm/marches/MarcheDetailDrawer.tsx`
- `src/components/crm/marches/CompanyLinkPicker.tsx`
- `src/pages/CrmIa.tsx` (stub)
- `src/hooks/useCrmHomeStats.ts` (aggrège Contacts/Suspects/Prospects/Clients/Opportunités/Marches via RPC ou queries parallèles)
- `src/hooks/useCrmCompanyEvents.ts`

### Fichiers modifiés
- `src/App.tsx` — restructure les routes `/admin/crm/*` sous `<CrmShell>`
- `src/pages/CrmDashboard.tsx` → remplacé par `CrmBentoHome` (l'ancien fichier supprimé)
- `src/pages/CrmAnnuaire.tsx`, `CrmPipeline.tsx`, `CrmEquipe` → suppression de leur header/back-button (désormais dans la TopBar du shell), wrapping minimal.
- `src/types/crm.ts` — ajoute `CrmCompanyEvent`

### Migration
1 migration SQL : table `crm_company_events` + grants + RLS + index `(event_id)` et `(company_id)`.

### Pas dans ce lot
- Module IA (specs futures)
- Commandes / Factures (tiles stub uniquement, aucune table)
- Recherche globale dans la TopBar (placeholder visuel pour l'instant)
- Vue calendrier des Marches (toggle visible mais activé en V2 si Liste suffit) — **à confirmer**

## Questions résiduelles

1. **Définition Suspect / Prospect / Client** : aujourd'hui dans `crm_companies` il y a un champ stage. Je m'appuie dessus pour les compteurs Bento ; tu confirmes ?
2. **Vue calendrier Marches** : utile dès maintenant ou juste liste pour ce lot ?
3. **« Contacts » distincts des entreprises** : on compte les lignes `crm_contacts`, ou les contacts à l'intérieur des entreprises ?