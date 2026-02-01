import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CrmOpportunity, OpportunityStatus } from '@/types/crm';
import { toast } from 'sonner';

export function useCrmOpportunities() {
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading, error } = useQuery({
    queryKey: ['crm-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select(`
          *,
          assigned_member:team_members(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching opportunities:', error);
        throw error;
      }

      return data as CrmOpportunity[];
    },
  });

  const createOpportunity = useMutation({
    mutationFn: async (opportunity: Omit<CrmOpportunity, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert({
          ...opportunity,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      toast.success('Opportunité créée avec succès');
    },
    onError: (error) => {
      console.error('Error creating opportunity:', error);
      toast.error('Erreur lors de la création de l\'opportunité');
    },
  });

  const updateOpportunity = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmOpportunity> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      toast.success('Opportunité mise à jour');
    },
    onError: (error) => {
      console.error('Error updating opportunity:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: OpportunityStatus }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Get current status for history
      const currentOpp = opportunities.find(o => o.id === id);
      
      // Update the opportunity
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update({ 
          statut,
          closed_at: ['gagne', 'perdu', 'pas_interesse'].includes(statut) ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the status change
      if (currentOpp) {
        await supabase.from('crm_opportunity_history').insert({
          opportunity_id: id,
          action_type: 'status_change',
          old_value: currentOpp.statut,
          new_value: statut,
          performed_by: userData.user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Erreur lors du changement de statut');
    },
  });

  const deleteOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
      toast.success('Opportunité supprimée');
    },
    onError: (error) => {
      console.error('Error deleting opportunity:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  // Group opportunities by status
  const opportunitiesByStatus = opportunities.reduce((acc, opp) => {
    const status = opp.statut as OpportunityStatus;
    if (!acc[status]) acc[status] = [];
    acc[status].push(opp);
    return acc;
  }, {} as Record<OpportunityStatus, CrmOpportunity[]>);

  // Stats
  const stats = {
    total: opportunities.length,
    active: opportunities.filter(o => !['gagne', 'perdu', 'pas_interesse'].includes(o.statut)).length,
    won: opportunities.filter(o => o.statut === 'gagne').length,
    lost: opportunities.filter(o => o.statut === 'perdu' || o.statut === 'pas_interesse').length,
    potentialRevenue: opportunities
      .filter(o => !['gagne', 'perdu', 'pas_interesse'].includes(o.statut))
      .reduce((sum, o) => sum + (o.budget_estime || 0), 0),
  };

  return {
    opportunities,
    opportunitiesByStatus,
    stats,
    isLoading,
    error,
    createOpportunity,
    updateOpportunity,
    updateStatus,
    deleteOpportunity,
  };
}
