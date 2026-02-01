
# Plan CRM Association - Intégration Admin Hub

## Analyse de l'Existant

### Structure actuelle
- **Hub Admin** : `/access-admin-gb2025` → `AdminAccess.tsx` (5 modules existants)
- **Authentification** : `AdminAuth.tsx` + `useAuth.ts` avec vérification admin via RPC `is_admin_user`
- **Table admin_users** : Stocke `user_id`, `email`, `role` (actuellement 1 admin : gpied@gaspardboreal.com)
- **Tables de contacts existantes** : `gaspard_messages`, `gaspard_reservations` (base pour opportunités)

### Points clés de sécurité identifiés
- Le système utilise déjà une table `admin_users` séparée avec un champ `role` (text)
- Fonctions RPC sécurisées : `is_admin_user()`, `check_is_admin_user()`
- Pas d'intégration email métier (Resend) - seulement Supabase Auth

---

## Architecture Proposée

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    /access-admin-gb2025 - Hub Principal                  │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Marches   │  │ Explorations│  │ Exportations│  │ Automations │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐  │
│  │  Marcheurs  │  │              NOUVEAU : CRM Module               │  │
│  └─────────────┘  │  ┌─────────┐ ┌──────────┐ ┌─────────────────┐   │  │
│                    │  │ Équipe  │ │ Pipeline │ │ Tableau de Bord │   │  │
│                    │  └─────────┘ └──────────┘ └─────────────────┘   │  │
│                    └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Gestion des Rôles et Permissions

### Évolution du système de rôles

**Rôles requis :**

| Rôle | Accès |
|------|-------|
| `admin` | Tout (CRM, Marches, Explorations, Équipe, Paramètres) |
| `member` | CRM + Marches (création/gestion) + Explorations (lecture) |
| `walker` | Marches uniquement (création/gestion de ses propres marches) |

### Modifications base de données

**Table `user_roles` (sécurité standard) :**

```sql
-- Enum pour les rôles
CREATE TYPE public.crm_role AS ENUM ('admin', 'member', 'walker');

-- Table des rôles utilisateur
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role crm_role NOT NULL DEFAULT 'walker',
    UNIQUE (user_id, role)
);

-- Fonction de vérification sécurisée
CREATE OR REPLACE FUNCTION public.has_crm_role(_user_id uuid, _role crm_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Table `team_members` (profils enrichis) :**

```sql
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    fonction TEXT,
    telephone TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. Pipeline Commercial (Opportunités)

### Table `crm_opportunities`

```sql
CREATE TABLE public.crm_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Informations contact
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    entreprise TEXT,
    fonction TEXT,
    telephone TEXT,
    email TEXT NOT NULL,
    -- Détails projet
    experience_souhaitee TEXT, -- 'team_building', 'formation', 'seminaire'
    format_souhaite TEXT,       -- 'demi_journee', 'journee', 'sur_mesure'
    date_souhaitee DATE,
    lieu_prefere TEXT,
    objectifs TEXT,
    financement_souhaite TEXT,  -- 'direct', 'opco', 'autre'
    budget_estime INTEGER,
    -- Pipeline
    statut TEXT DEFAULT 'a_contacter', -- a_contacter, relance_1, relance_2, relance_3, pas_interesse, gagne, perdu
    notes TEXT,
    -- Métadonnées
    assigned_to UUID REFERENCES public.team_members(id),
    source TEXT, -- 'formulaire_b2b', 'linkedin', 'recommandation', 'salon', 'autre'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);
```

### Statuts du Kanban

```text
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ À contacter│→│ Relance 1  │→│ Relance 2  │→│ Relance 3  │→│ Pas intéré │ │   Gagné    │
│     12     │ │     5      │ │     3      │ │     2      │ │      8     │ │     15     │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

---

## 3. Module Email (via Resend)

### Edge Function `send-crm-email`

**Fonctionnalités :**
- Envoi de devis personnalisé (template HTML)
- Envoi de newsletters (base de contacts segmentée)
- Historique des envois dans `crm_email_logs`

### Table `crm_email_logs`

```sql
CREATE TABLE public.crm_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    email_type TEXT NOT NULL, -- 'devis', 'relance', 'newsletter'
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'opened'
    resend_id TEXT
);
```

### Table `crm_contacts` (pour newsletters)

```sql
CREATE TABLE public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    prenom TEXT,
    nom TEXT,
    entreprise TEXT,
    segment TEXT DEFAULT 'general', -- 'entreprise', 'association', 'partenaire'
    is_subscribed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Interface Utilisateur

### Nouvelles pages à créer

| Route | Composant | Accès |
|-------|-----------|-------|
| `/admin/crm` | `CrmDashboard.tsx` | admin, member |
| `/admin/crm/pipeline` | `CrmPipeline.tsx` | admin, member |
| `/admin/crm/opportunities/:id` | `OpportunityDetail.tsx` | admin, member |
| `/admin/crm/equipe` | `TeamManagement.tsx` | admin uniquement |
| `/admin/crm/emails` | `EmailCenter.tsx` | admin, member |
| `/admin/crm/contacts` | `ContactsList.tsx` | admin, member |

### Composants principaux

**CrmDashboard.tsx - Tableau de bord**
- KPIs : Opportunités actives, Taux de conversion, CA potentiel
- Graphique pipeline par statut
- Dernières activités
- Prochaines relances

**CrmPipeline.tsx - Vue Kanban**
- Colonnes drag & drop (dnd-kit déjà installé)
- Cartes d'opportunités avec infos clés
- Toggle vue Kanban / Liste
- Filtres par assigné, source, date

**OpportunityDetail.tsx - Fiche détaillée**
- Formulaire d'édition complet
- Historique des actions
- Boutons : Envoyer devis, Programmer relance
- Notes et commentaires

**TeamManagement.tsx - Gestion équipe**
- Liste des membres avec rôles
- Ajout/suppression de membres
- Attribution des rôles (admin uniquement)

**EmailCenter.tsx - Centre d'emails**
- Composer un email personnalisé
- Templates de devis
- Historique des envois

---

## 5. Structure des Fichiers

```text
src/
├── pages/
│   ├── CrmDashboard.tsx
│   ├── CrmPipeline.tsx
│   ├── OpportunityDetail.tsx
│   ├── TeamManagement.tsx
│   ├── EmailCenter.tsx
│   └── ContactsList.tsx
├── components/
│   └── crm/
│       ├── OpportunityCard.tsx
│       ├── KanbanColumn.tsx
│       ├── KanbanBoard.tsx
│       ├── OpportunityForm.tsx
│       ├── TeamMemberCard.tsx
│       ├── EmailComposer.tsx
│       ├── DevisTemplate.tsx
│       ├── DashboardKPIs.tsx
│       ├── PipelineChart.tsx
│       └── ActivityFeed.tsx
├── hooks/
│   ├── useCrmOpportunities.ts
│   ├── useTeamMembers.ts
│   ├── useCrmStats.ts
│   └── useCrmRole.ts
└── types/
    └── crm.ts

supabase/
└── functions/
    └── send-crm-email/
        └── index.ts
```

---

## 6. Intégration au Hub Admin

### Modification de `AdminAccess.tsx`

Ajout d'une nouvelle carte CRM avec sous-navigation :

```text
┌────────────────────────────────────────────────────┐
│  📊  CRM & Commercial                              │
│  ─────────────────────────────────────────────     │
│  Gérer le pipeline commercial, les opportunités    │
│  et les communications avec les prospects.         │
│                                                    │
│  [Pipeline]  [Tableau de Bord]  [Emails]          │
└────────────────────────────────────────────────────┘
```

---

## 7. Sécurisation RLS

### Policies pour `crm_opportunities`

```sql
-- Les admins et membres peuvent voir toutes les opportunités
CREATE POLICY "CRM access for admins and members" ON crm_opportunities
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.has_crm_role(auth.uid(), 'member')
);
```

### Policies pour `team_members`

```sql
-- Seuls les admins peuvent gérer l'équipe
CREATE POLICY "Only admins manage team" ON team_members
FOR ALL USING (public.has_crm_role(auth.uid(), 'admin'));

-- Les membres peuvent voir l'équipe
CREATE POLICY "Members can view team" ON team_members
FOR SELECT USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.has_crm_role(auth.uid(), 'member')
);
```

---

## 8. Plan d'Implémentation

### Phase 1 : Fondations (Tables + Rôles)
1. Créer les tables : `user_roles`, `team_members`, `crm_opportunities`, `crm_contacts`, `crm_email_logs`
2. Créer les fonctions RPC de vérification de rôles
3. Configurer les policies RLS
4. Migrer l'admin existant vers le nouveau système

### Phase 2 : Interface Pipeline
5. Créer le hook `useCrmRole` pour la gestion des permissions
6. Créer les composants Kanban (KanbanBoard, KanbanColumn, OpportunityCard)
7. Implémenter la page `CrmPipeline.tsx` avec drag & drop
8. Ajouter la vue Liste alternative

### Phase 3 : Gestion Équipe
9. Créer la page `TeamManagement.tsx`
10. Implémenter l'ajout/suppression de membres
11. Créer l'interface d'attribution des rôles

### Phase 4 : Dashboard
12. Créer les hooks de statistiques (`useCrmStats`)
13. Implémenter les KPIs et graphiques
14. Ajouter le fil d'activités

### Phase 5 : Emails
15. Configurer le secret `RESEND_API_KEY`
16. Créer l'edge function `send-crm-email`
17. Implémenter l'EmailCenter et les templates de devis

### Phase 6 : Intégration Hub
18. Modifier `AdminAccess.tsx` pour ajouter le module CRM
19. Ajouter les routes dans `App.tsx`
20. Créer le guard de permission par rôle

---

## Prérequis Utilisateur

Avant de commencer l'implémentation, vous devrez :

1. **Créer un compte Resend** : https://resend.com
2. **Valider votre domaine** : https://resend.com/domains
3. **Créer une clé API** : https://resend.com/api-keys
4. **Me fournir la clé** pour que je l'ajoute aux secrets Supabase

---

## Résultat Attendu

**Avant :** Hub admin avec 5 modules techniques (Marches, Explorations, etc.)

**Après :** Hub admin enrichi avec :
- Module CRM complet avec pipeline Kanban
- Gestion de l'équipe interne (Laurence, Victor, Laurent...)
- Système de rôles à 3 niveaux
- Envoi d'emails personnalisés (devis, relances)
- Tableau de bord commercial
- Base de contacts pour newsletters futures
