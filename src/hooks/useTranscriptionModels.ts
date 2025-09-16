import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionModel {
  id: string;
  name: string;
  provider: string;
  model_identifier: string;
  is_active: boolean;
  supports_realtime: boolean;
  languages: string[];
  config: Record<string, any>;
}

export const useTranscriptionModels = () => {
  return useQuery({
    queryKey: ['transcription-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcription_models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data as TranscriptionModel[];
    },
  });
};