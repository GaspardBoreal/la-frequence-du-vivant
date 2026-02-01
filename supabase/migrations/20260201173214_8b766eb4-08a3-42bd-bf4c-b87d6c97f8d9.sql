-- =============================================
-- CRM ASSOCIATION - PHASE 1 : FONDATIONS
-- =============================================

-- 1. Enum pour les rôles CRM
CREATE TYPE public.crm_role AS ENUM ('admin', 'member', 'walker');

-- 2. Table des rôles utilisateur (séparée pour sécurité)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role crm_role NOT NULL DEFAULT 'walker',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Fonction de vérification de rôle (SECURITY DEFINER pour éviter récursion RLS)
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

-- 4. Fonction pour vérifier si l'utilisateur a au moins un rôle CRM
CREATE OR REPLACE FUNCTION public.has_any_crm_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- 5. Fonction pour obtenir le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_crm_role(_user_id uuid)
RETURNS crm_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 6. Table des membres de l'équipe (profils enrichis)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    fonction TEXT,
    telephone TEXT,
    email TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Table des opportunités CRM
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
    experience_souhaitee TEXT,
    format_souhaite TEXT,
    date_souhaitee DATE,
    lieu_prefere TEXT,
    objectifs TEXT,
    financement_souhaite TEXT,
    budget_estime INTEGER,
    nombre_participants INTEGER,
    -- Pipeline
    statut TEXT DEFAULT 'a_contacter',
    notes TEXT,
    -- Métadonnées
    assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    source TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- 8. Table des contacts (pour newsletters)
CREATE TABLE public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    prenom TEXT,
    nom TEXT,
    entreprise TEXT,
    fonction TEXT,
    telephone TEXT,
    segment TEXT DEFAULT 'general',
    is_subscribed BOOLEAN DEFAULT true,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Table des logs d'emails
CREATE TABLE public.crm_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_preview TEXT,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'sent',
    resend_id TEXT,
    error_message TEXT
);

-- 10. Table d'historique des actions sur opportunités
CREATE TABLE public.crm_opportunity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger pour updated_at sur team_members
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur crm_opportunities
CREATE TRIGGER update_crm_opportunities_updated_at
BEFORE UPDATE ON public.crm_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur crm_contacts
CREATE TRIGGER update_crm_contacts_updated_at
BEFORE UPDATE ON public.crm_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunity_history ENABLE ROW LEVEL SECURITY;

-- Policies pour user_roles (seuls les admins peuvent gérer)
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.check_is_admin_user(auth.uid())
);

-- Policies pour team_members
CREATE POLICY "Admins can manage team members" ON public.team_members
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.check_is_admin_user(auth.uid())
);

CREATE POLICY "Members can view team" ON public.team_members
FOR SELECT USING (
    public.has_crm_role(auth.uid(), 'member') OR
    public.has_crm_role(auth.uid(), 'walker')
);

-- Policies pour crm_opportunities
CREATE POLICY "CRM access for admins and members" ON public.crm_opportunities
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.has_crm_role(auth.uid(), 'member') OR
    public.check_is_admin_user(auth.uid())
);

-- Policies pour crm_contacts
CREATE POLICY "CRM contacts access" ON public.crm_contacts
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.has_crm_role(auth.uid(), 'member') OR
    public.check_is_admin_user(auth.uid())
);

-- Policies pour crm_email_logs
CREATE POLICY "Email logs access" ON public.crm_email_logs
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.has_crm_role(auth.uid(), 'member') OR
    public.check_is_admin_user(auth.uid())
);

-- Policies pour crm_opportunity_history
CREATE POLICY "Opportunity history access" ON public.crm_opportunity_history
FOR ALL USING (
    public.has_crm_role(auth.uid(), 'admin') OR 
    public.has_crm_role(auth.uid(), 'member') OR
    public.check_is_admin_user(auth.uid())
);

-- =============================================
-- MIGRATION DES ADMINS EXISTANTS
-- =============================================

-- Ajouter le rôle 'admin' à tous les admin_users existants
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::crm_role
FROM public.admin_users
ON CONFLICT (user_id, role) DO NOTHING;

-- Créer les profils team_members pour les admins existants
INSERT INTO public.team_members (user_id, prenom, nom, email, fonction)
SELECT 
    user_id,
    SPLIT_PART(email, '@', 1) as prenom,
    'Admin' as nom,
    email,
    'Administrateur'
FROM public.admin_users
ON CONFLICT (user_id) DO NOTHING;