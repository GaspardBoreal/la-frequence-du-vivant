import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { audioData, mimeType, chunkNumber, isFinal } = await req.json();
    
    console.log('🎯 HTTP transcription request:', {
      chunkNumber,
      mimeType,
      isFinal,
      audioDataLength: audioData?.length
    });

    if (!audioData) {
      throw new Error('No audio data provided');
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Convert base64 to bytes
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Skip very small chunks for incremental results
    if (!isFinal && bytes.length < 16384) {
      console.log('⏭️ Skipping small chunk for incremental transcription, size:', bytes.length);
      return new Response(JSON.stringify({
        success: true,
        text: '',
        skipped: true,
        reason: 'chunk_too_small'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create audio blob with correct MIME type
    const audioBlob = new Blob([bytes], { type: mimeType || 'audio/webm' });
    console.log('📦 Created audio blob, size:', audioBlob.size, 'type:', audioBlob.type);

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${(mimeType || 'audio/webm').split('/')[1]}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');
    formData.append('response_format', 'verbose_json');

    console.log('🚀 Sending to OpenAI Whisper via HTTP...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Whisper HTTP response:', {
      text: result.text?.substring(0, 100) + (result.text?.length > 100 ? '...' : ''),
      textLength: result.text?.length,
      isFinal
    });

    if (!result.text || !result.text.trim()) {
      console.log('⚠️ Empty transcription result from Whisper');
      return new Response(JSON.stringify({
        success: true,
        text: '',
        empty: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const text = result.text.trim();
    
    // Filter out incremental results that are only punctuation or noise
    const isPunctuationOnly = /^[.,!?;:\-\s]*$/.test(text);
    
    if (!isFinal && isPunctuationOnly) {
      console.log('⏭️ Skipping incremental punctuation-only result:', text);
      return new Response(JSON.stringify({
        success: true,
        text: '',
        skipped: true,
        reason: 'punctuation_only'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      text,
      segments: result.segments,
      isFinal,
      confidence: 0.9,
      chunkNumber
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ HTTP transcription error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});