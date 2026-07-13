import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OpportunityDocument {
  id: string;
  opportunity_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  label: string | null;
  uploaded_by: string | null;
  indexed_for_rag: boolean;
  rag_indexed_at: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = 'crm-opportunity-docs';

export function useOpportunityDocuments(opportunityId: string | null | undefined) {
  const queryClient = useQueryClient();
  const key = ['crm-opportunity-documents', opportunityId];

  const { data: documents = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!opportunityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_opportunity_documents')
        .select('*')
        .eq('opportunity_id', opportunityId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OpportunityDocument[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      if (!opportunityId) throw new Error('Opportunity id manquant');
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 20 Mo)');
      }
      const { data: userData } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${opportunityId}/${crypto.randomUUID()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from('crm_opportunity_documents')
        .insert({
          opportunity_id: opportunityId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || null,
          uploaded_by: userData.user?.id ?? null,
        });

      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunity-documents-index'] });
      toast.success('Document ajouté');
    },
    onError: (err: Error) => {
      console.error('[useOpportunityDocuments] upload', err);
      toast.error(err.message || "Erreur lors de l'ajout du document");
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: OpportunityDocument) => {
      const { error: dbErr } = await supabase
        .from('crm_opportunity_documents')
        .delete()
        .eq('id', doc.id);
      if (dbErr) throw dbErr;
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunity-documents-index'] });
      toast.success('Document supprimé');
    },
    onError: (err: Error) => {
      console.error('[useOpportunityDocuments] delete', err);
      toast.error('Erreur lors de la suppression');
    },
  });

  const openDocument = async (doc: OpportunityDocument) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60);
    if (error || !data) {
      toast.error('Impossible de générer le lien');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    openDocument,
  };
}
