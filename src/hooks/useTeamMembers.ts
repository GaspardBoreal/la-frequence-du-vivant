import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember, UserRole, CrmRole } from '@/types/crm';
import { toast } from 'sonner';

export function useTeamMembers() {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('nom', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      return data as TeamMember[];
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      return data as UserRole[];
    },
  });

  const createMember = useMutation({
    mutationFn: async (member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Membre ajouté avec succès');
    },
    onError: (error) => {
      console.error('Error creating member:', error);
      toast.error('Erreur lors de l\'ajout du membre');
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Membre mis à jour');
    },
    onError: (error) => {
      console.error('Error updating member:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Membre supprimé');
    },
    onError: (error) => {
      console.error('Error deleting member:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: CrmRole }) => {
      // First, delete any existing role for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then insert the new role
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Rôle attribué avec succès');
    },
    onError: (error) => {
      console.error('Error assigning role:', error);
      toast.error('Erreur lors de l\'attribution du rôle');
    },
  });

  const removeRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Rôle retiré');
    },
    onError: (error) => {
      console.error('Error removing role:', error);
      toast.error('Erreur lors du retrait du rôle');
    },
  });

  // Get role for a specific user
  const getRoleForUser = (userId: string): CrmRole | null => {
    const userRole = userRoles.find(r => r.user_id === userId);
    return userRole?.role || null;
  };

  // Active members only
  const activeMembers = members.filter(m => m.is_active);

  return {
    members,
    activeMembers,
    userRoles,
    isLoading,
    error,
    createMember,
    updateMember,
    deleteMember,
    assignRole,
    removeRole,
    getRoleForUser,
  };
}
