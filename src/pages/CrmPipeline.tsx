import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, LayoutGrid, List, RefreshCw, Map as MapIcon } from 'lucide-react';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { PipelineMapView } from '@/components/crm/pipeline/PipelineMapView';
import { PipelineFiltersBar } from '@/components/crm/pipeline/PipelineFiltersBar';
import { usePipelineFilters } from '@/hooks/usePipelineFilters';
import { OpportunityForm } from '@/components/crm/OpportunityForm';
import { DashboardKPIs } from '@/components/crm/DashboardKPIs';
import { useCrmOpportunities } from '@/hooks/useCrmOpportunities';
import { useCrmRole } from '@/hooks/useCrmRole';
import type { CrmOpportunity } from '@/types/crm';
import { OpportunityActionsBadges } from '@/components/crm/opportunities/OpportunityActionsBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KANBAN_COLUMNS } from '@/types/crm';

type ViewMode = 'kanban' | 'list' | 'map';

const CrmPipeline: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode: ViewMode =
    searchParams.get('view') === 'map' ? 'map' : searchParams.get('view') === 'list' ? 'list' : 'kanban';
  const setViewMode = (v: ViewMode) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (v === 'kanban') p.delete('view');
        else p.set('view', v);
        return p;
      },
      { replace: true },
    );
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<CrmOpportunity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtres unifiés (jalons + étapes) partagés par les 3 vues
  const {
    actionsFilter,
    setActionsFilter,
    actionsMode,
    setActionsMode,
    stagesFilter,
    setStagesFilter,
    allStagesActive,
    matchesAll,
  } = usePipelineFilters();

  const { 
    opportunities, 
    stats, 
    isLoading, 
    createOpportunity, 
    updateOpportunity,
    deleteOpportunity 
  } = useCrmOpportunities();
  const { canAccessCrm } = useCrmRole();

  // Deep-link: ?opportunity=<id> opens the edit form
  React.useEffect(() => {
    const oid = searchParams.get('opportunity');
    if (!oid || !opportunities?.length) return;
    if (editingOpportunity?.id === oid) return;
    const found = opportunities.find((o: any) => o.id === oid);
    if (found) {
      setEditingOpportunity(found as CrmOpportunity);
      setIsFormOpen(true);
    }
  }, [searchParams, opportunities]);

  const handleEditOpportunity = (opportunity: CrmOpportunity) => {
    setEditingOpportunity(opportunity);
    setIsFormOpen(true);
  };

  const handleDeleteOpportunity = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteOpportunity.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    const { linkedCompanies, linkedContacts, actions_realisees, ...rest } = data;

    // Sanitize: convert "" → null for optional fields (Postgres rejects "" for date/uuid)
    const TEXT_NULLABLE = ['titre', 'entreprise', 'fonction', 'telephone', 'experience_souhaitee',
      'format_souhaite', 'lieu_prefere', 'objectifs', 'financement_souhaite',
      'source', 'notes', 'date_souhaitee', 'assigned_to'];
    const NUM_NULLABLE = ['budget_estime', 'nombre_participants'];
    const payload: any = { ...rest };
    for (const k of TEXT_NULLABLE) {
      if (payload[k] === '' || payload[k] === undefined) payload[k] = null;
    }
    for (const k of NUM_NULLABLE) {
      const v = payload[k];
      if (v === '' || v === undefined || v === null || Number.isNaN(Number(v))) payload[k] = null;
      else payload[k] = Number(v);
    }
    payload.actions_realisees = Array.isArray(actions_realisees) ? actions_realisees : [];

    // Sync the primary company onto legacy company_id for backward compat
    const primary = (linkedCompanies || []).find((c: any) => c.role === 'primary');
    if (primary) payload.company_id = primary.company_id;

    try {
      let oppId = editingOpportunity?.id;
      if (editingOpportunity) {
        const res = await updateOpportunity.mutateAsync({ id: editingOpportunity.id, ...payload });
        oppId = (res as any)?.id ?? editingOpportunity.id;
      } else {
        const res = await createOpportunity.mutateAsync(payload);
        oppId = (res as any)?.id;
      }
      if (oppId) {
        const { syncOpportunityLinks } = await import('@/hooks/useCrmOpportunityLinks');
        await syncOpportunityLinks(oppId, linkedCompanies || [], linkedContacts || []);
      }
    } finally {
      setIsFormOpen(false);
      setEditingOpportunity(null);
    }
  };


  const handleFormClose = (open: boolean) => {
    if (!open) {
      setEditingOpportunity(null);
    }
    setIsFormOpen(open);
  };

  const getStatusBadge = (statut: string) => {
    const column = KANBAN_COLUMNS.find(c => c.id === statut);
    if (!column) return <Badge variant="outline">{statut}</Badge>;
    
    return (
      <Badge className={`${column.color} text-white`}>
        {column.title}
      </Badge>
    );
  };

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[1600px] mx-auto">
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
              <h1 className="text-2xl font-bold text-foreground">Pipeline Commercial</h1>
              <p className="text-sm text-muted-foreground">Gérer les opportunités et le suivi des prospects</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle opportunité
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-6">
          <DashboardKPIs stats={stats} />
        </div>

        {/* Filtre par jalons */}
        {(() => {
          const filtered = opportunities.filter(matchesActions);
          return (
            <div className="mb-4">
              <PipelineActionsFilter
                value={actionsFilter}
                onChange={setActionsFilter}
                mode={actionsMode}
                onModeChange={setActionsMode}
                matchedCount={filtered.length}
                totalCount={opportunities.length}
              />
            </div>
          );
        })()}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            onEditOpportunity={handleEditOpportunity}
            onDeleteOpportunity={handleDeleteOpportunity}
            filterPredicate={matchesActions}
          />
        ) : viewMode === 'map' ? (
          <PipelineMapView opportunitiesAfterActions={opportunities.filter(matchesActions)} />
        ) : (
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Expérience</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Jalons</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.filter(matchesActions).map((opp) => (
                  <TableRow 
                    key={opp.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEditOpportunity(opp)}
                  >
                    <TableCell className="font-medium">
                      {opp.prenom} {opp.nom}
                    </TableCell>
                    <TableCell>{opp.entreprise || '-'}</TableCell>
                    <TableCell>{opp.email}</TableCell>
                    <TableCell>{opp.experience_souhaitee || '-'}</TableCell>
                    <TableCell>
                      {opp.budget_estime 
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(opp.budget_estime)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(opp.statut)}</TableCell>
                    <TableCell>
                      <OpportunityActionsBadges value={opp.actions_realisees} size="xs" />
                    </TableCell>
                    <TableCell>
                      {new Date(opp.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
                {opportunities.filter(matchesActions).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune opportunité. Cliquez sur "Nouvelle opportunité" pour commencer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Form Dialog */}
        <OpportunityForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          opportunity={editingOpportunity}
          onSubmit={handleFormSubmit}
          isSubmitting={createOpportunity.isPending || updateOpportunity.isPending}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette opportunité ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CrmPipeline;
