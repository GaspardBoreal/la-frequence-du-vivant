import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CrmRole } from '@/types/crm';

export interface CrmRoleResult {
  role: CrmRole | null;
  isAdmin: boolean;
  isMember: boolean;
  isWalker: boolean;
  hasAnyCrmRole: boolean;
  canAccessCrm: boolean;
  canManageTeam: boolean;
  canManageOpportunities: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useCrmRole(): CrmRoleResult {
  const { user, isAdmin: isSystemAdmin } = useAuth();

  const { data: roleData, isLoading, error } = useQuery({
    queryKey: ['crm-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Use the RPC function to get the role
      const { data, error } = await supabase.rpc('get_user_crm_role', {
        _user_id: user.id
      });

      if (error) {
        console.error('Error fetching CRM role:', error);
        throw error;
      }

      return data as CrmRole | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const role = roleData || null;
  const isAdmin = role === 'admin' || isSystemAdmin;
  const isMember = role === 'member';
  const isWalker = role === 'walker';
  const hasAnyCrmRole = !!role || isSystemAdmin;
  
  // CRM access is for admins and members
  const canAccessCrm = isAdmin || isMember;
  
  // Team management is admin only
  const canManageTeam = isAdmin;
  
  // Opportunity management is for admins and members
  const canManageOpportunities = isAdmin || isMember;

  return {
    role,
    isAdmin,
    isMember,
    isWalker,
    hasAnyCrmRole,
    canAccessCrm,
    canManageTeam,
    canManageOpportunities,
    isLoading,
    error: error as Error | null,
  };
}
