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
      
      if (message.type === 'audio_chunk') {
        // Accumulate audio chunks
        const audioData = message.audioData; // base64
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        accumulatedAudio.push(bytes);
        
        // Send transcription every few chunks or when enough audio is accumulated
        if (accumulatedAudio.length >= 3 && !isTranscribing) {
          await processAccumulatedAudio(socket);
        }
      } else if (message.type === 'finalize') {
        // Final transcription with all accumulated audio
        await processAccumulatedAudio(socket, true);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  const processAccumulatedAudio = async (socket: WebSocket, isFinal = false) => {
    if (accumulatedAudio.length === 0 || isTranscribing) return;
    
    isTranscribing = true;
    
    try {
      // Combine all accumulated audio chunks
      const totalLength = accumulatedAudio.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of accumulatedAudio) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Transcribe with OpenAI
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        throw new Error('OpenAI API key not configured');
      }

      const formData = new FormData();
      const audioBlob = new Blob([combinedAudio], { type: 'audio/webm' });
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
        
        socket.send(JSON.stringify({
          type: 'transcription_result',
          text: result.text,
          segments: result.segments,
          isFinal,
          confidence: 0.9
        }));
        
        // Clear processed audio if not final
        if (!isFinal) {
          accumulatedAudio = [];
        }
      } else {
        throw new Error(`OpenAI API error: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
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