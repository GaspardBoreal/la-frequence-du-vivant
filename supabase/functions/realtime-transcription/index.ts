import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let accumulatedAudio: Uint8Array[] = [];
  let isTranscribing = false;

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
      
      if (message.type === 'audio_chunk_webm') {
        // Process WebM chunk immediately
        console.log('Received WebM chunk:', message.chunkNumber, 'size:', message.audioData?.length);
        await processWebMChunk(socket, message.audioData, false);
      } else if (message.type === 'finalize') {
        // Final transcription with any remaining audio
        console.log('Finalizing transcription');
        await processWebMChunk(socket, null, true);
      } else if (message.type === 'ping') {
        // Respond to ping to keep connection alive
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Send error but don't close socket
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  const processWebMChunk = async (socket: WebSocket, audioData: string | null, isFinal = false) => {
    if (isTranscribing && !isFinal) return; // Skip if already processing, unless final
    
    isTranscribing = true;
    
    try {
      let audioBlob: Blob;
      
      if (audioData) {
        // Convert base64 WebM chunk to Blob
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: 'audio/webm' });
      } else if (accumulatedAudio.length > 0) {
        // Use accumulated audio for final transcription
        const totalLength = accumulatedAudio.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedAudio = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of accumulatedAudio) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }
        audioBlob = new Blob([combinedAudio], { type: 'audio/webm' });
      } else {
        console.log('No audio data to process');
        isTranscribing = false;
        return;
      }

      console.log('Processing audio blob, size:', audioBlob.size, 'isFinal:', isFinal);

      // Transcribe with OpenAI
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error('OpenAI API key not configured');
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Transcription result:', result.text);
        
        socket.send(JSON.stringify({
          type: 'transcription_result',
          text: result.text,
          segments: result.segments,
          isFinal,
          confidence: 0.9
        }));
        
        // Store chunk if not final, for potential final processing
        if (!isFinal && audioData) {
          const binaryString = atob(audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          accumulatedAudio.push(bytes);
        } else if (isFinal) {
          accumulatedAudio = [];
        }
      } else {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${errorText}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Send error but don't close socket - let client handle it
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    } finally {
      isTranscribing = false;
    }
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
    accumulatedAudio = [];
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return response;
});