import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { validateAuth, corsHeaders, forbiddenResponse, createServiceClient } from "../_shared/auth-helper.ts";

interface TranscriptionRequest {
  audioId: string;
  audioData: string; // base64 encoded
  modelId?: string;
  language?: string;
  mode?: 'immediate' | 'deferred';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication for audio transcription
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    
    if (errorResponse) {
      return errorResponse;
    }
    
    if (!isAdmin) {
      return forbiddenResponse('Admin access required for audio transcription');
    }

    // Initialize Supabase client with service role for database operations
    const supabase = createServiceClient();

    const { audioId, audioData, modelId, language = 'fr', mode = 'immediate' }: TranscriptionRequest = await req.json();

    if (!audioId || !audioData) {
      throw new Error('audioId and audioData are required');
    }

    console.log(`Starting transcription for audio ${audioId} with mode ${mode}`);

    // Update status to processing
    await supabase
      .from('marche_audio')
      .update({ 
        transcription_status: 'processing',
        transcription_model: modelId || 'whisper-1'
      })
      .eq('id', audioId);

    // Get transcription model configuration - force OpenAI Whisper as default
    let modelConfig;
    if (modelId) {
      const { data: model } = await supabase
        .from('transcription_models')
        .select('*')
        .eq('id', modelId)
        .eq('provider', 'openai') // Only allow OpenAI models for now
        .maybeSingle();
      
      modelConfig = model;
    }
    
    // Always default to OpenAI Whisper if no model found or no modelId provided
    if (!modelConfig) {
      modelConfig = {
        id: 'default-whisper',
        name: 'OpenAI Whisper',
        provider: 'openai',
        model_identifier: 'whisper-1',
        is_active: true,
        supports_realtime: false,
        languages: ['fr', 'en'],
        config: {}
      };
    }

    let transcriptionResult;

    // Handle different providers
    if (modelConfig.provider === 'openai') {
      transcriptionResult = await transcribeWithOpenAI(audioData, modelConfig, language);
    } else if (modelConfig.provider === 'huggingface') {
      transcriptionResult = await transcribeWithHuggingFace(audioData, modelConfig, language);
    } else {
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    // Update database with transcription result
    const updateData = {
      transcription_status: 'completed',
      transcription_text: transcriptionResult.text,
      transcription_confidence: transcriptionResult.confidence,
      transcription_created_at: new Date().toISOString(),
      transcription_segments: transcriptionResult.segments || null
    };

    const { error: updateError } = await supabase
      .from('marche_audio')
      .update(updateData)
      .eq('id', audioId);

    if (updateError) {
      console.error('Error updating transcription:', updateError);
      throw updateError;
    }

    console.log(`Transcription completed for audio ${audioId}`);

    return new Response(JSON.stringify({
      success: true,
      audioId,
      transcription: transcriptionResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Update status to failed if we have an audioId
    const body = await req.json().catch(() => ({}));
    if (body.audioId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase
        .from('marche_audio')
        .update({ transcription_status: 'failed' })
        .eq('id', body.audioId);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function transcribeWithOpenAI(audioData: string, modelConfig: any, language: string) {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Convert base64 to binary
  const binaryString = atob(audioData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create FormData
  const formData = new FormData();
  const audioBlob = new Blob([bytes], { type: 'audio/webm' });
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', language);
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const result = await response.json();
  
  return {
    text: result.text,
    confidence: 0.9, // OpenAI doesn't provide confidence scores
    segments: result.segments?.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text
    })) || []
  };
}

async function transcribeWithHuggingFace(audioData: string, modelConfig: any, language: string) {
  // This is a placeholder for HuggingFace API integration
  // For now, we'll throw an error as HuggingFace requires different handling
  throw new Error('HuggingFace transcription not yet implemented in this version');
}