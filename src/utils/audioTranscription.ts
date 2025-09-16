import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionResult {
  success: boolean;
  audioId: string;
  transcription?: {
    text: string;
    confidence: number;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  };
  error?: string;
}

export const transcribeAudio = async (
  audioId: string,
  audioBlob: Blob,
  modelId?: string,
  language: string = 'fr',
  mode: 'immediate' | 'deferred' = 'deferred'
): Promise<TranscriptionResult> => {
  try {
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    const chunkSize = 32768;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binaryString);

    // Call the transcription Edge Function
    const { data, error } = await supabase.functions.invoke('audio-transcription', {
      body: {
        audioId,
        audioData: base64Audio,
        modelId,
        language,
        mode
      }
    });

    if (error) {
      console.error('Transcription error:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    return {
      success: false,
      audioId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getTranscriptionStatus = async (audioId: string) => {
  const { data, error } = await supabase
    .from('marche_audio')
    .select('transcription_status, transcription_text, transcription_model, transcription_confidence, transcription_segments, transcription_created_at')
    .eq('id', audioId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};