import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OpportunityDocument } from './useOpportunityDocuments';

export type OpportunityDocSummary = Pick<
  OpportunityDocument,
  'id' | 'opportunity_id' | 'file_name' | 'file_path' | 'file_size' | 'mime_type' | 'created_at'
>;

export function useOpportunitiesDocumentsIndex() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['crm-opportunity-documents-index'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_opportunity_documents')
        .select('id, opportunity_id, file_name, file_path, file_size, mime_type, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OpportunityDocSummary[];
    },
  });

  const map = React.useMemo(() => {
    const m = new Map<string, OpportunityDocSummary[]>();
    for (const d of data) {
      const arr = m.get(d.opportunity_id) ?? [];
      arr.push(d);
      m.set(d.opportunity_id, arr);
    }
    return m;
  }, [data]);

  return { map, isLoading };
}

type Ctx = {
  getDocs: (opportunityId: string) => OpportunityDocSummary[];
};

const OpportunityDocsIndexContext = React.createContext<Ctx>({ getDocs: () => [] });

export const OpportunityDocsIndexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { map } = useOpportunitiesDocumentsIndex();
  const value = React.useMemo<Ctx>(
    () => ({ getDocs: (id: string) => map.get(id) ?? [] }),
    [map],
  );
  return React.createElement(OpportunityDocsIndexContext.Provider, { value }, children);
};

export function useOpportunityDocsFromIndex(opportunityId: string): OpportunityDocSummary[] {
  const { getDocs } = React.useContext(OpportunityDocsIndexContext);
  return getDocs(opportunityId);
}
