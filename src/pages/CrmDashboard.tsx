import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Kanban,
  Users,
  BarChart3,
  Mail,
  Target,
  TrendingUp
} from 'lucide-react';
import { DashboardKPIs } from '@/components/crm/DashboardKPIs';
import { useCrmOpportunities } from '@/hooks/useCrmOpportunities';
import { useCrmRole } from '@/hooks/useCrmRole';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { KANBAN_COLUMNS } from '@/types/crm';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CrmDashboard: React.FC = () => {
  const { opportunities, opportunitiesByStatus, stats, isLoading } = useCrmOpportunities();
  const { activeMembers } = useTeamMembers();
  const { canAccessCrm, isAdmin } = useCrmRole();

  if (!canAccessCrm) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits pour accéder au CRM.</p>
          <Link to="/admin">
            <Button variant="outline" className="mt-4">
              Retour à l'administration
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const pipelineData = KANBAN_COLUMNS.map(col => ({
    name: col.title,
    count: opportunitiesByStatus[col.id]?.length || 0,
    color: col.color.replace('bg-', ''),
  }));

  const sourceData = opportunities.reduce((acc, opp) => {
    const source = opp.source || 'Autre';
    const existing = acc.find(s => s.name === source);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: source, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Recent opportunities
  const recentOpportunities = [...opportunities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tableau de Bord CRM</h1>
              <p className="text-sm text-muted-foreground">Vue d'ensemble des performances commerciales</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/admin/crm/pipeline">
              <Button>
                <Kanban className="h-4 w-4 mr-2" />
                Voir le Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-6">
          <DashboardKPIs stats={stats} />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Pipeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Répartition par statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }} 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Source Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sources des opportunités
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Access & Recent Activity */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Accès rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin/crm/pipeline" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Kanban className="h-4 w-4 mr-2" />
                  Pipeline Kanban
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin/crm/equipe" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Gestion de l'équipe
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="w-full justify-start" disabled>
                <Mail className="h-4 w-4 mr-2" />
                Centre d'emails (bientôt)
              </Button>
            </CardContent>
          </Card>

          {/* Team Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Équipe active
              </CardTitle>
              <CardDescription>{activeMembers.length} membres</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeMembers.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {member.prenom.charAt(0)}{member.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{member.prenom} {member.nom}</p>
                      <p className="text-xs text-muted-foreground">{member.fonction || 'Membre'}</p>
                    </div>
                  </div>
                ))}
                {activeMembers.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{activeMembers.length - 4} autres membres
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Dernières opportunités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOpportunities.length > 0 ? (
                  recentOpportunities.map((opp) => (
                    <div key={opp.id} className="text-sm border-b pb-2 last:border-0">
                      <p className="font-medium">{opp.prenom} {opp.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {opp.entreprise || 'Particulier'} • {new Date(opp.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune opportunité récente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrmDashboard;
