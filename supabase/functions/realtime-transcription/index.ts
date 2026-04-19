import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  // Authenticate via token query param (WebSocket cannot send Authorization header from browser)
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return new Response("Unauthorized - missing token", { status: 401 });
  }
  const supabaseAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  const { data: userData, error: authErr } = await supabaseAuth.auth.getUser(token);
  if (authErr || !userData?.user) {
    return new Response("Unauthorized - invalid token", { status: 401 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let accumulatedAudio: Uint8Array[] = [];
  let lastMimeType: string = 'audio/webm';

  socket.onopen = () => {
    console.log("WebSocket connection established for real-time transcription");
    socket.send(JSON.stringify({
      type: 'connection',
      status: 'connected'
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('📥 Received message type:', message.type, 'chunk:', message.chunkNumber);
      
      if (message.type === 'audio_chunk_individual') {
        // Process individual chunk immediately
        console.log('🎵 Processing individual chunk:', message.chunkNumber, 'MIME:', message.mimeType, 'size:', message.audioData?.length);
        await processIndividualChunk(socket, message);
      } else if (message.type === 'finalize') {
        // Final transcription with any remaining audio
        console.log('🏁 Finalizing transcription');
        if (message.lastMimeType) {
          lastMimeType = message.lastMimeType;
          console.log('🔍 Using last MIME type for finalization:', lastMimeType);
        }
        await processIndividualChunk(socket, null, true);
      } else if (message.type === 'ping') {
        // Respond to ping to keep connection alive
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  const processIndividualChunk = async (socket: WebSocket, message: any | null, isFinal = false) => {
    if (message && message.audioData) {
      console.log('🔄 Processing individual chunk:', message.chunkNumber, 'MIME:', message.mimeType);
      
      // Store the MIME type for final processing
      if (message.mimeType) {
        lastMimeType = message.mimeType;
      }
      
      // Convert base64 to bytes
      const binaryString = atob(message.audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Process this chunk immediately for incremental results
      await transcribeChunk(socket, bytes, message.mimeType || lastMimeType, false);
      
      // Also accumulate for final result
      accumulatedAudio.push(bytes);
      console.log('📚 Accumulated', accumulatedAudio.length, 'chunks total');
    }

    if (isFinal && accumulatedAudio.length > 0) {
      console.log('🏁 Final processing: transcribing all', accumulatedAudio.length, 'accumulated chunks');
      
      // Combine all chunks for final transcription
      const totalLength = accumulatedAudio.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of accumulatedAudio) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      await transcribeChunk(socket, combinedAudio, lastMimeType, true);
      
      // Send finalization complete message
      socket.send(JSON.stringify({
        type: 'finalized',
        message: 'Transcription finalization complete'
      }));
      
      // Clean up
      accumulatedAudio = [];
    }
  };

  const transcribeChunk = async (socket: WebSocket, audioData: Uint8Array, mimeType: string, isFinal: boolean) => {
    try {
      console.log('🎯 Transcribing chunk, size:', audioData.length, 'MIME:', mimeType, 'isFinal:', isFinal);
      
      // Skip very small chunks (less than 16KB) for incremental results to improve quality
      if (!isFinal && audioData.length < 16384) {
        console.log('⏭️ Skipping small chunk for incremental transcription, size:', audioData.length);
        return;
      }

      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Create blob with correct MIME type
      const audioBlob = new Blob([audioData], { type: mimeType });
      console.log('📦 Created audio blob, size:', audioBlob.size, 'type:', audioBlob.type);

      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${mimeType.split('/')[1]}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr');
      formData.append('response_format', 'verbose_json');

      console.log('🚀 Sending to OpenAI Whisper...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Whisper response:', {
          text: result.text?.substring(0, 100) + (result.text?.length > 100 ? '...' : ''),
          textLength: result.text?.length,
          isFinal
        });
        
        if (result.text && result.text.trim()) {
          const text = result.text.trim();
          
          // Filter out incremental results that are only punctuation or noise
          const isPunctuationOnly = /^[.,!?;:\-\s]*$/.test(text);
          
          if (!isFinal && isPunctuationOnly) {
            console.log('⏭️ Skipping incremental punctuation-only result:', text);
            return;
          }
          
          console.log('📤 Sending transcription result to client, isFinal:', isFinal);
          socket.send(JSON.stringify({
            type: 'transcription_result',
            text: text,
            segments: result.segments,
            isFinal,
            confidence: 0.9
          }));
        } else {
          console.log('⚠️ Empty transcription result from Whisper');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', response.status, errorText);
        
        // Don't throw error for non-final transcriptions to avoid breaking the flow
        if (isFinal) {
          throw new Error(`OpenAI API error: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      
      // Only send error to client for final transcriptions
      if (isFinal) {
        socket.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    }
  };

  socket.onclose = () => {
    console.log("🔌 WebSocket connection closed");
    accumulatedAudio = [];
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return response;
});