import React from 'react';
import {
  Users,
  Eye,
  Target,
  Trophy,
  Activity,
  CalendarRange,
  ShoppingCart,
  FileText,
  Mail,
  Euro,
} from 'lucide-react';
import { useCrmHomeStats } from '@/hooks/useCrmHomeStats';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { BentoKpiTile } from '@/components/crm/home/BentoKpiTile';
import { PipelineFunnelTile } from '@/components/crm/home/PipelineFunnelTile';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const CrmHome: React.FC = () => {
  const { data, isLoading } = useCrmHomeStats();
  const { activeMembers, isLoading: isLoadingTeam } = useTeamMembers();
  const s = data || {
    contacts: 0,
    dirigeants: 0,
    suspects: 0,
    prospects: 0,
    clients: 0,
    inactifs: 0,
    opportunitesActives: 0,
    opportunitesSignees: 0,
    opportunitesTotal: 0,
    caPotentiel: 0,
    marchesAVenir: 0,
    marchesPassees: 0,
    commandes: 0,
    factures: 0,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-[hsl(var(--crm-text))] tracking-tight">
          Bonjour 👋
        </h1>
        <p className="text-sm crm-muted mt-1">
          Vue d'ensemble de votre activité commerciale en temps réel.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(140px,auto)]">
        <PipelineFunnelTile
          suspects={s.suspects}
          prospects={s.prospects}
          clients={s.clients}
        />

        <BentoKpiTile
          label="Suspects"
          value={s.suspects}
          icon={Eye}
          to="/admin/crm/annuaire?tab=entreprises&stage=suspect"
          accent="rose"
          loading={isLoading}
        />
        <BentoKpiTile
          label="Prospects"
          value={s.prospects}
          icon={Target}
          to="/admin/crm/annuaire?tab=entreprises&stage=prospect"
          accent="violet"
          loading={isLoading}
        />
        <BentoKpiTile
          label="Clients"
          value={s.clients}
          icon={Trophy}
          to="/admin/crm/annuaire?tab=entreprises&stage=client"
          accent="emerald"
          loading={isLoading}
        />
        <BentoKpiTile
          label="Contacts"
          value={s.contacts}
          icon={Mail}
          to="/admin/crm/annuaire?tab=contacts"
          accent="sky"
          hint={s.dirigeants > 0 ? `dont ${s.dirigeants} dirigeant${s.dirigeants > 1 ? 's' : ''}` : undefined}
          loading={isLoading}
        />

        <BentoKpiTile
          label="Opportunités actives"
          value={s.opportunitesActives}
          icon={Activity}
          to="/admin/crm/pipeline"
          accent="violet"
          hint={`${s.opportunitesSignees} signées • ${s.opportunitesTotal} total`}
          loading={isLoading}
          span="col-1"
        />
        <BentoKpiTile
          label="CA potentiel"
          value={formatCurrency(s.caPotentiel)}
          icon={Euro}
          accent="emerald"
          hint="Sur opportunités actives"
          loading={isLoading}
          span="col-1"
        />
        <BentoKpiTile
          label="Marches à venir"
          value={s.marchesAVenir}
          icon={CalendarRange}
          to="/admin/crm/marches"
          accent="amber"
          hint={`${s.marchesPassees} passées`}
          loading={isLoading}
          span="col-1"
        />
        <BentoKpiTile
          label="Équipe active"
          value={'—'}
          icon={Users}
          to="/admin/crm/equipe"
          accent="sky"
          hint="Voir les membres"
          span="col-1"
        />

        <BentoKpiTile
          label="Commandes"
          value={s.commandes}
          icon={ShoppingCart}
          accent="amber"
          comingSoon
          hint="Module en cours de spécification"
          span="col-2"
        />
        <BentoKpiTile
          label="Factures"
          value={s.factures}
          icon={FileText}
          accent="rose"
          comingSoon
          hint="Module en cours de spécification"
          span="col-2"
        />
      </div>
    </div>
  );
};

export default CrmHome;
